# AI Agent Architecture Documentation

## Overview

The DB Builder AI Agent is a microservice-based system that integrates AI-powered database design capabilities into the DB Builder application. It uses Ollama with LLM models to understand natural language commands and execute database schema operations.

## Architecture

### Microservice Design

The system follows a microservice architecture with three main components:

```
┌─────────────────┐
│   Frontend      │
│  (React + TS)   │
└────────┬────────┘
         │
         ├────────────────────────┬─────────────────────────┐
         │                        │                         │
         ▼                        ▼                         ▼
┌────────────────┐       ┌────────────────┐       ┌───────────────┐
│  DB Builder    │       │  AI Agent      │       │    Ollama     │
│   Backend      │       │  Service       │       │  LLM Server   │
│  (Port 3000)   │       │  (Port 3001)   │       │ (Port 11434)  │
└────────────────┘       └────────┬───────┘       └───────────────┘
                                  │
                                  ▼
                         ┌────────────────┐
                         │  DB Builder    │
                         │     Tools      │
                         └────────────────┘
```

### Components

#### 1. AI Agent Service (Port 3001)

**Location**: `/ai-agent-service`

**Technology Stack**:
- TypeScript/Node.js
- Fastify (web framework)
- Ollama (LLM integration)

**Responsibilities**:
- Process natural language commands from users
- Translate commands into database operations using LLM
- Execute operations via DB Builder Tools
- Return updated workspace state

**Key Files**:
- `src/index.ts` - Main server with API endpoints
- `src/agent.ts` - AI Agent core logic with Ollama integration
- `src/tools/dbBuilderTools.ts` - Database manipulation tools
- `src/types/agent.ts` - TypeScript type definitions

**API Endpoints**:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check and Ollama connection status |
| `/agent/chat` | POST | Process natural language commands |
| `/agent/capabilities` | GET | List available tools and capabilities |
| `/agent/model` | GET | Get current model information |

#### 2. Ollama Service (Port 11434)

**Purpose**: LLM backend that runs quantized language models

**GPU Compatibility**: 
- RTX 3050 (8GB VRAM) compatible
- Recommended models:
  - `llama3.2:3b` - 2GB VRAM (fastest)
  - `llama3.2` - 4.7GB VRAM (balanced)
  - `mistral:7b` - 4.1GB VRAM (better reasoning)
  - `codellama:7b` - 3.8GB VRAM (SQL optimized)

#### 3. Frontend Integration

**Location**: `/frontend/src/components/AIAgentPanel.tsx`

**Features**:
- Chat interface in WorkStation
- Real-time workspace updates
- Connection status monitoring
- Conversation history

**Integration Points**:
- Integrated into WorkStation component only
- No changes to existing pages (Home, Login, Register, Dashboard)
- Uses Zustand store for state management

## Data Flow

### 1. User Command Flow

```
User types command
    ↓
Frontend (AIAgentPanel)
    ↓
POST /agent/chat
    ↓
AI Agent Service
    ↓
Ollama LLM (analyzes command)
    ↓
DB Builder Tools (executes operations)
    ↓
Updated workspace state
    ↓
Frontend updates UI
```

### 2. Workspace State Synchronization

The AI agent operates on a workspace state that mirrors the Zustand store:

```typescript
interface WorkspaceState {
  tables: DBTable[];
  relations: Relation[];
}
```

**Flow**:
1. Frontend sends current workspace state with each command
2. Agent processes command and modifies workspace
3. Agent returns updated workspace state
4. Frontend updates Zustand store with new state

## Tools System

The AI agent has access to the following tools:

### create_table
Creates a new table with columns.

```json
{
  "type": "create_table",
  "parameters": {
    "name": "users",
    "columns": [
      { "name": "id", "type": "UUID", "isPrimary": true },
      { "name": "email", "type": "TEXT", "isUnique": true }
    ]
  }
}
```

### create_relation
Creates a relationship between two tables.

```json
{
  "type": "create_relation",
  "parameters": {
    "fromTable": "posts",
    "fromColumn": "user_id",
    "toTable": "users",
    "toColumn": "id",
    "cardinality": "one-to-many",
    "deleteRule": "cascade"
  }
}
```

### complex_schema
Creates multiple tables and relations at once.

```json
{
  "type": "complex_schema",
  "parameters": {
    "tables": [...],
    "relations": [...]
  }
}
```

## Security Considerations

### Isolation
- AI Agent service runs in separate process/container
- No direct database access
- Operates only on workspace state (in-memory)

### Input Validation
- All workspace modifications validated by DB Builder Tools
- Foreign key constraints checked before relation creation
- Table/column names sanitized

### No Impact on Existing Functionality
- AI Agent is opt-in (user clicks button to open)
- All existing pages remain unchanged
- No breaking changes to current workflows

## Deployment

### Development

```bash
# Terminal 1: Start Ollama
ollama serve

# Terminal 2: Pull model
ollama pull llama3.2

# Terminal 3: Start AI Agent Service
cd ai-agent-service
npm install
npm run dev

# Terminal 4: Start Frontend
cd frontend
npm run dev
```

### Production (Docker Compose)

```bash
docker-compose up
```

This starts:
- Ollama with GPU support
- AI Agent Service
- DB Builder Backend

### Environment Variables

**AI Agent Service** (`.env`):
```
OLLAMA_HOST=http://localhost:11434
MODEL_NAME=llama3.2
PORT=3001
```

**Frontend** (`.env`):
```
VITE_AGENT_API_URL=http://localhost:3001
```

## Performance Optimization

### Model Selection
For RTX 3050 (8GB VRAM), use smaller models:
- Development: `llama3.2:3b` (fastest)
- Production: `llama3.2` or `mistral:7b` (better quality)

### Caching
- Ollama caches model in memory
- First request may be slow (~2-5s)
- Subsequent requests faster (~0.5-1s)

### Streaming (Future Enhancement)
Current implementation uses non-streaming responses for simplicity. 
Future versions could implement streaming for better UX.

## Testing

### Manual Testing

1. Start all services
2. Open WorkStation in browser
3. Click "AI Assistant" button
4. Try commands:
   - "Create a users table with id, email, and name"
   - "Add a posts table related to users"
   - "Create an e-commerce database with products, orders, and customers"

### Health Check

```bash
# Check AI Agent Service
curl http://localhost:3001/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-...",
  "ollama": {
    "healthy": true,
    "model": "llama3.2"
  }
}
```

## Troubleshooting

### Issue: AI Agent not connecting

**Symptoms**: Red dot in UI, "AI Agent service is not connected"

**Solutions**:
1. Check if service is running: `curl http://localhost:3001/health`
2. Check logs: `docker-compose logs ai-agent`
3. Verify environment variables

### Issue: Ollama not responding

**Symptoms**: Health check shows `ollama.healthy: false`

**Solutions**:
1. Check Ollama is running: `curl http://localhost:11434/api/tags`
2. Pull model: `ollama pull llama3.2`
3. Check GPU drivers (for GPU mode)

### Issue: Slow responses

**Causes**:
- First request (model loading)
- Large model on limited GPU
- Complex workspace state

**Solutions**:
- Use smaller model (`llama3.2:3b`)
- Keep Ollama running (don't restart)
- Simplify commands for complex workspaces

## Future Enhancements

1. **Streaming Responses**: Real-time token streaming for better UX
2. **Conversation Memory**: Persistent chat history across sessions
3. **Schema Validation**: AI-powered schema validation and suggestions
4. **Index Recommendations**: Automatic index strategy suggestions
5. **Query Optimization**: Suggest query optimizations based on schema
6. **Multi-language Support**: Support for multiple database dialects
7. **Voice Commands**: Voice-to-schema capabilities

## Maintenance

### Updating Models

```bash
# Pull latest version
ollama pull llama3.2

# List installed models
ollama list

# Remove old models
ollama rm <model-name>
```

### Monitoring

Key metrics to monitor:
- Response time (target: <2s)
- Error rate (target: <1%)
- Ollama memory usage
- GPU utilization

### Logs

```bash
# AI Agent Service logs
docker-compose logs -f ai-agent

# Ollama logs
docker-compose logs -f ollama
```

## License

This AI Agent integration follows the same license as the main DB Builder project.
