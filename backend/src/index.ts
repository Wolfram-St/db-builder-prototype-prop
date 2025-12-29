import 'dotenv/config'; 
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import dns from 'dns/promises'; // <--- NEW IMPORT
import { URL } from 'url';      // <--- NEW IMPORT

const server = Fastify({ logger: true });

interface DeployBody {
  desiredSql: string;
  targetDbUrl: string;
}

server.register(cors, { origin: true });

server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date() };
});

// --- HELPER: Force IPv4 Resolution ---
// This solves the "network unreachable" IPv6 error by manually resolving the domain
async function forceIPv4(connectionString: string): Promise<string> {
  try {
    const parsed = new URL(connectionString);
    const hostname = parsed.hostname;

    // If it's already an IP (like 127.0.0.1), skip resolution
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    if (isIp) return connectionString;

    console.log(`Resolving IP for: ${hostname}`);
    
    // Resolve to the first IPv4 address found
    const addresses = await dns.resolve4(hostname);
    if (!addresses || addresses.length === 0) {
      throw new Error(`Could not resolve IPv4 for ${hostname}`);
    }

    const ipv4 = addresses[0];
    console.log(`Resolved ${hostname} -> ${ipv4}`);

    // Update the hostname in the URL object
    parsed.hostname = ipv4;
    return parsed.toString();

  } catch (error) {
    console.error("DNS Resolution Failed:", error);
    // Fallback: Return original string if resolution fails
    return connectionString;
  }
}

server.post<{ Body: DeployBody }>('/deploy/plan', async (request, reply) => {
  const { desiredSql, targetDbUrl } = request.body;
  const shadowDbUrl = process.env.SHADOW_DB_URL;

  if (!desiredSql || !targetDbUrl) return reply.status(400).send({ error: "Missing Input" });
  if (!shadowDbUrl) return reply.status(500).send({ error: "Missing Shadow DB URL" });

  const fileName = `schema_${Date.now()}.sql`;
  
  try {
    await fs.writeFile(fileName, desiredSql);

    // 1. RESOLVE DATABASE URLs TO IPv4
    // We do this for both Target and Shadow DBs to be safe
    const safeTargetUrl = await forceIPv4(targetDbUrl);
    const safeShadowUrl = await forceIPv4(shadowDbUrl);

    // 2. PREPARE FILE URL
    let cwd = process.cwd();
    if (process.platform === 'win32') cwd = cwd.replace(/\\/g, '/');
    const schemaFileUrl = `file://${cwd}/${fileName}`;
    
    // 3. RUN ATLAS
    const args = [
      'schema', 'diff',
      '--from', safeTargetUrl,  // Using the IPv4 URL
      '--to', schemaFileUrl,
      '--dev-url', safeShadowUrl, // Using the IPv4 URL
      '--format', 'sql'
    ];

    const cmd = process.platform === 'win32' ? 'atlas.exe' : 'atlas';

    return new Promise((resolve) => {
      const child = spawn(cmd, args);

      let stdoutData = '';
      let stderrData = '';

      child.stdout.on('data', (d) => { stdoutData += d.toString(); });
      child.stderr.on('data', (d) => { stderrData += d.toString(); });

      child.on('close', async (code) => {
        try { await fs.unlink(fileName); } catch {}

        if (code !== 0 && stderrData.length > 0) {
          console.error("Atlas Error:", stderrData);
          resolve(reply.status(500).send({ success: false, error: "Migration failed", details: stderrData }));
        } else {
          resolve({ success: true, plan: stdoutData });
        }
      });
    });

  } catch (error: any) {
    try { await fs.unlink(fileName).catch(() => {}); } catch {}
    server.log.error(error);
    return reply.status(500).send({ success: false, error: "Server Error", details: error.message });
  }
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server running at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};
start();