# Neo4j Knowledge Graph for SNES Project

This document describes the Neo4j knowledge graph setup for storing context, memories, and domain knowledge for the SNES modding project.

## Overview

The knowledge graph stores:
- **Projects**: zelda3, zelda3-disasm, bsnes-plus, snes9x, etc.
- **Components**: Game systems (player, sprites, dungeons, etc.)
- **Mods**: ROM modifications (infinite-magic, 2x-speed, etc.)
- **SNES Hardware**: Registers, memory regions, and specifications
- **Functions**: Code functions and their relationships
- **Knowledge**: Domain knowledge, best practices, and documentation

## Schema

### Node Types

```cypher
(:Project)         # SNES projects in the repo
(:Component)       # Game systems or source files
(:Function)        # Code functions
(:Mod)            # ROM modifications
(:Register)       # SNES hardware registers
(:MemoryRegion)   # SNES memory regions
(:Knowledge)      # Domain knowledge and documentation
```

### Relationship Types

```cypher
(Component)-[:PART_OF]->(Project)
(Function)-[:BELONGS_TO]->(Component)
(Function)-[:CALLS]->(Function)
(Mod)-[:TARGETS]->(Project)
(Mod)-[:MODIFIES]->(Component)
(Knowledge)-[:DOCUMENTS]->(Component|Register|...)
(Register)-[:LOCATED_IN]->(MemoryRegion)
```

## Setup

### 1. Install Neo4j

**Option A: Neo4j Aura (Cloud - Recommended for getting started)**
1. Go to https://neo4j.com/cloud/aura/
2. Create a free account
3. Create a new database instance
4. Save the connection URI and credentials

**Option B: Neo4j Desktop (Local)**
1. Download from https://neo4j.com/download/
2. Install and create a new project
3. Create a new database
4. Start the database

**Option C: Docker**
```bash
docker run \
    --name neo4j \
    -p 7474:7474 -p 7687:7687 \
    -e NEO4J_AUTH=neo4j/your-password \
    neo4j:latest
```

### 2. Install Python Dependencies

```bash
pip install -r tools/requirements-neo4j.txt
```

### 3. Set Environment Variables

```bash
export NEO4J_URI="neo4j+s://xxxxx.databases.neo4j.io"  # or bolt://localhost:7687
export NEO4J_USER="neo4j"
export NEO4J_PASSWORD="your-password"
```

### 4. Populate the Knowledge Graph

```bash
# Using environment variables
python tools/neo4j_populate.py

# Or with command-line arguments
python tools/neo4j_populate.py \
    --uri neo4j+s://xxxxx.databases.neo4j.io \
    --user neo4j \
    --password your-password \
    --repo-path /Users/ship/Documents/code/snes

# Clear and repopulate
python tools/neo4j_populate.py --clear
```

## Example Queries

### Find All Mods Affecting a Component

```cypher
MATCH (m:Mod)-[:MODIFIES]->(c:Component {name: 'player'})
RETURN m.name, m.description, m.affected_bytes
```

### Find All PPU Registers

```cypher
MATCH (r:Register {category: 'ppu'})
RETURN r.address, r.name, r.description
ORDER BY r.address
```

### Find Knowledge About Magic System

```cypher
MATCH (k:Knowledge)
WHERE 'magic' IN k.tags
RETURN k.topic, k.content
```

### Find All Components in Zelda3 Project

```cypher
MATCH (c:Component)-[:PART_OF]->(p:Project {name: 'zelda3'})
RETURN c.name, c.type, c.description
ORDER BY c.type, c.name
```

### Find What a Mod Changes

```cypher
MATCH (m:Mod {name: 'infinite-magic'})-[r:MODIFIES]->(c:Component)
RETURN m.name, c.name, r.description
```

### Find All Functions in a Component

```cypher
MATCH (f:Function)-[:BELONGS_TO]->(c:Component {name: 'player'})
RETURN f.name, f.file_path, f.line_number
LIMIT 20
```

### Find Related Knowledge and Components

```cypher
MATCH path = (k:Knowledge)-[:DOCUMENTS]->(c:Component)-[:PART_OF]->(p:Project)
WHERE k.type = 'implementation'
RETURN path
```

### Find All Combo Mods

```cypher
MATCH (m:Mod {type: 'combo'})
RETURN m.name, m.description, m.affected_bytes
```

### Memory Map Overview

```cypher
MATCH (mr:MemoryRegion)
RETURN mr.name, mr.start_addr, mr.end_addr, mr.type, mr.description
ORDER BY mr.start_addr
```

### Find Functions Accessing Registers

```cypher
// This would require more relationship data
MATCH (f:Function)-[:ACCESSES]->(r:Register)
RETURN f.name, r.address, r.name
```

## Advanced Queries

### Shortest Path Between Entities

```cypher
MATCH path = shortestPath(
    (start:Component {name: 'player'})-[*]-(end:Register {name: 'INIDISP'})
)
RETURN path, length(path) as depth
```

### Find All Entities Related to a Topic

```cypher
MATCH (k:Knowledge {topic: 'Magic System Implementation'})
MATCH (k)-[:DOCUMENTS]->(entity)
RETURN k.content, labels(entity) as entity_type, entity.name
```

### Mod Impact Analysis

```cypher
MATCH (m:Mod)-[:MODIFIES]->(c:Component)-[:PART_OF]->(p:Project)
RETURN p.name, m.name, collect(c.name) as affected_components
ORDER BY p.name, m.name
```

### Component Dependency Graph

```cypher
// Find components and their functions
MATCH (c:Component {name: 'player'})<-[:BELONGS_TO]-(f:Function)
RETURN c.name, collect(f.name) as functions
```

## Using the Graph for AI Agents

### Storing Conversation Context

```python
from datetime import datetime

# Store a conversation memory
kg.add_knowledge(
    topic="Implemented 3x speed mod",
    content="Modified movement speed calculations in player.c by tripling the base speed value",
    knowledge_type="conversation_memory",
    tags=["conversation", "speed-mod", "player"]
)

# Link to relevant component
kg.link_knowledge_to_entity(
    knowledge_id="knowledge:conversation_memory:Implemented 3x speed mod",
    entity_id="zelda3:player",
    entity_type="Component"
)
```

### Retrieving Context for AI

```cypher
// Get all recent knowledge about a topic
MATCH (k:Knowledge)
WHERE k.created > datetime() - duration({days: 7})
  AND 'player' IN k.tags
RETURN k.topic, k.content, k.created
ORDER BY k.created DESC
```

### Building RAG Context

```cypher
// Get comprehensive context for a question about modding
MATCH (m:Mod {name: 'infinite-magic'})-[:MODIFIES]->(c:Component)
OPTIONAL MATCH (k:Knowledge)-[:DOCUMENTS]->(c)
OPTIONAL MATCH (f:Function)-[:BELONGS_TO]->(c)
RETURN m.description, c.name, c.description,
       collect(DISTINCT k.content) as related_knowledge,
       collect(DISTINCT f.name) as related_functions
```

## Graph Visualization

You can visualize the graph using:

1. **Neo4j Browser** (built-in)
   - Navigate to http://localhost:7474 (local) or your Aura instance
   - Run visualization queries

2. **neo4jd3.js** (JavaScript visualization)
   ```cypher
   MATCH (n)-[r]->(m)
   RETURN n, r, m
   LIMIT 100
   ```

3. **Bloom** (Neo4j's graph visualization app)
   - Available in Neo4j Desktop or Aura

## Maintenance

### Update Hardware Knowledge

```python
# Add new SNES register
kg.add_register(
    address="$2109",
    name="BG3SC",
    category="ppu",
    description="BG3 Screen Base and Screen Size",
    access_type="W"
)
```

### Add New Mod

```python
kg.add_mod(
    mod_name="3x-speed",
    project_name="zelda3",
    mod_type="speed",
    description="Triple speed gameplay",
    affected_bytes=26
)

# Link to components
kg.add_mod_affects_component(
    mod_id="zelda3:mod:3x-speed",
    component_id="zelda3:player",
    change_description="Movement speed tripled"
)
```

### Backup and Restore

```bash
# Export graph (from Neo4j Browser)
CALL apoc.export.cypher.all("backup.cypher", {})

# Or use neo4j-admin
neo4j-admin dump --database=neo4j --to=backup.dump

# Restore
neo4j-admin load --from=backup.dump --database=neo4j --force
```

## Performance Tips

1. **Create indexes** for frequently queried properties
2. **Use parameters** in Cypher queries to improve caching
3. **Limit result sets** when exploring large graphs
4. **Use PROFILE** to analyze query performance

```cypher
// Create additional indexes
CREATE INDEX component_name IF NOT EXISTS FOR (c:Component) ON (c.name)
CREATE INDEX knowledge_tags IF NOT EXISTS FOR (k:Knowledge) ON (k.tags)

// Profile a query
PROFILE
MATCH (m:Mod)-[:MODIFIES]->(c:Component)
RETURN m.name, c.name
```

## Integration with MCP Servers

The knowledge graph can be integrated with the SNES MCP servers to provide:

1. **Context-aware responses**: Query the graph for related knowledge
2. **Memory persistence**: Store conversation history and decisions
3. **Relationship discovery**: Find connections between SNES concepts
4. **Knowledge retrieval**: Build RAG pipelines for AI agents

Example MCP server enhancement:
```typescript
// In snes-mcp-server
async function getRelatedContext(topic: string) {
  const result = await neo4jSession.run(`
    MATCH (k:Knowledge)-[:DOCUMENTS]->(entity)
    WHERE k.topic CONTAINS $topic
    RETURN k.content, entity.name, labels(entity)
  `, { topic });

  return result.records.map(r => ({
    knowledge: r.get('k.content'),
    entity: r.get('entity.name'),
    entityType: r.get('labels(entity)')[0]
  }));
}
```

## Troubleshooting

### Connection Issues
- Check firewall settings
- Verify URI and credentials
- Ensure Neo4j is running

### Performance Issues
- Check indexes are created
- Use `EXPLAIN` to analyze queries
- Consider adding more specific relationships

### Data Issues
- Use `--clear` flag to reset database
- Verify repository path is correct
- Check Python script output for errors

## Next Steps

1. **Extend the schema**: Add more node types (e.g., `:Instruction`, `:Asset`)
2. **Add more relationships**: Function calls, register access patterns
3. **Integrate with MCP**: Use graph for context in AI responses
4. **Build RAG pipeline**: Use graph for semantic search and retrieval
5. **Add temporal data**: Track changes over time

## Resources

- [Neo4j Documentation](https://neo4j.com/docs/)
- [Cypher Query Language](https://neo4j.com/docs/cypher-manual/current/)
- [Neo4j Python Driver](https://neo4j.com/docs/python-manual/current/)
- [Graph Data Science](https://neo4j.com/docs/graph-data-science/current/)
