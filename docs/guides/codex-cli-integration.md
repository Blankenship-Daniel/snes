# Codex CLI Integration with SNES MCP Servers

This guide explains how to use OpenAI's Codex CLI with the SNES development ecosystem's MCP servers.

## Overview

**Codex CLI** is OpenAI's lightweight coding agent that runs locally in your terminal. It supports the Model Context Protocol (MCP), allowing it to connect to specialized MCP servers that provide enhanced capabilities.

This project includes **4 MCP servers** that provide code search and analysis for different SNES-related codebases:

1. **zelda3** - Zelda 3: A Link to the Past C reimplementation
2. **snes9x** - SNES9x emulator codebase
3. **snes-mister** - SNES MiSTer FPGA core
4. **zelda3-disasm** - Zelda 3 assembly disassembly

## Why Use Codex CLI with MCP Servers?

### Benefits

- **Dual AI Power**: Combine GPT-5/o3 (via Codex) with Claude Code's specialized MCP servers
- **Terminal Workflow**: Stay in your terminal for coding tasks
- **Multi-Codebase Search**: Query across C, assembly, and FPGA implementations simultaneously
- **Deep Context**: MCP servers provide repository-specific knowledge
- **Flexible Models**: Choose between GPT-5, o3, o3-mini, or local OSS models

### Use Cases

1. **Learning SNES Development**: "How does Zelda 3 implement sprite rendering?"
2. **Emulator Development**: "Compare APU emulation in SNES9x vs MiSTer"
3. **ROM Hacking**: "Find all code related to Link's sword attacks"
4. **Cross-Implementation Analysis**: "How does DMA work in C vs assembly vs FPGA?"
5. **Debugging**: "Search for all references to magic meter in Zelda 3"

## Installation

### Prerequisites

1. **Node.js 18+** (for running MCP servers)
2. **OpenAI Account** (ChatGPT subscription recommended for GPT-5 access)

### Step 1: Install Codex CLI

Choose one method:

```bash
# Using npm (recommended)
npm install -g @openai/codex

# Using Homebrew (macOS)
brew install codex

# Using yarn
yarn global add @openai/codex
```

Verify installation:

```bash
codex --version
```

### Step 2: Install MCP Server Dependencies

Ensure all MCP servers have their dependencies installed:

```bash
# Navigate to project root
cd /path/to/snes

# Install dependencies for each .mcp-server
cd repos/zelda3/.mcp-server && npm install && cd ../../..
cd repos/snes9x/.mcp-server && npm install && cd ../../..
cd repos/SNES_MiSTer/.mcp-server && npm install && cd ../../..

# Build zelda3-disasm MCP server
cd repos/zelda3-disasm && npm install && npm run build && cd ../..
```

### Step 3: Configure Codex CLI with MCP Servers

#### Option A: Automated Setup (Recommended)

Run the provided setup script:

```bash
./scripts/setup-codex-mcp.sh
```

This script will:
- ✓ Check if Codex CLI is installed
- ✓ Backup existing `~/.codex/config.toml`
- ✓ Generate config with absolute paths
- ✓ Verify all MCP server files exist
- ✓ Provide usage instructions

#### Option B: Manual Configuration

1. Create `~/.codex/config.toml`:

```toml
# Zelda 3 C Reimplementation
[mcp_servers.zelda3]
command = "node"
args = ["/absolute/path/to/repos/zelda3/.mcp-server/index.js"]

# SNES9x Emulator
[mcp_servers.snes9x]
command = "node"
args = ["/absolute/path/to/repos/snes9x/.mcp-server/index.js"]

# SNES MiSTer FPGA Core
[mcp_servers.snes-mister]
command = "node"
args = ["/absolute/path/to/repos/SNES_MiSTer/.mcp-server/index.js"]

# Zelda 3 Assembly Disassembly
[mcp_servers.zelda3-disasm]
command = "node"
args = ["/absolute/path/to/repos/zelda3-disasm/dist/index.js"]
```

2. Replace `/absolute/path/to/` with your actual path

#### Option C: Add Individual Servers

```bash
# Add one server at a time
codex mcp add zelda3 -- node /path/to/repos/zelda3/.mcp-server/index.js
codex mcp add snes9x -- node /path/to/repos/snes9x/.mcp-server/index.js
codex mcp add snes-mister -- node /path/to/repos/SNES_MiSTer/.mcp-server/index.js
codex mcp add zelda3-disasm -- node /path/to/repos/zelda3-disasm/dist/index.js
```

### Step 4: Authenticate with OpenAI

First time running Codex CLI:

```bash
codex
```

You'll be prompted to authenticate. Choose:
- **OAuth Login**: Login with your ChatGPT account (recommended)
- **API Key**: Use `OPENAI_API_KEY` environment variable

## Usage

### Starting Codex CLI

```bash
# Start Codex CLI (loads all configured MCP servers)
codex

# Start with specific model
codex --model gpt-5

# Start with o3-mini for faster responses
codex --model o3-mini
```

### Verifying MCP Servers are Loaded

In Codex CLI prompt:

```
/mcp servers
```

Should show:
```
Available MCP servers:
  - zelda3
  - snes9x
  - snes-mister
  - zelda3-disasm
```

List tools from a specific server:

```
/mcp tools zelda3
```

### Example Queries

#### 1. Understanding Game Mechanics

```
You: How does Zelda 3 implement the magic meter drain?

Codex: Let me search the Zelda 3 source code for magic meter implementation.
[Uses zelda3 MCP server's search_code tool]
[Finds relevant code in src/player.c and src/zelda_rtl.c]
[Reads the source files]
[Explains the implementation]
```

#### 2. Cross-Implementation Comparison

```
You: Compare how Link's movement is implemented in the C code versus the assembly disassembly

Codex: I'll search both repositories.
[Uses zelda3 MCP server to search C code]
[Uses zelda3-disasm MCP server to search assembly]
[Compares and contrasts the implementations]
[Highlights differences and similarities]
```

#### 3. Emulator Development

```
You: Find all CPU instruction implementations in SNES9x

Codex: Let me search the SNES9x codebase.
[Uses snes9x MCP server's search_code tool]
[Lists instruction handler files]
[Explains the architecture]
```

#### 4. FPGA Implementation

```
You: How does the MiSTer FPGA core handle PPU rendering?

Codex: I'll search the MiSTer core for PPU implementation.
[Uses snes-mister MCP server]
[Finds HDL modules]
[Explains FPGA architecture]
```

#### 5. Repository Exploration

```
You: List all Python scripts in the Zelda 3 assets directory

Codex: [Uses zelda3 MCP server's list_files tool]
Found:
- assets/restool.py - Resource extraction tool
- assets/convert_tile.py - Tile converter
...
```

### Advanced Workflows

#### Multi-Repository Research

```
You: I want to understand how SNES DMA works. Search all codebases for DMA implementations.

Codex:
[Searches zelda3 C code for DMA usage]
[Searches zelda3-disasm for DMA assembly]
[Searches snes9x for DMA emulation code]
[Searches snes-mister for FPGA DMA logic]
[Synthesizes information from all sources]
```

#### Guided Exploration

```
You: I'm new to SNES development. Help me understand the architecture.

Codex: Let me guide you through the SNES architecture using these codebases.
[Uses list_files to show project structure]
[Searches for core components]
[Explains step-by-step with code examples]
```

## MCP Server Tools Reference

Each MCP server provides these tools:

### `search_code`

Search for code patterns using regex.

**Parameters:**
- `query` (required): Search pattern (supports regex)
- `file_type` (optional): File extension filter (e.g., 'c', 'h', 'py', 'v')
- `directory` (optional): Directory to search in

**Example:**
```
"Search zelda3 for sprite.*render"
"Find all .v files with 'ppu' in snes-mister"
```

### `list_files`

List files and directories in the repository.

**Parameters:**
- `directory` (optional): Directory path relative to repo root
- `recursive` (optional): List files recursively
- `filter` (optional): File extension filter

**Example:**
```
"List all C files in zelda3/src directory"
"Show the project structure for snes9x"
```

### `read_source_file`

Read contents of a specific source file.

**Parameters:**
- `file_path` (required): Path to file (relative to repo root)
- `start_line` (optional): Starting line number (1-based)
- `end_line` (optional): Ending line number

**Example:**
```
"Read zelda3/src/player.c lines 100-200"
"Show me the entire snes9x/ppu.cpp file"
```

## Configuration Options

### Model Selection

```bash
# Use GPT-5 (requires ChatGPT subscription)
codex --model gpt-5

# Use o3 for complex reasoning
codex --model o3

# Use o3-mini for faster responses
codex --model o3-mini

# Use local OSS model
codex --model oss
```

### Sandbox Settings

```toml
[mcp_servers.zelda3]
command = "node"
args = ["/path/to/index.js"]
env = { SANDBOX_MODE = "read-only" }  # read-only, workspace-write, full-access
```

### Environment Variables

```toml
[mcp_servers.zelda3]
env = {
  DEBUG = "true",           # Enable debug logging
  MAX_RESULTS = "50",       # Limit search results
  TIMEOUT = "30000"         # Tool timeout in ms
}
```

## Troubleshooting

### MCP Server Not Found

**Problem**: Codex can't find the MCP server

**Solutions**:
1. Check `~/.codex/config.toml` uses absolute paths
2. Verify the index.js file exists:
   ```bash
   ls -la /path/to/repos/zelda3/.mcp-server/index.js
   ```
3. Test server manually:
   ```bash
   cd /path/to/repos/zelda3/.mcp-server
   node index.js
   # Should wait for input (Ctrl+C to exit)
   ```

### Dependencies Missing

**Problem**: `Cannot find module '@modelcontextprotocol/sdk'`

**Solution**:
```bash
cd /path/to/repos/zelda3/.mcp-server
npm install
```

### Server Connection Timeout

**Problem**: MCP server takes too long to respond

**Solutions**:
1. Increase timeout in config:
   ```toml
   [mcp_servers.zelda3]
   timeout = 60  # seconds
   ```

2. Reduce search scope:
   ```
   "Search only in zelda3/src directory"
   ```

### Multiple Codex Instances

**Problem**: MCP servers fail when multiple Codex instances run

**Solution**: Each Codex instance starts its own MCP server processes. Close unused instances or use different config files.

## Best Practices

### 1. Start Specific for Better Results

❌ Bad: "Tell me about Zelda 3"
✅ Good: "Search Zelda 3 for Link's sword collision detection code"

### 2. Specify the Repository

When using multiple servers:
```
"Search the zelda3 C code (not disassembly) for magic meter"
```

### 3. Use Directory Filters

```
"Search only in zelda3/src/snes directory for PPU code"
```

### 4. Iterate with Follow-ups

```
You: "Find sprite rendering in zelda3"
Codex: [Shows search results]
You: "Read the first result at src/sprite.c"
Codex: [Shows the file]
You: "Explain how sprite priority works"
```

### 5. Leverage Multiple Sources

```
"Compare DMA implementation in zelda3 C code with the snes9x emulator implementation"
```

## Example Session

```bash
$ codex

Welcome to Codex CLI!
Loaded MCP servers: zelda3, snes9x, snes-mister, zelda3-disasm

You: I'm trying to understand how Zelda 3 implements the magic meter. Can you help?

Codex: I'll search the Zelda 3 source code for magic meter implementation.
[Searching zelda3 codebase...]

Found references in:
- src/player.c (lines 234-289)
- src/zelda_rtl.c (lines 1405-1432)
- src/dungeon.c (lines 892-915)

Would you like me to read any of these files?

You: Yes, read the player.c implementation

Codex: [Reading src/player.c lines 234-289...]

Here's how the magic meter works:

The magic meter is stored in `link_magic_power` (byte at 0x7EF36E).
Magic consumption happens in the `UseItemMagic()` function:

[Shows code snippet]

The meter has a maximum of 0x80 (128 units):
- Normal maximum: 0x80
- With 1/2 magic upgrade: consumption is halved
- Items like the lamp consume 2 units, arrows consume 0

Would you like to see how specific items consume magic?

You: Yes, show me how the lamp uses magic

Codex: [Searching for lamp implementation...]
[Shows lamp magic consumption code]
...
```

## Additional Resources

- **Codex CLI Documentation**: https://developers.openai.com/codex/cli/
- **MCP Specification**: https://modelcontextprotocol.io/
- **Per-Server Docs**:
  - [repos/zelda3/.mcp-server/CODEX_CLI.md](../../repos/zelda3/.mcp-server/CODEX_CLI.md)
  - [repos/snes9x/.mcp-server/CODEX_CLI.md](../../repos/snes9x/.mcp-server/CODEX_CLI.md)
  - [repos/SNES_MiSTer/.mcp-server/CODEX_CLI.md](../../repos/SNES_MiSTer/.mcp-server/CODEX_CLI.md)

## Support

If you encounter issues:

1. Check this guide's Troubleshooting section
2. Verify MCP server files exist and dependencies are installed
3. Test MCP servers manually: `node /path/to/.mcp-server/index.js`
4. Check Codex CLI logs: `codex --verbose`
5. Review MCP server README files in each `.mcp-server` directory

## Next Steps

1. ✅ Install Codex CLI
2. ✅ Run `./scripts/setup-codex-mcp.sh`
3. ✅ Start exploring: `codex`
4. 🎮 Ask questions about SNES development!

Happy coding with Codex CLI and SNES MCP servers! 🚀
