#!/bin/bash

# Neo4j Knowledge Graph Setup Script
# This script helps you set up and populate the SNES knowledge graph

set -e

echo "🚀 SNES Knowledge Graph Setup"
echo "=============================="
echo ""

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

echo "✓ Python 3 found: $(python3 --version)"

# Install dependencies
echo ""
echo "📦 Installing Python dependencies..."
pip3 install -q -r tools/requirements-neo4j.txt
echo "✓ Dependencies installed"

# Check for environment variables
echo ""
echo "🔑 Checking Neo4j credentials..."

if [ -z "$NEO4J_URI" ]; then
    echo "⚠️  NEO4J_URI not set"
    read -p "Enter Neo4j URI (e.g., neo4j+s://xxx.databases.neo4j.io): " NEO4J_URI
    export NEO4J_URI
fi

if [ -z "$NEO4J_USER" ]; then
    echo "⚠️  NEO4J_USER not set (using default: neo4j)"
    export NEO4J_USER="neo4j"
fi

if [ -z "$NEO4J_PASSWORD" ]; then
    echo "⚠️  NEO4J_PASSWORD not set"
    read -sp "Enter Neo4j password: " NEO4J_PASSWORD
    export NEO4J_PASSWORD
    echo ""
fi

echo "✓ Credentials configured"

# Offer to save credentials to .env file
echo ""
read -p "Save credentials to .env file? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cat > .env.neo4j << EOF
# Neo4j Configuration
export NEO4J_URI="${NEO4J_URI}"
export NEO4J_USER="${NEO4J_USER}"
export NEO4J_PASSWORD="${NEO4J_PASSWORD}"
EOF
    echo "✓ Credentials saved to .env.neo4j"
    echo "  To use: source .env.neo4j"
fi

# Test connection
echo ""
echo "🔌 Testing Neo4j connection..."
if python3 -c "
from neo4j import GraphDatabase
import os
try:
    driver = GraphDatabase.driver('${NEO4J_URI}', auth=('${NEO4J_USER}', '${NEO4J_PASSWORD}'))
    driver.verify_connectivity()
    driver.close()
    print('✓ Connection successful!')
except Exception as e:
    print(f'❌ Connection failed: {e}')
    exit(1)
"; then
    echo "✓ Neo4j connection verified"
else
    echo "❌ Failed to connect to Neo4j"
    exit 1
fi

# Ask to populate
echo ""
read -p "Populate the knowledge graph now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📊 Populating knowledge graph..."
    python3 tools/neo4j_populate.py \
        --uri "${NEO4J_URI}" \
        --user "${NEO4J_USER}" \
        --password "${NEO4J_PASSWORD}" \
        --repo-path "$(pwd)"

    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "Next steps:"
    echo "  1. Explore the graph in Neo4j Browser"
    echo "  2. Run example queries: python3 tools/neo4j_query_examples.py --interactive"
    echo "  3. Read docs: docs/guides/neo4j-knowledge-graph.md"
else
    echo ""
    echo "✅ Setup complete (not populated)"
    echo ""
    echo "To populate later, run:"
    echo "  python3 tools/neo4j_populate.py"
fi
