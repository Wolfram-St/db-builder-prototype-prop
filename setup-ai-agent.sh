#!/bin/bash

# DB Builder AI Agent Setup Script

echo "🤖 DB Builder AI Agent Setup"
echo "=============================="
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama is not installed"
    echo "   Please install Ollama from: https://ollama.ai"
    echo "   Or use Docker Compose to run everything in containers"
    exit 1
fi

echo "✅ Ollama is installed"

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama is not running"
    echo "   Starting Ollama..."
    ollama serve &
    sleep 2
fi

echo "✅ Ollama is running"

# Pull recommended model for RTX 3050
echo ""
echo "📥 Pulling recommended model (llama3.2)..."
echo "   This may take a few minutes..."

ollama pull llama3.2

if [ $? -eq 0 ]; then
    echo "✅ Model downloaded successfully"
else
    echo "❌ Failed to download model"
    exit 1
fi

# Install AI Agent Service dependencies
echo ""
echo "📦 Installing AI Agent Service dependencies..."
cd ai-agent-service
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
fi

# Build the service
echo ""
echo "🔨 Building AI Agent Service..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the AI Agent Service:"
echo "  cd ai-agent-service"
echo "  npm start"
echo ""
echo "Or use Docker Compose to run everything:"
echo "  docker-compose up"
echo ""
