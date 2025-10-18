#!/bin/bash

# RAG Pipeline Setup Script
# Sets up the RAG integration for Claude Code

set -e

echo "🧠 Setting up RAG Pipeline for Claude Code"
echo "=========================================="
echo ""

# Check if Neo4j is running
echo "🔍 Checking Neo4j status..."
if docker ps --format '{{.Names}}' | grep -q "neo4j-snes"; then
    echo "✅ Neo4j is running"
else
    echo "⚠️  Neo4j is not running"
    read -p "Start Neo4j now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./tools/neo4j-docker.sh start
    else
        echo "❌ RAG requires Neo4j to be running"
        echo "   Start it later with: ./tools/neo4j-docker.sh start"
        exit 1
    fi
fi

# Check if knowledge graph is populated
echo ""
echo "🔍 Checking knowledge graph..."
export NEO4J_URI='bolt://localhost:7687'
export NEO4J_PASSWORD='snes-graph-2024'

# Quick test
if python3 -c "
from neo4j import GraphDatabase
driver = GraphDatabase.driver('bolt://localhost:7687', auth=('neo4j', 'snes-graph-2024'))
with driver.session() as session:
    result = session.run('MATCH (n) RETURN count(n) as count')
    count = result.single()['count']
    if count == 0:
        print('empty')
    else:
        print('populated')
driver.close()
" 2>/dev/null | grep -q "empty"; then
    echo "⚠️  Knowledge graph is empty"
    read -p "Populate the knowledge graph now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        python3 tools/neo4j_populate.py \
            --uri bolt://localhost:7687 \
            --password snes-graph-2024
    else
        echo "❌ RAG requires populated knowledge graph"
        exit 1
    fi
else
    echo "✅ Knowledge graph is populated"
fi

# Export environment variables
echo ""
echo "📝 Setting up environment variables..."
./tools/neo4j-docker.sh export-env
echo "✅ Environment variables exported to .env.neo4j"

# Test RAG pipeline
echo ""
echo "🧪 Testing RAG pipeline..."
if python3 tools/neo4j_rag.py "test magic system" > /dev/null 2>&1; then
    echo "✅ RAG pipeline is working"
else
    echo "❌ RAG pipeline test failed"
    exit 1
fi

# Show instructions
echo ""
echo "="*60
echo "✅ RAG Pipeline Setup Complete!"
echo "="*60
echo ""
echo "🎯 What's enabled:"
echo "  • Automatic context injection from Neo4j knowledge graph"
echo "  • Smart keyword detection in your prompts"
echo "  • Relevant mods, registers, components, and knowledge"
echo ""
echo "🚀 To use RAG in Claude Code:"
echo "  1. Source the environment file:"
echo "     source .env.neo4j"
echo ""
echo "  2. Start Claude Code (if not already running)"
echo ""
echo "  3. Ask SNES-related questions and watch the context appear!"
echo ""
echo "💡 Example prompts that trigger RAG:"
echo "  • \"How do I modify the magic system?\""
echo "  • \"What PPU registers control sprites?\""
echo "  • \"How can I make a 2x speed mod?\""
echo ""
echo "📚 Documentation:"
echo "  • RAG Integration: docs/guides/rag-integration.md"
echo "  • Neo4j Guide: docs/guides/neo4j-knowledge-graph.md"
echo ""
echo "🔧 Manage Neo4j:"
echo "  • Status:  ./tools/neo4j-docker.sh status"
echo "  • Start:   ./tools/neo4j-docker.sh start"
echo "  • Stop:    ./tools/neo4j-docker.sh stop"
echo ""
echo "🧪 Test RAG manually:"
echo "  source .env.neo4j"
echo "  python3 tools/neo4j_rag.py \"your query here\""
echo ""
