# Neo4j Knowledge Graph - Quick Start Guide

## ✅ Setup Complete!

Your SNES project now has a fully populated Neo4j knowledge graph containing:

- **5 Projects**: zelda3, zelda3-disasm, bsnes-plus, snes9x, snes-mcp-server
- **10 Components**: player, sprite_system, dungeon_system, etc.
- **7 Mods**: infinite-magic, 2x-speed, max-hearts, team-solution, etc.
- **19 SNES Registers**: PPU, CPU, and DMA hardware registers
- **6 Memory Regions**: WRAM, ROM, SRAM, register areas
- **5 Knowledge Items**: Architecture, best practices, implementations
- **27 Relationships**: Connecting everything together

## 🚀 Quick Commands

### Manage Neo4j Container

```bash
# Start Neo4j
./tools/neo4j-docker.sh start

# Stop Neo4j
./tools/neo4j-docker.sh stop

# Check status
./tools/neo4j-docker.sh status

# View logs
./tools/neo4j-docker.sh logs

# Show connection info
./tools/neo4j-docker.sh info
```

### Query the Graph

```bash
# Set environment variables
export NEO4J_URI='bolt://localhost:7687'
export NEO4J_PASSWORD='snes-graph-2024'

# Or source the env file
./tools/neo4j-docker.sh export-env
source .env.neo4j

# Run queries
python3 tools/neo4j_query_examples.py --query projects
python3 tools/neo4j_query_examples.py --query mods
python3 tools/neo4j_query_examples.py --query ppu-registers
python3 tools/neo4j_query_examples.py --query stats

# Interactive mode
python3 tools/neo4j_query_examples.py --interactive
```

## 🌐 Neo4j Browser

Open in your browser: **http://localhost:7474**

**Credentials:**
- Username: `neo4j`
- Password: `snes-graph-2024`

## 💡 Example Queries (in Neo4j Browser)

### Find all mods affecting the player component
```cypher
MATCH (m:Mod)-[:MODIFIES]->(c:Component {name: 'player'})
RETURN m.name, m.description, m.affected_bytes
```

### Show all projects and their types
```cypher
MATCH (p:Project)
RETURN p.name, p.type, p.language, p.description
ORDER BY p.type, p.name
```

### List all PPU registers
```cypher
MATCH (r:Register {category: 'ppu'})
RETURN r.address, r.name, r.description
ORDER BY r.address
```

### Find knowledge about magic system
```cypher
MATCH (k:Knowledge)
WHERE 'magic' IN k.tags
RETURN k.topic, k.content
```

### Get all components in zelda3 project
```cypher
MATCH (c:Component)-[:PART_OF]->(p:Project {name: 'zelda3'})
RETURN c.name, c.type, c.description
ORDER BY c.type, c.name
```

### Show what infinite-magic mod changes
```cypher
MATCH (m:Mod {name: 'infinite-magic'})-[r:MODIFIES]->(c:Component)
RETURN m.description, c.name, r.description
```

### Visualize the entire graph (limited)
```cypher
MATCH (n)-[r]->(m)
RETURN n, r, m
LIMIT 100
```

### Memory map overview
```cypher
MATCH (mr:MemoryRegion)
RETURN mr.name, mr.start_addr, mr.end_addr, mr.type, mr.description
ORDER BY mr.start_addr
```

## 🔧 Common Tasks

### Add a New Mod
```python
from tools.neo4j_populate import SNESKnowledgeGraph

kg = SNESKnowledgeGraph('bolt://localhost:7687', 'neo4j', 'snes-graph-2024')

kg.add_mod(
    mod_name="3x-speed",
    project_name="zelda3",
    mod_type="speed",
    description="Triple speed gameplay",
    affected_bytes=26
)

kg.add_mod_affects_component(
    mod_id="zelda3:mod:3x-speed",
    component_id="zelda3:player",
    change_description="Movement speed tripled"
)

kg.close()
```

### Add Custom Knowledge
```python
kg.add_knowledge(
    topic="Custom Implementation Notes",
    content="Details about how I implemented feature X...",
    knowledge_type="implementation",
    tags=["custom", "implementation", "zelda3"]
)
```

### Repopulate Graph (if schema changes)
```bash
python3 tools/neo4j_populate.py \
    --uri bolt://localhost:7687 \
    --password snes-graph-2024 \
    --clear
```

## 📚 Documentation

- **Complete Guide**: `../neo4j-knowledge-graph.md`
- **Schema Reference**: `../neo4j-schema-diagram.md`
- **Tool README**: `tools/README-neo4j.md`

## 🎯 Use Cases

### For AI Agents
- **Context Retrieval**: Find related components, mods, and knowledge
- **Memory Storage**: Store conversation history and decisions
- **Impact Analysis**: Understand what a mod affects

### For Development
- **Documentation**: Link knowledge to code and hardware
- **Exploration**: Discover connections between systems
- **Planning**: Understand dependencies before modding

### Example AI Query
```cypher
// Get context for implementing a new speed mod
MATCH (m:Mod {type: 'speed'})-[:MODIFIES]->(c:Component)
OPTIONAL MATCH (k:Knowledge)-[:DOCUMENTS]->(c)
RETURN m.name, m.description, collect(c.name) as components,
       collect(k.content) as related_knowledge
```

## 🛠️ Troubleshooting

### Neo4j not starting?
```bash
# Check Docker Desktop is running
docker ps

# Restart Neo4j
./tools/neo4j-docker.sh restart

# View logs for errors
./tools/neo4j-docker.sh logs
```

### Connection errors?
```bash
# Verify Neo4j is running
./tools/neo4j-docker.sh status

# Test connection
python3 -c "
from neo4j import GraphDatabase
driver = GraphDatabase.driver('bolt://localhost:7687', auth=('neo4j', 'snes-graph-2024'))
driver.verify_connectivity()
print('✅ Connected!')
driver.close()
"
```

### Need to reset?
```bash
# Remove container and data (WARNING: destructive!)
./tools/neo4j-docker.sh remove

# Start fresh
./tools/neo4j-docker.sh start
python3 tools/neo4j_populate.py --uri bolt://localhost:7687 --password snes-graph-2024
```

## 🎓 Next Steps

1. **Explore in Browser**: Visit http://localhost:7474 and run the example queries
2. **Try Interactive Mode**: `python3 tools/neo4j_query_examples.py --interactive`
3. **Read the Docs**: Check out `../neo4j-knowledge-graph.md` for advanced usage
4. **Integrate with AI**: Use graph queries in your MCP servers or agents
5. **Add Your Data**: Customize the graph with your own mods and knowledge

## 📊 Graph Statistics

Current contents:
```
Project      :     5
Component    :    10
Mod          :     7
Register     :    19
MemoryRegion :     6
Knowledge    :     5
Relationships:    27
```

## 🔗 Useful Links

- **Neo4j Browser**: http://localhost:7474/browser/
- **Neo4j Documentation**: https://neo4j.com/docs/
- **Cypher Reference**: https://neo4j.com/docs/cypher-manual/current/
- **Python Driver**: https://neo4j.com/docs/python-manual/current/

---

**Your SNES knowledge graph is ready to use!** 🎮
