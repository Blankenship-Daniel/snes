# /snes-context - Comprehensive Context Gathering

The `/snes-context` slash command activates Claude Code's comprehensive SNES context gathering mode, leveraging all available MCP servers and knowledge sources.

## Quick Start

```bash
# In Claude Code, type:
/snes-context

# Then ask your SNES-related question
How does the magic system work in Zelda 3?
```

## What It Does

When you activate `/snes-context`, Claude will automatically:

1. **Search all SNES MCP servers**:
   - snes-mcp-server (hardware docs, registers, instructions)
   - zelda3 (C source code)
   - zelda3-disasm (assembly disassembly)
   - snes9x (emulator implementation)
   - bsnes-plus (advanced emulator + debugger)
   - snes-mister (FPGA hardware implementation)

2. **Query external resources**:
   - Exa web search for latest documentation
   - Upstash Context7 for library documentation
   - Neo4j knowledge graph for project relationships

3. **Cross-reference findings**:
   - Compare implementations across sources
   - Verify hardware behavior against specs
   - Link code to documentation

4. **Provide comprehensive answers**:
   - Include file paths and line numbers
   - Reference specific registers and memory addresses
   - Show different implementation approaches
   - Link to relevant documentation

## Benefits

### Source-Backed Answers
Every answer is backed by actual code, hardware specs, and documentation - not just training data.

### Multi-Source Verification
Cross-references findings across C code, assembly, emulator implementations, and hardware specs.

### Up-to-Date Information
Uses Exa to fetch the latest online tutorials, guides, and documentation.

### Complete Context
Gathers context from multiple repositories and sources before answering.

## Example Use Cases

### Understanding Game Systems
```
/snes-context
How does sprite rendering work in Zelda 3?
```
→ Gets C code, assembly, hardware registers, emulator implementation, and tutorials

### Hardware Questions
```
/snes-context
What is DMA channel 0 used for and how do I set it up?
```
→ Gets official docs, register details, code examples, and best practices

### ROM Modding Planning
```
/snes-context
I want to create infinite arrows mod. Where should I start?
```
→ Gets arrow consumption code, memory locations, similar mods, and modding guides

### Debugging Help
```
/snes-context
My sprite mod isn't working. How can I debug OAM?
```
→ Gets OAM structure, debugger features, common issues, and troubleshooting steps

### Learning Architecture
```
/snes-context
Explain the SNES memory map and LoROM layout
```
→ Gets official specs, memory diagrams, examples, and beginner tutorials

## How It Works

The command injects a comprehensive prompt that instructs Claude to:

1. **Identify the question type**: Hardware, code, modding, debugging, etc.
2. **Select relevant sources**: Prioritize which MCP servers to query
3. **Gather context in phases**:
   - Phase 1: Hardware understanding
   - Phase 2: Code implementations
   - Phase 3: External documentation
   - Phase 4: Cross-reference and synthesize
4. **Provide sourced answers**: Always cite where information came from

## Response Quality

Responses include:

- **Specific file references**: `zelda3/src/player.c:237`
- **Register addresses**: `$2100 (INIDISP)`, `$4300 (DMAP0)`
- **Memory locations**: `$7E0000-$7FFFFF (WRAM)`
- **Assembly addresses**: `$80/9A5E: LDA $4300,X`
- **Source citations**: "According to SNES9x implementation..."
- **Cross-references**: "The C code calls this, which maps to this assembly routine..."

## Tips for Best Results

1. **Be specific**: "How does Zelda 3 upload sprites to OAM during VBlank?" vs "How do sprites work?"

2. **State your goal**: "I want to create a mod that..." helps prioritize relevant sources

3. **Ask follow-ups**: Request deeper dives into specific aspects

4. **Combine with specialists**: Use `/snes-context` to learn, then `/rom-modder` to implement

## Examples

See complete examples in:
- `.claude/commands/snes-context-examples.md` - Detailed usage examples
- `.claude/commands/README.md` - Quick reference

## Architecture

```
User Question
    ↓
/snes-context activated
    ↓
Context Gathering Phase
    ├─→ snes-mcp-server (hardware)
    ├─→ zelda3 (C code)
    ├─→ zelda3-disasm (assembly)
    ├─→ snes9x (emulator)
    ├─→ bsnes (debugger)
    ├─→ snes-mister (FPGA)
    ├─→ exa (web docs)
    └─→ neo4j (relationships)
    ↓
Cross-Reference & Synthesize
    ↓
Comprehensive Answer
```

## Performance

- **First query**: 30-60 seconds (thorough search)
- **Follow-ups**: Faster (cached context)
- **Specificity**: More specific = faster results

## Comparison to Regular Mode

### Without /snes-context
- Relies on training data
- May guess or generalize
- Limited verification
- No source citations

### With /snes-context
- Uses actual code and docs
- Verifies across sources
- Cross-references implementations
- Provides file paths and line numbers
- Shows hardware specs
- Links to current documentation

## Related Tools

- **Neo4j Knowledge Graph**: Stores project relationships and context
- **MCP Servers**: Provide access to code and documentation
- **Specialized Agents**: `/rom-modder`, `/asm-dev`, etc. for implementation
- **Exa Search**: Fetches latest online resources

## Future Enhancements

Planned improvements:
- Integration with Neo4j RAG pipeline
- Conversation memory in knowledge graph
- Automatic code example generation
- Cross-project relationship discovery
- Temporal version tracking

---

**Use `/snes-context` whenever you need thorough, source-backed answers about SNES development!**
