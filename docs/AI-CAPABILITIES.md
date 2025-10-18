# AI Capabilities for SNES Development

This project includes advanced AI capabilities powered by Claude Code, MCP servers, and Neo4j knowledge graphs.

## Overview

The SNES development environment provides:
1. **Comprehensive context gathering** via MCP servers
2. **Knowledge graph** for storing project relationships and domain knowledge
3. **Specialized AI agents** for specific SNES development tasks
4. **RAG-ready infrastructure** for context-aware AI responses

## 1. `/snes-context` Command

**Location**: `.claude/commands/snes-context.md`

### What It Does
Activates comprehensive SNES context gathering mode that automatically:
- Searches all SNES/Zelda MCP servers
- Queries hardware documentation
- Cross-references C and assembly code
- Checks emulator implementations
- Uses Exa for latest online resources
- Queries Neo4j knowledge graph

### Usage
```bash
/snes-context
How does the magic system work in Zelda 3?
```

### Sources Queried
- **snes-mcp-server**: Hardware specs, registers, instructions, manuals
- **zelda3**: C source code search and analysis
- **zelda3-disasm**: Assembly disassembly search
- **snes9x**: Emulator implementation
- **bsnes-plus**: Advanced emulator + debugger
- **snes-mister**: FPGA hardware implementation
- **exa**: Latest online documentation and tutorials
- **neo4j**: Project relationships and knowledge

### Benefits
- Source-backed answers (not just training data)
- Multi-source verification
- Up-to-date information
- Complete context from multiple repositories

## 2. Neo4j Knowledge Graph

**Location**: `tools/neo4j_*.py`, `docs/neo4j-knowledge-graph.md`

### What It Stores
- **5 Projects**: zelda3, zelda3-disasm, bsnes-plus, snes9x, snes-mcp-server
- **10 Components**: player, sprite_system, dungeon_system, etc.
- **7 Mods**: infinite-magic, 2x-speed, max-hearts, etc.
- **19 SNES Registers**: PPU, CPU, DMA hardware registers
- **6 Memory Regions**: WRAM, ROM, SRAM, etc.
- **Domain Knowledge**: Architecture, best practices, implementations
- **Relationships**: 27+ connections between entities

### Quick Start
```bash
# Start Neo4j
./tools/neo4j-docker.sh start

# Populate graph
python3 tools/neo4j_populate.py

# Query
python3 tools/neo4j_query_examples.py --interactive

# Browse
open http://localhost:7474
```

### Use Cases
- Find all mods affecting a component
- Understand component relationships
- Store conversation context for AI
- Build RAG pipelines for context retrieval
- Track domain knowledge and best practices

## 3. Specialized AI Agents

**Location**: `.claude/commands/*.md`

### Available Agents

#### Core Specialists
- **/rom-modder** - Binary ROM manipulation, IPS patches, memory mapping
- **/asm-dev** - 65816 assembly programming, instruction optimization
- **/emulator-dev** - bsnes/SNES9x debugging and integration
- **/hardware-expert** - PPU, DMA, hardware registers, timing
- **/validator** - Binary and runtime validation, cross-emulator testing

#### Orchestration
- **/parallel-team** - Coordinates multiple agents for complex tasks

#### Context Enhancement
- **/snes-context** - Comprehensive context gathering (NEW!)

### Usage Examples

```bash
# Single agent
/rom-modder create infinite magic mod for Zelda 3

# Hardware question
/hardware-expert explain DMA channel 0 setup

# Assembly help
/asm-dev explain the STA $4300,X instruction

# With context gathering
/snes-context
/rom-modder create a sprite mod based on what we learned
```

## 4. MCP Server Integration

### Available MCP Servers

1. **snes-mcp-server**
   - lookup_instruction - 65816 instruction details
   - memory_map - SNES memory regions
   - register_info - Hardware register specs
   - manual_search - Official SNES manuals
   - hardware_info - Special chips (SA-1, SuperFX, etc.)
   - dev_guidelines - Nintendo's programming guidelines

2. **zelda3**
   - search_code - Search C source code
   - find_functions - Find function implementations
   - find_structs - Find data structures
   - analyze_game_components - Analyze game systems

3. **zelda3-disasm**
   - search_code - Search assembly code
   - find_functions - Find assembly routines
   - analyze_game_components - Analyze in assembly

4. **snes9x**
   - search_code - Search emulator source
   - find_functions - Find emulator implementations

5. **bsnes-plus**
   - search_code - Search bsnes source
   - analyze_emulation_core - CPU/PPU/APU/SPC/DMA
   - analyze_debugger - Debugger features

6. **snes-mister**
   - search_hdl - Search VHDL/SystemVerilog
   - analyze_core_structure - FPGA implementation

7. **exa**
   - web_search_exa - Web search
   - get_code_context_exa - Code examples and docs

## 5. RAG Pipeline Architecture

### Current Implementation

```
User Question
    ↓
/snes-context Command
    ↓
MCP Server Queries (Parallel)
    ├─→ Hardware Docs
    ├─→ C Source Code
    ├─→ Assembly Code
    ├─→ Emulator Code
    ├─→ FPGA Implementation
    └─→ Web Resources
    ↓
Neo4j Graph Query
    ├─→ Project Relationships
    ├─→ Component Dependencies
    ├─→ Mod Impact Analysis
    └─→ Domain Knowledge
    ↓
Context Synthesis
    ↓
Source-Backed Answer
```

### Future RAG Enhancements

**Planned**:
1. **Conversation Memory**
   - Store all conversations in Neo4j
   - Build context from past interactions
   - Track user preferences and patterns

2. **Semantic Search**
   - Vector embeddings for code snippets
   - Similarity search across repositories
   - Hybrid graph + vector search

3. **Dynamic Context Building**
   - Query graph for related entities
   - Traverse relationships for context
   - Weight sources by relevance

4. **Learning System**
   - Store successful solutions
   - Build pattern library
   - Improve recommendations over time

## 6. Integration Examples

### Example 1: Context-Aware Modding

```bash
# Step 1: Gather context
/snes-context
I want to create a mod that changes Link's running speed

# Claude searches:
# - zelda3 C code for player movement
# - zelda3-disasm for movement assembly
# - snes-mcp-server for hardware considerations
# - Neo4j for existing speed mods
# - Exa for speed mod tutorials

# Step 2: Implement with specialist
/rom-modder
Create a 3x speed mod based on what we learned

# Step 3: Validate
/validator
Test the 3x speed mod across emulators
```

### Example 2: Learning Hardware

```bash
/snes-context
Explain how HDMA works and how Zelda 3 uses it

# Claude gathers:
# - Hardware register documentation ($4300-$437F)
# - Zelda 3 HDMA setup code (C and assembly)
# - bsnes HDMA implementation
# - MiSTer FPGA HDMA hardware logic
# - Online HDMA tutorials and examples

# Provides comprehensive answer with:
# - Register bit fields
# - Code examples from Zelda 3
# - Timing diagrams
# - Best practices
# - Common pitfalls
```

### Example 3: Debugging with AI

```bash
/snes-context
My sprite mod shows glitched graphics. Debug the OAM system

# Claude analyzes:
# - OAM memory structure ($0000-$021F)
# - PPU sprite registers ($2101-$2103)
# - Zelda 3 OAM DMA routine
# - Common OAM issues (from knowledge graph)
# - bsnes-plus sprite debugger features

# Provides:
# - Checklist of things to verify
# - Memory addresses to watch
# - Debugger commands
# - Common sprite bugs and fixes
```

## 7. File Organization

```
snes/
├── .claude/
│   └── commands/
│       ├── snes-context.md          # Context gathering command
│       ├── snes-context-examples.md # Usage examples
│       ├── rom-modder.md            # Specialist agents
│       ├── asm-dev.md
│       ├── hardware-expert.md
│       └── README.md                # Agent documentation
├── tools/
│   ├── neo4j-docker.sh              # Neo4j management
│   ├── neo4j_populate.py            # Graph population
│   ├── neo4j_query_examples.py      # Query utilities
│   └── README-neo4j.md              # Neo4j guide
├── docs/
│   ├── neo4j-knowledge-graph.md     # Complete Neo4j guide
│   ├── neo4j-schema-diagram.md      # Schema reference
│   ├── snes-context-command.md      # Context command docs
│   └── AI-CAPABILITIES.md           # This file
├── NEO4J-QUICKSTART.md              # Quick start guide
└── README.md                         # Main README (updated)
```

## 8. Best Practices

### When to Use /snes-context

✅ **Use for:**
- Understanding game systems comprehensively
- Hardware questions requiring specs + examples
- ROM modding planning
- Learning SNES architecture
- Debugging complex issues
- Cross-referencing implementations

❌ **Skip for:**
- Simple file operations
- Questions already answered
- Non-SNES tasks

### Tips for Better Results

1. **Be specific**: "How does Zelda 3 upload sprites to OAM during VBlank?"
2. **State your goal**: "I want to create a mod that..."
3. **Ask follow-ups**: Request deeper dives into specific findings
4. **Combine agents**: Use `/snes-context` to learn, then specialists to implement

## 9. Performance Characteristics

- **First query**: 30-60 seconds (thorough multi-source search)
- **Follow-up queries**: Faster (context cached)
- **Specificity**: More specific questions = faster, more relevant results
- **Neo4j queries**: Sub-second for most graph queries
- **MCP server calls**: 1-5 seconds per server typically

## 10. Future Roadmap

### Phase 1: Current (✅ Complete)
- Neo4j graph populated with project data
- /snes-context command active
- MCP server integration complete
- Specialized agents available

### Phase 2: Enhanced RAG (In Progress)
- [ ] Store conversations in Neo4j
- [ ] Vector embeddings for code search
- [ ] Semantic similarity matching
- [ ] Context ranking and weighting

### Phase 3: Learning System (Planned)
- [ ] Track successful solutions
- [ ] Build pattern library
- [ ] Personalized recommendations
- [ ] Auto-documentation generation

### Phase 4: Advanced Integration (Future)
- [ ] Real-time code analysis
- [ ] Automated test generation
- [ ] Interactive debugging sessions
- [ ] Multi-agent collaboration

## 11. Contributing

To extend the AI capabilities:

1. **Add Knowledge**: Use `neo4j_populate.py` to add entities
2. **Create Agents**: Add new command files in `.claude/commands/`
3. **Enhance Context**: Improve prompts in `snes-context.md`
4. **Add MCP Tools**: Create new MCP server integrations

## Resources

- **Neo4j Guide**: `docs/neo4j-knowledge-graph.md`
- **Context Command**: `docs/snes-context-command.md`
- **Agent Examples**: `.claude/commands/snes-context-examples.md`
- **Quick Start**: `NEO4J-QUICKSTART.md`
- **MCP Config**: `.mcp.json`

---

**The SNES development environment is now AI-enhanced with comprehensive context gathering, knowledge graphs, and specialized agents!**
