# DB Builder with AI Agent - Quick Start Guide

This guide will help you set up and run the DB Builder with AI Agent integration.

## Prerequisites

- **Node.js** 18+ and npm
- **Docker** and Docker Compose (optional, for containerized deployment)
- **Ollama** (for AI Agent functionality)
- **Git**

## Option 1: Automated Setup (Recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Wolfram-St/db-builder-prototype-prop.git
cd db-builder-prototype-prop
```

### Step 2: Run Setup Script

```bash
chmod +x setup-ai-agent.sh
./setup-ai-agent.sh
```

This script will:
- Check if Ollama is installed
- Pull the recommended AI model
- Install AI Agent Service dependencies
- Build the service
- Create necessary configuration files

### Step 3: Start Services

**Terminal 1** - Start AI Agent Service:
```bash
cd ai-agent-service
npm start
```

**Terminal 2** - Start Backend:
```bash
cd backend
npm install
npm run dev
```

**Terminal 3** - Start Frontend:
```bash
cd frontend
npm install
npm run dev
```

### Step 4: Access the Application

Open your browser and go to:
- Frontend: http://localhost:5173
- AI Agent Service: http://localhost:3001
- Backend API: http://localhost:3000

## Option 2: Docker Compose (Easiest)

### Prerequisites
- Docker and Docker Compose installed
- NVIDIA Docker runtime (for GPU support)

### Step 1: Clone and Configure

```bash
git clone https://github.com/Wolfram-St/db-builder-prototype-prop.git
cd db-builder-prototype-prop
```

### Step 2: Create Environment Files

**AI Agent Service** (`ai-agent-service/.env`):
```bash
cp ai-agent-service/.env.example ai-agent-service/.env
```

**Frontend** (`frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
```

### Step 3: Start All Services

```bash
docker-compose up -d
```

This will start:
- Ollama (with GPU support if available)
- AI Agent Service
- Backend Service

### Step 4: Pull AI Model

```bash
docker-compose exec ollama ollama pull llama3.2
```

### Step 5: Start Frontend

```bash
cd frontend
npm install
npm run dev
```

## Option 3: Manual Setup

### Step 1: Install Ollama

**Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

**macOS:**
```bash
brew install ollama
```

**Windows:**
Download from https://ollama.ai/download

### Step 2: Start Ollama and Pull Model

```bash
# Start Ollama service
ollama serve

# In another terminal, pull the model
ollama pull llama3.2
```

### Step 3: Install and Configure AI Agent Service

```bash
cd ai-agent-service

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env if needed (default values should work)
# nano .env

# Build the service
npm run build

# Start the service
npm start
```

### Step 4: Install and Start Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file (if needed)
# cp .env.example .env

# Start the backend
npm run dev
```

### Step 5: Install and Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env (default values should work)
# nano .env

# Start the frontend
npm run dev
```

## Verification

### Check AI Agent Service

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-...",
  "ollama": {
    "healthy": true,
    "model": "llama3.2"
  }
}
```

### Check Ollama

```bash
curl http://localhost:11434/api/tags
```

Should return a list of installed models including `llama3.2`.

### Check Frontend

1. Open http://localhost:5173
2. Login or create an account
3. Open a project workspace
4. Look for the blue "AI Assistant" button in the bottom-right
5. Click it and try: "Create a users table with id, email, and name"

## GPU Configuration (NVIDIA)

### For RTX 3050

The default configuration uses `llama3.2` which fits in 8GB VRAM. For better performance:

```bash
# Use the 3B parameter model (smaller, faster)
ollama pull llama3.2:3b
```

Then update `ai-agent-service/.env`:
```
MODEL_NAME=llama3.2:3b
```

### Verify GPU Usage

```bash
# Check GPU utilization
nvidia-smi

# Should show ollama process using GPU
```

## Troubleshooting

### AI Agent Not Connecting

**Symptom**: Red dot in UI, "AI Agent service is not connected"

**Fix**:
1. Ensure AI Agent Service is running: `curl http://localhost:3001/health`
2. Check `.env` files have correct URLs
3. Look at service logs for errors

### Ollama Not Responding

**Symptom**: Health check shows `ollama.healthy: false`

**Fix**:
1. Ensure Ollama is running: `curl http://localhost:11434/api/tags`
2. Restart Ollama: `pkill ollama && ollama serve`
3. Pull model again: `ollama pull llama3.2`

### Port Conflicts

**Symptom**: Service fails to start, "port already in use"

**Fix**:
1. Check what's using the port: `lsof -i :3001` (or 3000, 11434)
2. Kill the process or change port in `.env`

### Out of Memory (GPU)

**Symptom**: Ollama crashes or very slow

**Fix**:
1. Use smaller model: `ollama pull llama3.2:3b`
2. Update `MODEL_NAME` in `.env`
3. Close other GPU applications

### Frontend Can't Connect to Services

**Symptom**: API calls fail, CORS errors

**Fix**:
1. Check `frontend/.env` has correct API URLs
2. Ensure backend and AI Agent services are running
3. Check browser console for specific errors

## Development Tips

### Hot Reload

All services support hot reload in development mode:
- Frontend: Changes auto-refresh
- Backend: Use `npm run dev` with ts-node
- AI Agent: Use `npm run dev` with ts-node

### Debugging

**AI Agent Service**:
```bash
# Run with more verbose logging
DEBUG=* npm run dev
```

**Backend**:
```bash
# Fastify has built-in logger
npm run dev
```

**Frontend**:
- Open browser DevTools
- Check Console for errors
- Use React DevTools extension

### Testing Commands

Try these in the AI Assistant to verify functionality:

1. **Simple table**: "Create a users table with id, email, and name"
2. **Related tables**: "Add a posts table related to users"
3. **Complex schema**: "Create a blog database with users, posts, comments, and tags"

## Next Steps

- Read the [AI Agent User Guide](./AI_AGENT_USER_GUIDE.md) for usage tips
- Check [Architecture Documentation](./AI_AGENT_ARCHITECTURE.md) for technical details
- Explore different AI models for your use case

## Support

For issues:
1. Check the troubleshooting section above
2. Review service logs
3. Check GitHub Issues
4. Read the documentation files

## Resource Usage

Approximate resource requirements:

| Component | CPU | RAM | GPU VRAM | Disk |
|-----------|-----|-----|----------|------|
| Frontend | Low | 100MB | - | 500MB |
| Backend | Low | 100MB | - | 200MB |
| AI Agent | Low | 100MB | - | 200MB |
| Ollama (llama3.2) | Medium | 1GB | 4.7GB | 3GB |
| Ollama (llama3.2:3b) | Medium | 500MB | 2GB | 1.5GB |

Total for RTX 3050 setup: ~2GB RAM, ~2GB VRAM (using 3b model)

## Production Considerations

For production deployment:

1. **Use HTTPS**: Configure SSL/TLS certificates
2. **Environment Variables**: Use secrets management (not .env files)
3. **Database**: Set up persistent PostgreSQL
4. **Monitoring**: Add logging and monitoring (e.g., Prometheus, Grafana)
5. **Scaling**: Run multiple AI Agent instances behind load balancer
6. **GPU**: Ensure GPU drivers and runtime are properly configured

---

**Ready to build databases with AI?** Start the services and open http://localhost:5173! 🚀
