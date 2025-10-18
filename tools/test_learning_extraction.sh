#!/bin/bash

# Test Learning Extraction System

echo "🧪 Testing Learning Extraction System"
echo "======================================"
echo ""

# Check dependencies
echo "1. Checking dependencies..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found"
    exit 1
fi
echo "✅ Python 3 found"

if ! command -v codex &> /dev/null; then
    echo "⚠️  Codex CLI not found (optional - will use git-based extraction only)"
else
    echo "✅ Codex CLI found"
fi

# Check Neo4j
echo ""
echo "2. Checking Neo4j..."

if docker ps --format '{{.Names}}' | grep -q "neo4j-snes"; then
    echo "✅ Neo4j is running"
else
    echo "⚠️  Neo4j is not running"
    echo "   Starting Neo4j..."
    ./tools/neo4j-docker.sh start
fi

# Set environment
export NEO4J_URI='bolt://localhost:7687'
export NEO4J_PASSWORD='snes-graph-2024'

# Create test session file
echo ""
echo "3. Creating test session..."

TEST_SESSION=".claude/sessions/test_learning_extraction.md"
mkdir -p "$(dirname "$TEST_SESSION")"

cat > "$TEST_SESSION" << 'EOF'
# Claude Code Session - Test

## Session Metadata
- **Buffer**: test-session
- **Project**: snes
- **Git Branch**: `main`

## Session Summary

In this session, we:
- Built a RAG pipeline integration with Neo4j
- Modified the user_prompt_submit.py hook to inject context
- Created neo4j_rag.py module for keyword extraction
- Decided to use graph queries over vector embeddings for better reliability
- Learned that PPU sprites require OAM setup via $2102/$2103 registers
- Discovered that graceful degradation prevents hook failures when Neo4j is down

Key implementations:
- tools/neo4j_rag.py - Smart keyword extraction and context retrieval
- .claude/hooks/user_prompt_submit.py - RAG integration

Technical decisions:
- Chose Neo4j graph queries for explicit relationship traversal
- Used Cypher queries for better performance than vector search

## Files Modified

```
M  .claude/hooks/user_prompt_submit.py
A  tools/neo4j_rag.py
M  docs/rag-integration.md
```
EOF

echo "✅ Test session created: $TEST_SESSION"

# Run extraction
echo ""
echo "4. Running learning extraction..."
echo ""

python3 tools/learning_extractor.py "$TEST_SESSION"

# Query results
echo ""
echo "5. Querying stored learnings..."
echo ""

python3 -c "
from tools.neo4j_query_examples import SNESGraphQuery

try:
    query = SNESGraphQuery('bolt://localhost:7687', 'neo4j', 'snes-graph-2024')

    learnings = query.execute_query('''
        MATCH (k:Knowledge)
        WHERE k.source = \"session_extraction\"
          AND k.topic CONTAINS \"RAG\"
        RETURN k.topic as topic, k.content as content,
               k.type as type, k.tags as tags
        ORDER BY k.created DESC
        LIMIT 5
    ''')

    if learnings:
        print('✅ Found stored learnings in Neo4j:')
        print('')
        for i, l in enumerate(learnings, 1):
            print(f'{i}. {l[\"topic\"]} ({l[\"type\"]})')
            print(f'   {l[\"content\"]}')
            print(f'   Tags: {l[\"tags\"]}')
            print('')
    else:
        print('⚠️  No learnings found (may need Codex CLI for extraction)')

    query.close()

except Exception as e:
    print(f'❌ Error querying Neo4j: {e}')
"

# Cleanup
echo ""
read -p "Delete test session file? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm "$TEST_SESSION"
    echo "✅ Test session deleted"
fi

echo ""
echo "======================================"
echo "🎉 Learning extraction test complete!"
echo "======================================"
