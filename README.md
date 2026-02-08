# DB Builder - AI-Powered Database Schema Designer

A visual database schema designer with integrated AI assistant powered by Ollama and LLMs. Design complex database schemas using natural language or visual tools.

## ✨ Features

### Core Features
- 🎨 **Visual Schema Design**: Drag-and-drop interface for creating tables and relationships
- 🔗 **Relationship Management**: Support for one-to-one, one-to-many, and many-to-many relationships
- 📝 **SQL Generation**: Automatic SQL schema generation using Knex.js
- 🚀 **Schema Migration**: Integration with Atlas for safe schema migrations
- 💾 **Cloud Storage**: Save and sync projects to the cloud
- 📸 **Export**: Export schemas as images or SQL files

### AI Assistant (New!)
- 🤖 **Natural Language Schema Design**: Create database schemas using plain English
- 🧠 **LLM-Powered**: Uses Ollama with support for various models (Llama, Mistral, CodeLlama)
- 💪 **RTX 3050 Compatible**: Optimized for consumer GPUs (8GB VRAM)
- 🏗️ **Complex Schema Generation**: Create multi-table schemas with relationships in one command
- 🔄 **Real-time Updates**: Instant visual feedback as AI creates your schema
- 🎯 **Context-Aware**: Remembers conversation history for iterative design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (optional)
- Ollama (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/Wolfram-St/db-builder-prototype-prop.git
cd db-builder-prototype-prop

# Run the setup script (installs dependencies and Ollama model)
chmod +x setup-ai-agent.sh
./setup-ai-agent.sh
```

### Running with Docker Compose (Recommended)

```bash
# Start all services (Ollama, AI Agent, Backend)
docker-compose up -d

# Pull the AI model
docker-compose exec ollama ollama pull llama3.2

# Start the frontend
cd frontend
npm install
npm run dev
```

### Running Manually

**Terminal 1 - Ollama:**
```bash
ollama serve
ollama pull llama3.2
```

**Terminal 2 - AI Agent Service:**
```bash
cd ai-agent-service
npm install
npm start
```

**Terminal 3 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 4 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Access the app at: http://localhost:5173

## 📖 Documentation

- **[Setup Guide](SETUP_GUIDE.md)**: Detailed installation and configuration
- **[AI Agent User Guide](AI_AGENT_USER_GUIDE.md)**: How to use the AI assistant
- **[Architecture Documentation](AI_AGENT_ARCHITECTURE.md)**: Technical architecture and design

## 🎯 Usage Examples

### Using the AI Assistant

1. Open a project in the WorkStation
2. Click the **"AI Assistant"** button (bottom-right)
3. Try these commands:

```
"Create a users table with id, email, and name"

"Add a posts table related to users with title and content"

"Build an e-commerce database with products, categories, orders, and customers"

"Create a blog schema with users, posts, comments, and tags. Posts can have multiple tags."
```

### Manual Schema Design

1. Click **"Add Table"** or press `T`
2. Add columns and configure data types
3. Click and drag from one column to another to create relationships
4. Click **"Build SQL"** to generate the schema
5. Use **"Deploy"** to apply to your database

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                       Frontend                          │
│              (React + TypeScript + Vite)                │
└───────────┬──────────────────┬─────────────────────────┘
            │                   │
            │                   │
            ▼                   ▼
┌───────────────────┐  ┌──────────────────────────────┐
│   DB Builder      │  │    AI Agent Service          │
│   Backend         │  │  (Fastify + Ollama)          │
│  (Fastify + Knex) │  └─────────────┬────────────────┘
└───────────────────┘                │
                                     ▼
                            ┌─────────────────┐
                            │     Ollama      │
                            │  (LLM Server)   │
                            └─────────────────┘
```

### Microservices

1. **Frontend** (Port 5173): React application with visual schema designer
2. **Backend** (Port 3000): Fastify server for SQL generation and migrations
3. **AI Agent Service** (Port 3001): AI-powered schema generation with Ollama
4. **Ollama** (Port 11434): LLM server running quantized models

## 🔧 Technology Stack

### Frontend
- React 18 with TypeScript
- Zustand for state management
- React Flow for canvas rendering
- Tailwind CSS for styling
- Lucide React for icons

### Backend
- Fastify (Node.js web framework)
- Knex.js (SQL query builder)
- Atlas (schema migration tool)
- PostgreSQL (database)

### AI Agent
- TypeScript/Node.js
- Ollama (LLM integration)
- Fastify (web framework)
- Custom tool system for schema manipulation

## 🎨 Supported Models (RTX 3050 Compatible)

| Model | VRAM | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| llama3.2:3b | 2GB | ⚡⚡⚡ | ⭐⭐ | Development, fast iteration |
| llama3.2 | 4.7GB | ⚡⚡ | ⭐⭐⭐ | Production, balanced |
| mistral:7b | 4.1GB | ⚡⚡ | ⭐⭐⭐⭐ | Complex schemas |
| codellama:7b | 3.8GB | ⚡⚡ | ⭐⭐⭐ | SQL-optimized |

## 🔐 Security

- AI Agent runs in isolated microservice
- No direct database access from AI
- All operations validated through DB Builder Tools
- Workspace state never persisted by AI service
- No external API calls (when self-hosted)

## 🚦 Project Status

- ✅ Core visual schema designer
- ✅ SQL generation with Knex
- ✅ Schema migrations with Atlas
- ✅ Cloud storage integration
- ✅ AI Agent microservice
- ✅ Ollama integration
- ✅ Natural language schema generation
- ⏳ Streaming responses (planned)
- ⏳ Schema validation suggestions (planned)
- ⏳ Query optimization hints (planned)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

### Development Setup

```bash
# Fork and clone the repo
git clone https://github.com/YOUR_USERNAME/db-builder-prototype-prop.git

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and test
npm run dev

# Submit a PR
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai) for the amazing LLM runtime
- [Atlas](https://atlasgo.io) for schema migration tools
- [React Flow](https://reactflow.dev) for the canvas library
- The open-source community

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Wolfram-St/db-builder-prototype-prop/issues)
- **Documentation**: See the docs folder
- **Discussions**: [GitHub Discussions](https://github.com/Wolfram-St/db-builder-prototype-prop/discussions)

## 🗺️ Roadmap

### Q1 2024
- [x] AI Agent integration
- [x] Ollama support
- [x] RTX 3050 compatibility
- [ ] Enhanced UI/UX

### Q2 2024
- [ ] Streaming AI responses
- [ ] Multi-language support
- [ ] Schema templates library
- [ ] Advanced index recommendations

### Q3 2024
- [ ] Query optimization suggestions
- [ ] Performance analysis
- [ ] Team collaboration features
- [ ] Version control for schemas

---

**Built with ❤️ by the DB Builder team**

*Star ⭐ this repo if you find it useful!*
