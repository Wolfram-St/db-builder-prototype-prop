// AI Agent Service - Main server
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { AIAgent } from './agent.js';
import type { ChatRequest, WorkspaceState, AgentMessage } from './types/agent.js';

const server = Fastify({ logger: true });

// Get configuration from environment
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const MODEL_NAME = process.env.MODEL_NAME || 'llama3.2';
const PORT = Number(process.env.PORT || 3001);

// Initialize AI Agent
const agent = new AIAgent(OLLAMA_HOST, MODEL_NAME);

/* ----------------------------------
   PLUGINS
----------------------------------- */

server.register(cors, { origin: true });

/* ----------------------------------
   HEALTH CHECK
----------------------------------- */

server.get('/health', async () => {
  const ollamaHealth = await agent.healthCheck();
  return {
    status: 'ok',
    timestamp: new Date(),
    ollama: ollamaHealth
  };
});

/* ----------------------------------
   ROUTE: AGENT CHAT
----------------------------------- */

interface ChatBody {
  message: string;
  workspaceState: WorkspaceState;
  conversationHistory?: AgentMessage[];
}

server.post<{ Body: ChatBody }>('/agent/chat', async (request, reply) => {
  const { message, workspaceState, conversationHistory } = request.body;

  if (!message || !workspaceState) {
    return reply.status(400).send({ 
      error: 'Missing required fields: message and workspaceState' 
    });
  }

  try {
    const response = await agent.processCommand(
      message,
      workspaceState,
      conversationHistory || []
    );

    return reply.send(response);
  } catch (error: any) {
    server.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Agent processing failed',
      message: error.message
    });
  }
});

/* ----------------------------------
   ROUTE: AGENT CAPABILITIES
----------------------------------- */

server.get('/agent/capabilities', async () => {
  return {
    tools: [
      {
        name: 'create_table',
        description: 'Create a new table with columns',
        parameters: {
          name: 'string',
          columns: 'array of column objects'
        }
      },
      {
        name: 'add_column',
        description: 'Add a column to an existing table',
        parameters: {
          tableId: 'string',
          column: 'column object'
        }
      },
      {
        name: 'create_relation',
        description: 'Create a relationship between two tables',
        parameters: {
          fromTable: 'string',
          fromColumn: 'string',
          toTable: 'string',
          toColumn: 'string',
          cardinality: 'one-to-one | one-to-many | many-to-many',
          deleteRule: 'cascade | restrict | set-null',
          updateRule: 'cascade | restrict | set-null'
        }
      },
      {
        name: 'complex_schema',
        description: 'Create multiple tables and relations at once',
        parameters: {
          tables: 'array of table specifications',
          relations: 'array of relation specifications'
        }
      },
      {
        name: 'update_table',
        description: 'Update table properties',
        parameters: {
          tableId: 'string',
          newName: 'string'
        }
      },
      {
        name: 'delete_table',
        description: 'Delete a table and its relations',
        parameters: {
          tableId: 'string'
        }
      }
    ],
    supportedDataTypes: ['UUID', 'TEXT', 'INTEGER', 'BOOLEAN', 'TIMESTAMP', 'JSON'],
    supportedCardinalities: ['one-to-one', 'one-to-many', 'many-to-many'],
    supportedRules: ['cascade', 'restrict', 'set-null']
  };
});

/* ----------------------------------
   ROUTE: MODEL INFO
----------------------------------- */

server.get('/agent/model', async () => {
  const health = await agent.healthCheck();
  return {
    model: MODEL_NAME,
    host: OLLAMA_HOST,
    healthy: health.healthy,
    error: health.error
  };
});

/* ----------------------------------
   START SERVER
----------------------------------- */

const start = async () => {
  try {
    await server.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🤖 AI Agent Service running at http://localhost:${PORT}`);
    console.log(`📊 Using Ollama at ${OLLAMA_HOST} with model ${MODEL_NAME}`);
    
    // Check Ollama health on startup
    const health = await agent.healthCheck();
    if (health.healthy) {
      console.log(`✅ Ollama is healthy and model ${MODEL_NAME} is available`);
    } else {
      console.warn(`⚠️  Ollama health check failed: ${health.error}`);
      console.warn(`   Please ensure Ollama is running and the model is pulled`);
    }
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
