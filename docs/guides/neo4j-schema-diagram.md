# Neo4j Knowledge Graph Schema Diagram

## Visual Schema

```
                    ┌──────────────┐
                    │   Project    │
                    │ (zelda3,     │
                    │  bsnes-plus, │
                    │  snes9x)     │
                    └──────┬───────┘
                           │
                    ┌──────┴─────────────────┐
                    │      PART_OF           │
                    ▼                        ▼
          ┌─────────────────┐      ┌─────────────────┐
          │   Component     │      │      Mod        │
          │ (player,        │      │ (infinite-magic,│
          │  sprite_system, │      │  2x-speed)      │
          │  dungeon)       │      └────────┬────────┘
          └────────┬────────┘               │
                   │                        │ MODIFIES
         ┌─────────┴──────┐                 │
         │  BELONGS_TO    │◄────────────────┘
         ▼                ▼
   ┌──────────┐    ┌──────────────┐
   │ Function │    │  Knowledge   │
   │          │    │ (domain info,│
   │          │    │  context)    │
   └──────────┘    └──────┬───────┘
                          │
                          │ DOCUMENTS
                          ▼
                ┌──────────────────────┐
                │  SNES Hardware       │
                ├──────────────────────┤
                │  Register            │
                │  ($2100, $4200, etc.)│
                ├──────────────────────┤
                │  MemoryRegion        │
                │  (WRAM, ROM, SRAM)   │
                └──────────────────────┘
```

## Node Types and Properties

### Project
```
(:Project {
  name: String (unique),
  description: String,
  repo_path: String,
  type: String (decompilation|disassembly|emulator|tooling),
  language: String,
  last_updated: DateTime
})
```

### Component
```
(:Component {
  id: String (unique, format: "project:component"),
  name: String,
  type: String (player|gameplay|ui|audio|core),
  file_path: String,
  description: String,
  project: String
})
```

### Function
```
(:Function {
  id: String (unique, format: "component:function"),
  name: String,
  file_path: String,
  line_number: Integer,
  description: String
})
```

### Mod
```
(:Mod {
  id: String (unique, format: "project:mod:name"),
  name: String,
  type: String (magic|health|speed|flow|equipment|combo),
  description: String,
  affected_bytes: Integer,
  project: String,
  created: DateTime
})
```

### Register
```
(:Register {
  address: String (unique, format: "$XXXX"),
  name: String,
  category: String (ppu|cpu|dma|apu),
  description: String,
  access_type: String (R|W|RW)
})
```

### MemoryRegion
```
(:MemoryRegion {
  id: String (unique, format: "mem:name"),
  name: String,
  start_addr: String,
  end_addr: String,
  type: String (ram|rom|registers),
  description: String
})
```

### Knowledge
```
(:Knowledge {
  id: String (unique, format: "knowledge:type:topic"),
  topic: String,
  content: String,
  type: String (architecture|best_practice|implementation|workflow),
  tags: [String],
  created: DateTime
})
```

## Relationship Types

### PART_OF
```
(Component)-[:PART_OF]->(Project)
```
Connects components to their parent project.

### BELONGS_TO
```
(Function)-[:BELONGS_TO]->(Component)
```
Connects functions to their component.

### TARGETS
```
(Mod)-[:TARGETS]->(Project)
```
Indicates which project a mod is for.

### MODIFIES
```
(Mod)-[:MODIFIES {description: String}]->(Component)
```
Shows what components a mod affects, with a description of the change.

### DOCUMENTS
```
(Knowledge)-[:DOCUMENTS]->(Component|Register|MemoryRegion|...)
```
Links knowledge/documentation to entities.

### LOCATED_IN (future)
```
(Register)-[:LOCATED_IN]->(MemoryRegion)
```
Maps registers to memory regions.

### CALLS (future)
```
(Function)-[:CALLS]->(Function)
```
Function call graph.

### ACCESSES (future)
```
(Function)-[:ACCESSES]->(Register)
```
Tracks which functions access which registers.

## Example Traversals

### Find all mods affecting player component
```cypher
MATCH path = (m:Mod)-[:MODIFIES]->(c:Component {name: 'player'})
RETURN path
```

### Get complete context for a mod
```cypher
MATCH (m:Mod {name: 'infinite-magic'})-[:TARGETS]->(p:Project)
MATCH (m)-[:MODIFIES]->(c:Component)
OPTIONAL MATCH (f:Function)-[:BELONGS_TO]->(c)
OPTIONAL MATCH (k:Knowledge)-[:DOCUMENTS]->(c)
RETURN m, p, collect(c) as components,
       collect(f) as functions,
       collect(k) as knowledge
```

### Explore hardware registers
```cypher
MATCH (r:Register {category: 'ppu'})
OPTIONAL MATCH (k:Knowledge)-[:DOCUMENTS]->(r)
RETURN r.address, r.name, r.description,
       collect(k.content) as documentation
```

## Schema Evolution

### Phase 1: Current (Basic Structure)
- Projects, Components, Mods
- Basic hardware (Registers, Memory Regions)
- Knowledge nodes

### Phase 2: Enhanced (Function Analysis)
- Function-to-function calls
- Function-to-register access patterns
- Component dependencies

### Phase 3: Advanced (Deep Integration)
- Instruction-level nodes
- Asset tracking
- Temporal/version tracking
- Conversation context integration

## Indexes and Constraints

### Constraints (Uniqueness)
```cypher
CREATE CONSTRAINT project_name FOR (p:Project) REQUIRE p.name IS UNIQUE
CREATE CONSTRAINT component_id FOR (c:Component) REQUIRE c.id IS UNIQUE
CREATE CONSTRAINT function_id FOR (f:Function) REQUIRE f.id IS UNIQUE
CREATE CONSTRAINT register_addr FOR (r:Register) REQUIRE r.address IS UNIQUE
CREATE CONSTRAINT mod_id FOR (m:Mod) REQUIRE m.id IS UNIQUE
CREATE CONSTRAINT memory_id FOR (mem:MemoryRegion) REQUIRE mem.id IS UNIQUE
```

### Indexes (Performance)
```cypher
CREATE INDEX component_type FOR (c:Component) ON (c.type)
CREATE INDEX register_category FOR (r:Register) ON (r.category)
CREATE INDEX mod_type FOR (m:Mod) ON (m.type)
CREATE INDEX knowledge_tags FOR (k:Knowledge) ON (k.tags)
```

## Data Model Rationale

### Why Graph for SNES Modding?

1. **Natural Relationships**: Mods affect components, components use registers
2. **Flexible Schema**: Easy to add new node types and relationships
3. **Path Queries**: Find how changes propagate through the system
4. **Context Retrieval**: Build rich context for AI agents
5. **Knowledge Integration**: Link documentation to actual code/hardware

### Benefits

- **Exploration**: Discover unexpected connections
- **Impact Analysis**: Understand mod implications
- **Context Building**: Gather relevant info for AI
- **Documentation**: Keep knowledge close to entities
- **Versioning**: Track changes over time (future)

### Trade-offs

- **Setup Complexity**: Requires Neo4j infrastructure
- **Query Learning**: Cypher has a learning curve
- **Maintenance**: Schema changes require migration
- **Performance**: Large graphs need tuning

## Integration Patterns

### With MCP Servers
```typescript
// Query graph for context
async function getModContext(modName: string) {
  const result = await neo4j.run(`
    MATCH (m:Mod {name: $modName})-[:MODIFIES]->(c:Component)
    MATCH (k:Knowledge)-[:DOCUMENTS]->(c)
    RETURN m.description, collect(c.name), collect(k.content)
  `, { modName });
  return result;
}
```

### With RAG Systems
```python
# Build context for LLM
def build_rag_context(question: str):
    # Extract entities from question
    entities = extract_entities(question)

    # Query graph for related knowledge
    context = []
    for entity in entities:
        result = query_graph(f"""
            MATCH (e {{name: $entity}})<-[:DOCUMENTS]-(k:Knowledge)
            RETURN k.content
        """, {"entity": entity})
        context.extend(result)

    return "\n".join(context)
```

### With Agent Memory
```python
# Store agent decision
def store_agent_decision(decision: str, affected_entities: list):
    kg.add_knowledge(
        topic=f"Agent Decision: {decision[:50]}",
        content=decision,
        knowledge_type="agent_memory",
        tags=["agent", "decision"] + affected_entities
    )

    # Link to entities
    for entity in affected_entities:
        kg.link_knowledge_to_entity(
            knowledge_id=f"knowledge:agent_memory:{decision[:50]}",
            entity_id=entity,
            entity_type="Component"
        )
```
