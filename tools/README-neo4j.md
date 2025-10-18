# Neo4j Tools for SNES Project

This directory contains tools for setting up and using the Neo4j knowledge graph for the SNES modding project.

## Quick Start

### 1. Setup Neo4j (Choose One)

**Option A: Neo4j Aura (Cloud - Easiest)**
1. Go to https://neo4j.com/cloud/aura/
2. Create free account and database
3. Save connection credentials

**Option B: Neo4j Desktop (Local)**
1. Download from https://neo4j.com/download/
2. Create new project and database
3. Start database

**Option C: Docker**
```bash
docker run -d \
    --name neo4j \
    -p 7474:7474 -p 7687:7687 \
    -e NEO4J_AUTH=neo4j/your-password \
    neo4j:latest
```

### 2. Run Setup Script

```bash
# Interactive setup (recommended for first time)
./tools/setup-neo4j.sh
```

The setup script will:
- Install Python dependencies
- Configure credentials
- Test connection
- Optionally populate the graph

### 3. Explore the Graph

**Via Neo4j Browser:**
- Visit http://localhost:7474 (local) or your Aura URL
- Run queries from docs/guides/neo4j-knowledge-graph.md

**Via Interactive CLI:**
```bash
# Export credentials (or source .env.neo4j)
export NEO4J_URI="neo4j+s://xxx.databases.neo4j.io"
export NEO4J_PASSWORD="your-password"

# Start interactive mode
python3 tools/neo4j_query_examples.py --interactive
```

## Files

### Scripts

- **`setup-neo4j.sh`** - Interactive setup wizard
- **`neo4j_populate.py`** - Main population script
- **`neo4j_query_examples.py`** - Query utilities and examples
- **`requirements-neo4j.txt`** - Python dependencies

### Documentation

- **`../docs/guides/neo4j-knowledge-graph.md`** - Complete user guide
- **`../docs/guides/neo4j-schema-diagram.md`** - Schema reference
- **`README-neo4j.md`** (this file) - Quick reference

## Usage Examples

### Populate Graph

```bash
# First time (with environment variables)
export NEO4J_URI="neo4j+s://xxx.databases.neo4j.io"
export NEO4J_PASSWORD="your-password"
python3 tools/neo4j_populate.py

# With arguments
python3 tools/neo4j_populate.py \
    --uri neo4j+s://xxx.databases.neo4j.io \
    --password your-password

# Clear and repopulate
python3 tools/neo4j_populate.py --clear
```

### Query Graph

```bash
# List projects
python3 tools/neo4j_query_examples.py --query projects

# List mods
python3 tools/neo4j_query_examples.py --query mods

# Show PPU registers
python3 tools/neo4j_query_examples.py --query ppu-registers

# Show statistics
python3 tools/neo4j_query_examples.py --query stats

# Interactive mode
python3 tools/neo4j_query_examples.py --interactive
```

### Custom Queries (Cypher)

```cypher
// Find mods affecting player
MATCH (m:Mod)-[:MODIFIES]->(c:Component {name: 'player'})
RETURN m.name, m.description

// List all PPU registers
MATCH (r:Register {category: 'ppu'})
RETURN r.address, r.name, r.description
ORDER BY r.address

// Search knowledge base
MATCH (k:Knowledge)
WHERE k.content CONTAINS 'DMA'
RETURN k.topic, k.content
```

## What Gets Populated

The population script creates:

### Projects (5)
- zelda3 (C decompilation)
- zelda3-disasm (65816 assembly)
- bsnes-plus (emulator)
- snes9x (emulator)
- snes-mcp-server (tooling)

### Components (~10)
- player, sprite_system, ancilla_system
- dungeon_system, overworld_system
- hud_system, audio_system
- config_system, ending_system, attract_mode

### Mods (7)
- infinite-magic
- max-hearts
- 2x-speed
- intro-skip
- quick-start
- team-solution (combo)
- ultimate (combo)

### SNES Hardware
- PPU Registers (10+): $2100-$213F
- CPU Registers (5+): $4200-$421F
- DMA Registers (4+): $4300-$437F
- Memory Regions (6): WRAM, ROM, SRAM, etc.

### Knowledge Items (5+)
- 65816 Architecture
- PPU Overview
- DMA Best Practices
- Magic System Implementation
- ROM Modding Workflow

### Functions
- Extracted from zelda3 C source files
- Sample functions from major components

## Advanced Usage

### Add Custom Data

```python
from tools.neo4j_populate import SNESKnowledgeGraph

# Connect
kg = SNESKnowledgeGraph(uri, user, password)

# Add a new mod
kg.add_mod(
    mod_name="3x-speed",
    project_name="zelda3",
    mod_type="speed",
    description="Triple speed gameplay",
    affected_bytes=26
)

# Add knowledge
kg.add_knowledge(
    topic="Custom Mod Implementation",
    content="Details about how the 3x speed mod works...",
    knowledge_type="implementation",
    tags=["speed", "custom", "mod"]
)

kg.close()
```

### Export Data

```cypher
// Export all mods to JSON
MATCH (m:Mod)
RETURN m

// Export component relationships
MATCH (c:Component)-[r]-(other)
RETURN c.name, type(r), other.name
```

### Backup

```bash
# Using Neo4j Browser
CALL apoc.export.cypher.all("backup.cypher", {})

# Or using neo4j-admin (if installed)
neo4j-admin dump --database=neo4j --to=backup.dump
```

## Integration Ideas

### With MCP Servers
- Query graph for context when answering questions
- Store conversation history as Knowledge nodes
- Track agent decisions and their impact

### With RAG Systems
- Use graph to retrieve related knowledge
- Build context by traversing relationships
- Combine vector search with graph traversal

### With CI/CD
- Populate graph on each commit
- Track changes over time
- Validate mod configurations

## Troubleshooting

### Connection Failed
```bash
# Check Neo4j is running
curl http://localhost:7474  # For local

# Verify credentials
python3 -c "
from neo4j import GraphDatabase
driver = GraphDatabase.driver('bolt://localhost:7687', auth=('neo4j', 'password'))
driver.verify_connectivity()
print('Connected!')
"
```

### Population Failed
```bash
# Check repository path (from repo root)
ls ./zelda3

# Run with verbose errors
python3 tools/neo4j_populate.py 2>&1 | tee populate.log
```

### Query Issues
```bash
# Check data exists
python3 tools/neo4j_query_examples.py --query stats

# Try simple query
echo "MATCH (n) RETURN count(n)" | cypher-shell -u neo4j -p password
```

## Next Steps

1. **Explore**: Use Neo4j Browser to visualize the graph
2. **Query**: Try example queries from the docs
3. **Extend**: Add your own nodes and relationships
4. **Integrate**: Connect with MCP servers or AI agents
5. **Share**: Export interesting queries and findings

## Resources

- [Neo4j Documentation](https://neo4j.com/docs/)
- [Cypher Query Language](https://neo4j.com/docs/cypher-manual/current/)
- [Python Driver Docs](https://neo4j.com/docs/python-manual/current/)
- [Graph Data Modeling](https://neo4j.com/docs/getting-started/data-modeling/)

## Support

For issues or questions:
1. Check the docs: `docs/guides/neo4j-knowledge-graph.md`
2. Review schema: `docs/guides/neo4j-schema-diagram.md`
3. Run diagnostics: `python3 tools/neo4j_query_examples.py --query stats`
4. Check logs: Look for error messages during population
