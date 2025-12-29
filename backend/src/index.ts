import 'dotenv/config'; 
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const server = Fastify({ logger: true });

interface DeployBody {
  desiredSql: string;
  targetDbUrl: string;
}

server.register(cors, { origin: true });

server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date() };
});

server.post<{ Body: DeployBody }>('/deploy/plan', async (request, reply) => {
  const { desiredSql, targetDbUrl } = request.body;
  const shadowDbUrl = process.env.SHADOW_DB_URL;

  if (!desiredSql || !targetDbUrl) return reply.status(400).send({ error: "Missing Input" });
  if (!shadowDbUrl) return reply.status(500).send({ error: "Missing Shadow DB URL" });

  // 1. GENERATE SAFE FILENAME
  const fileName = `schema_${Date.now()}.sql`;
  
  try {
    await fs.writeFile(fileName, desiredSql);

    // 2. GENERATE SAFE URL (No manual DNS hacking)
    // We let the OS and Atlas handle networking naturally.
    // This ensures Neon (SNI) and AWS work perfectly.
    let cwd = process.cwd();
    if (process.platform === 'win32') cwd = cwd.replace(/\\/g, '/');
    const schemaFileUrl = `file://${cwd}/${fileName}`;
    
    // 3. RUN ATLAS
    const args = [
      'schema', 'diff',
      '--from', targetDbUrl,
      '--to', schemaFileUrl,
      '--dev-url', shadowDbUrl,
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
        // Cleanup
        try { await fs.unlink(fileName); } catch {}

        if (code !== 0 && stderrData.length > 0) {
          console.error("Atlas Failed:", stderrData);

          // --- SMART ERROR HANDLING (The Production Fix) ---
          let userMessage = "Migration calculation failed.";
          
          // Detect Supabase IPv6 Error
          if (stderrData.includes("network is unreachable") || stderrData.includes("dial tcp")) {
            if (targetDbUrl.includes("supabase.co")) {
              userMessage = "Connection Failed: You are using a Supabase 'Direct' URL which is IPv6-only. Please use the 'Connection Pooler' URL (port 6543) instead.";
            } else {
              userMessage = "Network Unreachable: The database URL is not accessible from this server.";
            }
          }
          // Detect Neon SNI Error (Endpoint ID)
          else if (stderrData.includes("Endpoint ID is not specified")) {
            userMessage = "Connection Failed: Neon DB requires a hostname for SNI. Do not use an IP address.";
          }

          resolve(reply.status(400).send({ 
            success: false, 
            error: userMessage, // Send the readable message to Frontend
            details: stderrData 
          }));

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