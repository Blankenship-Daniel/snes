# RAG Pipeline Quick Start

Your Claude Code is now enhanced with automatic context retrieval from the Neo4j knowledge graph! 🧠

## What Just Happened?

Your SNES project now has a **RAG (Retrieval-Augmented Generation) pipeline** that:

✅ **Automatically detects** SNES-related questions in your prompts
✅ **Queries the Neo4j knowledge graph** for relevant context
✅ **Injects that context** into your Claude Code conversations
✅ **Provides rich information** about mods, registers, components, and best practices

## Quick Test

Try asking Claude Code:

```
How do I modify the magic system?
```

You'll see context automatically injected like:

```
🧠 Neo4j Knowledge Graph Context:

🎮 Relevant Mods:
  - infinite-magic (magic): Never run out of magic power
    Affects: player | Bytes changed: 7

📦 Relevant Components:
  - player (player): Core player character logic

📚 Domain Knowledge:
  - Magic System Implementation: The magic system tracks magic
    points and handles depletion...
```

## How to Use

Just ask normal questions! The RAG pipeline automatically detects relevant topics:

**Magic-related:**
- "How does the magic system work?"
- "Can I make infinite magic?"

**Speed-related:**
- "How do I create a 2x speed mod?"
- "What controls player movement speed?"

**Hardware-related:**
- "What PPU registers control sprites?"
- "How does DMA work on SNES?"

**General:**
- "How do I modify the player component?"
- "What's in the zelda3 project?"

## Environment Setup

For RAG to work, you need Neo4j running and environment variables set:

```bash
# Make sure Neo4j is running
./tools/neo4j-docker.sh status

# If not running, start it:
./tools/neo4j-docker.sh start

# Load environment variables
source .env.neo4j
```

**Tip:** Add to your shell profile for automatic loading:
```bash
# Add to ~/.zshrc or ~/.bashrc
cd /path/to/your/snes-repo && source .env.neo4j
```

## Features

### Smart Keyword Detection

Automatically recognizes:
- **Mod names**: magic, speed, hearts, intro-skip
- **Hardware**: PPU, CPU, DMA, registers
- **Components**: player, sprite, dungeon, overworld
- **Projects**: zelda3, bsnes, snes9x

### Context Types

Retrieves:
1. **🎮 Mods**: Related ROM modifications
2. **🔧 Registers**: SNES hardware registers
3. **📦 Components**: Game systems and code
4. **📚 Knowledge**: Implementation notes and best practices

### Examples

**Query:** "How do sprites work?"

**Context retrieved:**
- sprite_system component
- PPU registers ($2101 OBJSEL, $2102 OAMADDL, etc.)
- PPU Overview knowledge
- Sprite-related mods

**Query:** "I want to make enemies move faster"

**Context retrieved:**
- 2x-speed mod (as reference)
- sprite_system component
- player component (for movement logic)

## Manage Neo4j

```bash
# Start Neo4j
./tools/neo4j-docker.sh start

# Stop Neo4j
./tools/neo4j-docker.sh stop

# Check status
./tools/neo4j-docker.sh status

# View logs
./tools/neo4j-docker.sh logs
```

## Add Your Own Knowledge

Store your learnings in the graph:

```python
from tools.neo4j_populate import SNESKnowledgeGraph

kg = SNESKnowledgeGraph('bolt://localhost:7687', 'neo4j', 'snes-graph-2024')

# Add custom knowledge
kg.add_knowledge(
    topic="3x Speed Implementation",
    content="Modified player.c by tripling the speed multiplier...",
    knowledge_type="implementation",
    tags=["speed", "custom", "mod"]
)

# Add a custom mod
kg.add_mod(
    mod_name="3x-speed",
    project_name="zelda3",
    mod_type="speed",
    description="Triple speed gameplay",
    affected_bytes=39
)

kg.close()
```

Next time you ask about speed mods, your knowledge appears!

## Troubleshooting

### No context appearing?

**Check Neo4j:**
```bash
./tools/neo4j-docker.sh status
# Should show "✅ Neo4j is running"
```

**Check environment:**
```bash
echo $NEO4J_URI
# Should show: bolt://localhost:7687

echo $NEO4J_PASSWORD
# Should show: snes-graph-2024
```

**Test RAG manually:**
```bash
source .env.neo4j
python3 tools/neo4j_rag.py "test magic"
```

### No relevant context?

Your query might not match keywords. Try:
- More specific terms: "infinite magic mod" instead of "gameplay"
- SNES terms: "PPU sprite registers" instead of "graphics"
- Exact mod names: "2x-speed" instead of "faster"

### Hook not running?

Check Claude Code logs:
```bash
tail -f .claude/sessions/*/logs/*.log
```

Look for "UserPromptSubmit" or "RAGError" entries.

## Test Queries

Try these to see RAG in action:

```
How do I modify the magic system?
What PPU registers control sprites?
How can I make a 2x speed mod?
What components are in the zelda3 project?
How does DMA work on SNES?
What's the difference between bsnes and snes9x?
How do I change player movement speed?
What memory regions does the SNES have?
```

## How It Works

```
Your Question
    ↓
Claude Code Hook
    ↓
RAG Pipeline
    • Extracts keywords
    • Queries Neo4j
    • Formats context
    ↓
Enhanced Prompt
    ↓
Claude (with relevant context!)
```

## Files

- **RAG Pipeline**: `tools/neo4j_rag.py`
- **Hook Integration**: `.claude/hooks/user_prompt_submit.py`
- **Full Docs**: `../rag-integration.md`
- **Neo4j Guide**: `../neo4j-knowledge-graph.md`

## What's Next?

1. **Try it out**: Ask SNES questions and watch context appear
2. **Add knowledge**: Store your learnings in the graph
3. **Customize**: Edit keyword detection in `tools/neo4j_rag.py`
4. **Explore**: Browse the graph at http://localhost:7474

## Quick Commands

```bash
# Setup RAG from scratch
./tools/setup-rag.sh

# Start Neo4j
./tools/neo4j-docker.sh start

# Load environment
source .env.neo4j

# Test RAG
python3 tools/neo4j_rag.py "your query"

# Browse graph
open http://localhost:7474

# Query graph
python3 tools/neo4j_query_examples.py --interactive
```

## Resources

- **Complete RAG docs**: `../rag-integration.md`
- **Neo4j setup**: `../neo4j-knowledge-graph.md`
- **Schema diagram**: `../neo4j-schema-diagram.md`
- **Neo4j Browser**: http://localhost:7474

---

**Your Claude Code now has SNES superpowers!** 🎮✨
