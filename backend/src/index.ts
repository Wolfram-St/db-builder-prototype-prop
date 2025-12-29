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

  // 1. GENERATE FILE NAME
  const fileName = `schema_${Date.now()}.sql`;
  
  try {
    // Write file to current folder (Works on Windows & Render)
    await fs.writeFile(fileName, desiredSql);

    // 2. BUILD THE SAFE URL (The Magic Part)
    // We get the current full folder path
    let cwd = process.cwd();
    
    // IF WINDOWS: Replace backslashes (\) with forward slashes (/) 
    // G:\Code\Project -> G:/Code/Project
    if (process.platform === 'win32') {
      cwd = cwd.replace(/\\/g, '/');
    }

    // Construct the URL. 
    // On Windows: file://G:/Code/Project/schema.sql
    // On Render:  file:///app/backend/schema.sql
    const safeUrl = `file://${cwd}/${fileName}`;
    
    console.log("Environment:", process.platform);
    console.log("Target URL:", safeUrl);

    // 3. DEFINE COMMAND
    const args = [
      'schema', 'diff',
      '--from', targetDbUrl,
      '--to', safeUrl,
      '--dev-url', shadowDbUrl,
      '--format', 'sql'
    ];

    // On Render/Linux, the command is just 'atlas'
    // On Windows, we look for 'atlas.exe' or 'atlas'
    const cmd = process.platform === 'win32' ? 'atlas.exe' : 'atlas';

    // 4. SPAWN PROCESS
    return new Promise((resolve) => {
      const child = spawn(cmd, args);

      let stdoutData = '';
      let stderrData = '';

      child.stdout.on('data', (d) => { stdoutData += d.toString(); });
      child.stderr.on('data', (d) => { stderrData += d.toString(); });

      child.on('close', async (code) => {
        // CLEANUP FILE
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