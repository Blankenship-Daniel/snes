# Zelda 3 Disassembly MCP Server

A Model Context Protocol (MCP) server providing access to The Legend of Zelda: A Link to the Past disassembly for reverse engineering and analysis.

## 🎯 Purpose

This MCP server enables quick disassembly search and analysis for the SNES Modder team, providing:

- **Code Search**: Find functions, labels, and patterns across all bank files
- **File Access**: Read specific assembly files with line numbers
- **Function Discovery**: Locate function definitions and subroutines
- **Component Analysis**: Analyze major game systems (sprites, player, dungeons, etc.)
- **Team Collaboration**: Shared access to disassembly insights

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- TypeScript
- An MCP-compatible client

### Quick Start

```bash
# Clone and setup
cd /path/to/your/zelda3-disasm
npm install
npm run build

# Test the server
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}' | node dist/index.js
```

### MCP Client Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "zelda3-disasm": {
      "command": "node",
      "args": ["/path/to/your/zelda3-disasm/dist/index.js"],
      "cwd": "/path/to/your/zelda3-disasm"
    }
  }
}
```

## 🔧 Available Tools

### `search_code`
Search for code patterns across the disassembly.

**Parameters:**
- `query` (required): Search pattern (supports regex)
- `directory` (optional): Limit search to specific directory
- `file_type` (optional): Filter by file extension (`asm`, `inc`, `cfg`)

**Example:**
```json
{
  "name": "search_code",
  "arguments": {
    "query": "LDA.*#\\$81",
    "file_type": "asm"
  }
}
```

### `list_files`
List files and directories in the disassembly.

**Parameters:**
- `directory` (optional): Directory to list (relative to repo root)
- `filter` (optional): File extension filter
- `recursive` (optional): Include subdirectories

### `read_source_file`
Read contents of a specific assembly file.

**Parameters:**
- `file_path` (required): Path to assembly file
- `start_line` (optional): Starting line number (default: 1)
- `end_line` (optional): Ending line number

**Example:**
```json
{
  "name": "read_source_file", 
  "arguments": {
    "file_path": "bank0.asm",
    "start_line": 100,
    "end_line": 150
  }
}
```

### `find_functions`
Find function definitions in assembly files.

**Parameters:**
- `function_name` (required): Function name to search for
- `directory` (optional): Limit search to specific directory

### `analyze_game_components`
Analyze major game systems and components.

**Parameters:**
- `component` (optional): Specific component to analyze
  - Options: `sprite`, `player`, `dungeon`, `overworld`, `audio`, `graphics`, `input`, `items`

## 📁 Repository Structure

```
zelda3-disasm/
├── src/                    # MCP server source code
│   ├── index.ts           # Main server entry point
│   └── tools/             # Tool implementations
├── dist/                  # Compiled JavaScript
├── bank0.asm             # ROM Bank 0 (reset vectors, core init)
├── bank1.asm             # ROM Bank 1 (player movement, collision)
├── ...                   # Banks 2-31 (game systems)
├── constants.asm         # Game constants and definitions
├── snes.asm             # SNES hardware definitions
├── hdr.asm              # ROM header
├── main.s               # Main assembly entry
└── Makefile             # Build configuration
```

## 🎮 Game System Organization

### Core Banks (0-7)
- **Bank 0**: Reset vectors, initialization, main game loop
- **Bank 1**: Player movement, state management, collision detection
- **Bank 2**: Sprite engine, enemy AI, object interactions
- **Bank 3**: Graphics routines, DMA transfers, PPU control
- **Bank 4**: Sound engine interface, SPC700 communication
- **Bank 5**: Menu systems, inventory management, save/load
- **Bank 6**: Dungeon room engine, door transitions
- **Bank 7**: Overworld engine, area transitions

### Specialized Banks (8-31)
- **Banks 8-15**: Game logic, AI, item systems, dialogue
- **Banks 16-23**: Graphics data, sprites, backgrounds, palettes
- **Banks 24-31**: Music, audio, compression, additional data

## 🔍 Common Search Patterns

### Find Player Movement Code
```json
{
  "name": "search_code",
  "arguments": {
    "query": "Link.*coordinate|Player.*movement",
    "file_type": "asm"
  }
}
```

### Locate Health System
```json
{
  "name": "search_code", 
  "arguments": {
    "query": "health|heart|HP",
    "file_type": "asm"
  }
}
```

### Find Memory Addresses
```json
{
  "name": "search_code",
  "arguments": {
    "query": "\\$7E[0-9A-F]{4}",
    "file_type": "asm"
  }
}
```

### Analyze Sprite System
```json
{
  "name": "analyze_game_components",
  "arguments": {
    "component": "sprite"
  }
}
```

## 🚀 Team Workflows

### 1. Initial Exploration
```bash
# List all assembly files
mcp call list_files '{"filter": "asm"}'

# Get overview of constants
mcp call read_source_file '{"file_path": "constants.asm", "start_line": 1, "end_line": 50}'

# Analyze a game component
mcp call analyze_game_components '{"component": "player"}'
```

### 2. Targeted Research
```bash
# Search for specific functionality
mcp call search_code '{"query": "boomerang", "file_type": "asm"}'

# Find related functions
mcp call find_functions '{"function_name": "boomerang"}'

# Read the relevant code
mcp call read_source_file '{"file_path": "bank2.asm", "start_line": 1500, "end_line": 1600}'
```

### 3. Cross-Reference Analysis
```bash
# Find memory usage patterns
mcp call search_code '{"query": "\\$7E0340.*bow"}'

# Locate initialization code
mcp call search_code '{"query": "initialization.*table"}'

# Analyze system interactions
mcp call analyze_game_components '{"component": "items"}'
```

## 📊 Resources Available

The MCP server provides several resources for reference:

- `zelda3://disassembly/overview` - Disassembly structure overview
- `zelda3://disassembly/banks` - ROM bank layout and organization
- `zelda3://disassembly/constants` - Game constants and memory addresses
- `zelda3://disassembly/memory-map` - SNES memory layout for Zelda 3

## 🤝 Team Collaboration

### Best Practices
1. **Use descriptive searches**: Include context in your search queries
2. **Document findings**: Share interesting discoveries with the team
3. **Cross-reference systems**: Look for connections between different game components
4. **Validate with testing**: Test your findings in actual ROM modifications

### Sharing Discoveries
When you find something interesting:

1. **Record the location**: Note the bank file and line numbers
2. **Document the context**: Explain what the code does
3. **Test the theory**: Modify and test if possible
4. **Share with team**: Update team documentation

## 🔧 Development

### Adding New Tools
1. Create tool implementation in `src/tools/`
2. Add tool definition to `src/index.ts`
3. Rebuild with `npm run build`
4. Test with MCP client

### Extending Analysis
The server can be extended with additional analysis tools:
- Memory layout visualization
- Cross-reference mapping
- Dependency tracking
- Optimization analysis

## 📈 Performance Notes

- Large searches may take time due to 32MB+ bank files
- Results are limited to prevent overwhelming output
- Use specific file type filters to improve search speed
- Consider using smaller line ranges when reading large files

## 🎯 Integration with SNES Modder Project

This MCP server complements the main SNES Modder tools:

- **Discovery Tracking**: Use with `discovery_tracker.py` for systematic cataloging
- **Synthesis Analysis**: Feed findings into `synthesis_engine.py` for cross-references
- **Cheat Development**: Research memory locations for `ultimate_mod_engine.py`
- **Conflict Resolution**: Analyze initialization tables for mod compatibility

---

*Created for the SNES Modder Team - Making Zelda 3 reverse engineering accessible and collaborative!*
