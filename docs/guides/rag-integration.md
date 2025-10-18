# RAG Pipeline Integration with Claude Code

This document describes the RAG (Retrieval-Augmented Generation) pipeline integration that automatically injects relevant context from the Neo4j knowledge graph into your Claude Code conversations.

## Overview

The RAG pipeline enhances Claude Code by:
- **Automatically detecting** when you ask about SNES-related topics
- **Querying the knowledge graph** for relevant context
- **Injecting context** before Claude processes your prompt
- **Providing rich information** about mods, registers, components, and domain knowledge

## How It Works

```
User Prompt
    ↓
Claude Code Hook (user_prompt_submit.py)
    ↓
RAG Pipeline (neo4j_rag.py)
    ↓
    • Extract keywords from prompt
    • Query Neo4j for relevant:
      - Mods and their effects
      - SNES hardware registers
      - Game components
      - Domain knowledge
    ↓
Formatted Context
    ↓
Injected into Prompt
    ↓
Claude receives enhanced prompt
```

## Features

### Automatic Keyword Detection

The RAG pipeline automatically detects:

**Mod-related keywords:**
- `magic`, `infinite magic`, `infinite-magic`
- `speed`, `2x speed`, `double speed`
- `hearts`, `health`, `max hearts`
- `intro skip`, `quick start`

**Hardware keywords:**
- `ppu`, `cpu`, `dma`, `hdma`, `apu`
- `register`, `$2100`, `$4200`
- `vblank`, `sprite`, `oam`

**Component keywords:**
- `player`, `sprite`, `dungeon`
- `overworld`, `hud`, `audio`

**Project keywords:**
- `zelda3`, `link to the past`
- `bsnes`, `snes9x`, `emulator`

### Context Retrieval

For each query, the RAG pipeline retrieves:

1. **Relevant Mods**: Mods matching your topic (magic, speed, health)
2. **SNES Registers**: Hardware registers related to your query
3. **Components**: Game systems that might be involved
4. **Domain Knowledge**: Implementation notes and best practices

## Example Usage

### Example 1: Magic System Query

**Your prompt:**
```
How do I modify the magic system?
```

**Injected context:**
```
🧠 Neo4j Knowledge Graph Context:

🎮 Relevant Mods:
  - infinite-magic (magic): Never run out of magic power
    Affects: player | Bytes changed: 7

📦 Relevant Components:
  - player (player): Core player character logic

📚 Domain Knowledge:
  - Magic System Implementation: The magic system tracks magic
    points and handles depletion when using items like the Fire Rod.
    The infinite-magic mod patches the depletion routine...
```

### Example 2: PPU Register Query

**Your prompt:**
```
What PPU registers control sprites?
```

**Injected context:**
```
🧠 Neo4j Knowledge Graph Context:

🔧 Relevant SNES Registers:
  - $2100 (INIDISP): Screen Display Register
  - $2101 (OBJSEL): Object Size and Character Size
  - $2102 (OAMADDL): OAM Address (low byte)
  - $2103 (OAMADDH): OAM Address (high byte)

📦 Relevant Components:
  - sprite_system (gameplay): Sprite management and rendering

📚 Domain Knowledge:
  - SNES PPU Overview: The Picture Processing Unit handles all
    graphics rendering. It supports 128 hardware sprites (OAM)...
```

### Example 3: Speed Mod Query

**Your prompt:**
```
I want to create a 3x speed mod
```

**Injected context:**
```
🧠 Neo4j Knowledge Graph Context:

🎮 Relevant Mods:
  - 2x-speed (speed): Move at double speed - faster gameplay
    Affects: player, overworld_system | Bytes changed: 26

📦 Relevant Components:
  - player (player): Core player character logic and movement
  - overworld_system (gameplay): Overworld map and navigation
```

## Configuration

### Enable/Disable RAG

The RAG pipeline is **automatically enabled** if:
1. Neo4j is running (`./tools/neo4j-docker.sh status`)
2. Environment variables are set (`NEO4J_URI`, `NEO4J_PASSWORD`)

To **disable RAG** (without breaking the hook):
1. Stop Neo4j: `./tools/neo4j-docker.sh stop`
2. Or unset environment variables

The hook gracefully degrades - if Neo4j is unavailable, it continues with other context sources (git, project files).

### Environment Variables

Required for RAG to work:

```bash
export NEO4J_URI='bolt://localhost:7687'
export NEO4J_USER='neo4j'
export NEO4J_PASSWORD='snes-graph-2024'
```

**Tip:** Source the Neo4j env file:
```bash
./tools/neo4j-docker.sh export-env
source .env.neo4j
```

### Adjust RAG Behavior

Edit `tools/neo4j_rag.py` to customize:

**Change max items returned:**
```python
def build_context(self, query: str, max_items: int = 10):
    # Change max_items to return more/fewer results
```

**Add new keywords:**
```python
def extract_keywords(self, text: str) -> Set[str]:
    # Add your custom keywords to the lists
    mod_keywords = [
        "infinite-magic", "magic",
        # Add more here
    ]
```

**Modify context format:**
```python
# In build_context(), adjust the formatting:
context_parts.append(
    f"  - **{mod['name']}**: {mod['description']}"
)
```

## Testing the RAG Pipeline

### Test Standalone

```bash
# Set environment
export NEO4J_URI='bolt://localhost:7687'
export NEO4J_PASSWORD='snes-graph-2024'

# Test with a query
python3 tools/neo4j_rag.py "How do I modify the magic system?"
```

### Test in Claude Code

The RAG context will automatically appear in the system reminder when you submit a prompt:

```
<system-reminder>
UserPromptSubmit hook success: ============================================================
🔍 Automatic Context Injection
============================================================
📍 Git branch: `main`

🏗️ Project context (via Codex):
This repo provides...

🧠 Neo4j Knowledge Graph Context:
🎮 Relevant Mods:
  - infinite-magic (magic): Never run out of magic power
============================================================
</system-reminder>
```

### Debug Mode

Check Claude Code logs to see if RAG is working:

```bash
# View recent hook logs
tail -f .claude/sessions/*/logs/*.log
```

## Advanced Features

### Add Custom Knowledge

Store your own implementation notes:

```python
from tools.neo4j_populate import SNESKnowledgeGraph

kg = SNESKnowledgeGraph('bolt://localhost:7687', 'neo4j', 'snes-graph-2024')

kg.add_knowledge(
    topic="3x Speed Implementation",
    content="To create a 3x speed mod, modify the player movement code "
            "in player.c by tripling the speed multiplier. Also update "
            "the overworld scrolling to match the new speed.",
    knowledge_type="implementation",
    tags=["speed", "custom", "implementation"]
)

kg.close()
```

Next time you ask about speed mods, this knowledge will be included!

### Query Specific Mods

Get complete context for a mod:

```python
from tools.neo4j_rag import SNESRAGPipeline

rag = SNESRAGPipeline()
context = rag.get_mod_context("infinite-magic")
print(context)
```

### Search Knowledge Graph

Programmatic search:

```python
from tools.neo4j_rag import SNESRAGPipeline

rag = SNESRAGPipeline()
results = rag.search_knowledge_graph("How does DMA work?")

print(f"Found {len(results['knowledge'])} knowledge items")
print(f"Found {len(results['registers'])} registers")
```

## Integration with Other Tools

### Use in Scripts

```python
#!/usr/bin/env python3
from tools.neo4j_rag import get_rag_context

# Get context for any query
context = get_rag_context("How do sprites work?")
if context:
    print(context)
```

### Use in MCP Servers

```typescript
// In your MCP server
import { exec } from 'child_process';

async function getRAGContext(query: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      `python3 tools/neo4j_rag.py "${query}"`,
      (error, stdout, stderr) => {
        if (error) reject(error);
        resolve(stdout);
      }
    );
  });
}
```

### Use in Other Hooks

You can import the RAG pipeline in any Python hook:

```python
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "tools"))
from neo4j_rag import get_rag_context

# Use in pre_tool_use, post_tool_use, etc.
context = get_rag_context(user_input)
```

## Performance

- **Query time**: ~50-200ms per query
- **Neo4j connection**: Cached and reused
- **Graceful degradation**: If Neo4j is slow/unavailable, hook continues without RAG
- **No blocking**: RAG failures don't break Claude Code

## Troubleshooting

### RAG context not appearing?

**Check Neo4j is running:**
```bash
./tools/neo4j-docker.sh status
```

**Check environment variables:**
```bash
echo $NEO4J_URI
echo $NEO4J_PASSWORD
```

**Test RAG directly:**
```bash
python3 tools/neo4j_rag.py "test query"
```

### No relevant context found?

The query might not match any keywords. Try:
- More specific terms (e.g., "infinite magic" instead of "gameplay")
- SNES-specific terms (e.g., "PPU registers" instead of "graphics")
- Mod names (e.g., "2x-speed" instead of "faster")

**Add more knowledge:**
Populate the graph with your custom knowledge using `neo4j_populate.py`

### Hook errors?

Check Claude Code logs:
```bash
tail -f .claude/sessions/*/logs/*.log
```

Look for "RAGError" entries.

## Best Practices

1. **Keep Neo4j running**: Start it when working on SNES projects
   ```bash
   ./tools/neo4j-docker.sh start
   ```

2. **Update knowledge regularly**: Add your learnings to the graph
   ```python
   kg.add_knowledge(topic="...", content="...", tags=["..."])
   ```

3. **Use specific keywords**: The more specific your prompts, the better the context

4. **Review injected context**: Check what's being injected to improve queries

5. **Extend the graph**: Add your mods, components, and knowledge

## Future Enhancements

Possible improvements:

- **Semantic search**: Use embeddings for better keyword matching
- **Conversation memory**: Store and retrieve past conversations
- **Function call tracking**: Record which functions were accessed
- **Automatic learning**: Extract knowledge from conversations
- **Multi-project support**: Handle multiple SNES projects

## Resources

- **RAG Pipeline**: `tools/neo4j_rag.py`
- **Hook Integration**: `.claude/hooks/user_prompt_submit.py`
- **Neo4j Docs**: `./neo4j-knowledge-graph.md`
- **Schema**: `./neo4j-schema-diagram.md`

---

**Your Claude Code conversations are now enhanced with SNES knowledge!** 🎮
