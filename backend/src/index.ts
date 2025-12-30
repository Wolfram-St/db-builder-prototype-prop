import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import fs from 'fs/promises';

import { generateSQL } from './lib/sqlGenerator.js';
import type { DBTable, Relation } from './types/schema.js';

const server = Fastify({ logger: true });

/* ----------------------------------
   TYPES
----------------------------------- */

interface DeployBody {
  desiredSql: string;
  targetDbUrl: string;
}

interface GenerateSQLBody {
  tables: DBTable[];
  relations: Relation[];
}

/* ----------------------------------
   PLUGINS
----------------------------------- */

server.register(cors, { origin: true });

/* ----------------------------------
   HEALTH
----------------------------------- */

server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date() };
});

/* ----------------------------------
   ENV HELPERS
----------------------------------- */

const getShadowDbUrl = (): string => {
  const url = process.env.SHADOW_DB_URL;
  if (!url) {
    throw new Error('SHADOW_DB_URL is missing in .env');
  }
  return url;
};

/* ----------------------------------
   ROUTE: GENERATE SQL (Knex)
----------------------------------- */

server.post<{ Body: GenerateSQLBody }>('/sql/generate', async (request, reply) => {
  const { tables, relations } = request.body;

  if (!tables || !relations) {
    return reply.status(400).send({ error: 'Missing schema input' });
  }

  try {
    const sql = generateSQL(tables, relations);
    return reply.send({ success: true, sql });
  } catch (e: any) {
    server.log.error(e);
    return reply.status(500).send({
      success: false,
      error: 'SQL generation failed',
      message: e.message
    });
  }
});

/* ----------------------------------
   ROUTE: PLAN
----------------------------------- */

server.post<{ Body: DeployBody }>('/deploy/plan', async (request, reply) => {
  const { desiredSql, targetDbUrl } = request.body;

  if (!desiredSql || !targetDbUrl) {
    return reply.status(400).send({ error: 'Missing Input' });
  }

  let shadowDbUrl: string;
  try {
    shadowDbUrl = getShadowDbUrl();
  } catch (e: any) {
    return reply.status(500).send({ error: e.message });
  }

  const fileName = `schema_${Date.now()}.sql`;

  try {
    await fs.writeFile(fileName, desiredSql);

    let cwd = process.cwd();
    if (process.platform === 'win32') cwd = cwd.replace(/\\/g, '/');

    const schemaFileUrl = `file://${cwd}/${fileName}`;

    const args: string[] = [
      'schema',
      'diff',
      '--from',
      targetDbUrl,
      '--to',
      schemaFileUrl,
      '--dev-url',
      shadowDbUrl,
      '--schema',
      'public'
    ];

    const cmd = process.platform === 'win32' ? 'atlas.exe' : 'atlas';

    const result = await new Promise((resolve) => {
      const child = spawn(cmd, args) as ChildProcessWithoutNullStreams;

      let stdoutData = '';
      let stderrData = '';

      child.stdout.on('data', (d: Buffer) => (stdoutData += d.toString()));
      child.stderr.on('data', (d: Buffer) => (stderrData += d.toString()));

      child.on('close', async (code: number | null) => {
        try {
          await fs.unlink(fileName);
        } catch { }

        if (code !== 0 && stderrData.length > 0) {
          resolve({
            success: false,
            error: 'Migration failed',
            details: stderrData
          });
        } else {
          resolve({
            success: true,
            plan:
              stdoutData.trim().length === 0
                ? '-- Database is up to date'
                : stdoutData
          });
        }
      });
    });

    return reply.send(result);
  } catch (e: any) {
    try {
      await fs.unlink(fileName);
    } catch { }
    return reply.status(500).send({ success: false, error: e.message });
  }
});

/* ----------------------------------
   ROUTE: INSPECT (Updated with Debugging)
----------------------------------- */
server.post<{ Body: { targetDbUrl: string } }>('/deploy/inspect', async (request, reply) => {
  const { targetDbUrl } = request.body;

  if (!targetDbUrl) return reply.status(400).send({ error: 'Missing Database URL' });

  let shadowDbUrl: string;
  try { shadowDbUrl = getShadowDbUrl(); }
  catch (e: any) { return reply.status(500).send({ error: e.message }); }

  try {
    const args: string[] = [
      'schema', 'inspect',
      '--url', targetDbUrl,
      '--dev-url', shadowDbUrl,
      '--format', '{{ json . }}', // Ensure this is exactly '{{ json . }}'
      '--schema', 'public'
    ];

    const cmd = process.platform === 'win32' ? 'atlas.exe' : 'atlas';

    const jsonOutput = await new Promise<string>((resolve, reject) => {
      const child = spawn(cmd, args) as ChildProcessWithoutNullStreams;
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (d: Buffer) => (stdout += d.toString()));
      child.stderr.on('data', (d: Buffer) => (stderr += d.toString()));

      child.on('close', (code: number | null) => {
        if (code !== 0) {
          console.error("Atlas Inspect Failed:", stderr); // <--- LOG ERROR
          reject(new Error(stderr || 'Inspection failed'));
        } else {
          resolve(stdout);
        }
      });
    });

    // --- DEBUG LOGGING ---
    console.log("RAW ATLAS OUTPUT:", jsonOutput);

    // Handle potential empty output or non-JSON text
    if (!jsonOutput || jsonOutput.trim() === "json") {
      throw new Error("Atlas returned invalid output: " + jsonOutput);
    }

    return reply.send(JSON.parse(jsonOutput));

  } catch (e: any) {
    server.log.error(e);
    return reply.status(500).send({
      success: false,
      error: 'Inspection failed',
      message: e.message
    });
  }
});

/* ----------------------------------
   ROUTE: APPLY
----------------------------------- */

server.post<{ Body: DeployBody }>('/deploy/apply', async (request, reply) => {
  const { desiredSql, targetDbUrl } = request.body;

  if (!desiredSql || !targetDbUrl) {
    return reply.status(400).send({ error: 'Missing Input' });
  }

  let shadowDbUrl: string;
  try {
    shadowDbUrl = getShadowDbUrl();
  } catch (e: any) {
    return reply.status(500).send({ error: e.message });
  }

  const fileName = `apply_${Date.now()}.sql`;

  try {
    await fs.writeFile(fileName, desiredSql);

    let cwd = process.cwd();
    if (process.platform === 'win32') cwd = cwd.replace(/\\/g, '/');

    const schemaFileUrl = `file://${cwd}/${fileName}`;

    const args: string[] = [
      'schema',
      'apply',
      '--url',
      targetDbUrl,
      '--to',
      schemaFileUrl,
      '--dev-url',
      shadowDbUrl,
      '--schema',
      'public',
      '--auto-approve'
    ];

    const cmd = process.platform === 'win32' ? 'atlas.exe' : 'atlas';

    const result = await new Promise((resolve) => {
      const child = spawn(cmd, args) as ChildProcessWithoutNullStreams;

      let stderrData = '';

      child.stderr.on('data', (d: Buffer) => (stderrData += d.toString()));

      child.on('close', async (code: number | null) => {
        try {
          await fs.unlink(fileName);
        } catch { }

        if (code !== 0) {
          resolve({
            success: false,
            error: 'Apply Failed',
            message: stderrData
          });
        } else {
          resolve({
            success: true,
            message: 'Database successfully updated!'
          });
        }
      });
    });

    if (!(result as any).success) {
      return reply.status(500).send(result);
    }

    return reply.send(result);
  } catch (e: any) {
    try {
      await fs.unlink(fileName);
    } catch { }
    return reply.status(500).send({
      error: 'Server Error',
      message: e.message
    });
  }
});

/* ----------------------------------
   START SERVER
----------------------------------- */

const start = async () => {
  try {
    const port = Number(process.env.PORT || 3000);
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server running at http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
