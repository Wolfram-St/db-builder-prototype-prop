# AI Agent Service

This microservice provides AI-powered database schema design capabilities using Ollama and LLMs.

## Features

- Natural language to database schema conversion
- Complex schema design with relationships, indexes, and constraints
- Integration with db-builder workspace tools
- RTX 3050 compatible (uses Ollama with quantized models)

## Prerequisites

1. **Ollama** must be installed and running
   - Install from: https://ollama.ai
   - Default runs on `http://localhost:11434`

2. **Model** - Pull a compatible model (recommended for RTX 3050):
   ```bash
   ollama pull llama3.2
   # or for better performance
   ollama pull llama3.2:3b
   ```

## Installation

```bash
cd ai-agent-service
npm install
```

## Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` to configure:

- `OLLAMA_HOST`: Ollama server URL (default: http://localhost:11434)
- `MODEL_NAME`: Model to use (default: llama3.2)
- `PORT`: Service port (default: 3001)

## Running

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t ai-agent-service .
docker run -p 3001:3001 --env-file .env ai-agent-service
```

## API Endpoints

### POST /agent/chat
Process a natural language command and execute database operations.

**Request:**
```json
{
  "message": "Create a users table with id, email, and name fields",
  "workspaceState": {
    "tables": [],
    "relations": []
  },
  "conversationHistory": []
}
```

**Response:**
```json
{
  "success": true,
  "message": "Created users table with 3 columns",
  "actions": [...],
  "workspace": {...}
}
```

### GET /agent/capabilities
Get information about available tools and capabilities.

### GET /agent/model
Get information about the current model and Ollama connection.

### GET /health
Health check endpoint.

## Supported Models for RTX 3050

The RTX 3050 has 8GB VRAM. Recommended models:

- `llama3.2:3b` - Fastest, good for basic operations (2GB VRAM)
- `llama3.2` - Balanced performance (4.7GB VRAM)
- `mistral:7b` - Better reasoning (4.1GB VRAM)
- `codellama:7b` - Optimized for code/SQL (3.8GB VRAM)

## Architecture

This service follows microservice architecture principles:

- **Stateless**: Each request is independent
- **Isolated**: Runs separately from main db-builder backend
- **Scalable**: Can be deployed independently
- **Tool-based**: Uses well-defined tools to manipulate workspace

## Integration

The service integrates with db-builder by:

1. Receiving workspace state from frontend
2. Processing natural language commands using LLM
3. Executing actions via DBBuilderTools
4. Returning updated workspace state

No modifications to existing db-builder pages or functionality.
