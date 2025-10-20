# MCP Server Integration - Complete Setup Guide

**Status**: ✅ Fully Integrated for Both Claude Code CLI and Codex CLI

**Date**: 2025-10-19

## Overview

All MCP (Model Context Protocol) servers have been fully configured and integrated for use with both Claude Code CLI and Codex CLI. This document provides a comprehensive overview of the setup.

## Available MCP Servers

### Code Search Servers

| Server | Location | Tools | Description |
|--------|----------|-------|-------------|
| **zelda3** | [repos/zelda3/.mcp-server/](../repos/zelda3/.mcp-server/) | search_code, list_files, read_source_file | Zelda 3 C reimplementation code search |
| **snes9x** | [repos/snes9x/.mcp-server/](../repos/snes9x/.mcp-server/) | search_code, list_files, read_source_file | SNES9x emulator codebase search |
| **snes-mister** | [repos/SNES_MiSTer/.mcp-server/](../repos/SNES_MiSTer/.mcp-server/) | search_code, list_files, read_source_file | MiSTer FPGA SNES core search |
| **zelda3-disasm** | [repos/zelda3-disasm/](../repos/zelda3-disasm/) | search_code, list_files, read_source_file | Zelda 3 assembly disassembly search |

### Official Servers

| Server | Command | Tools | Description |
|--------|---------|-------|-------------|
| **playwright** | `npx -y @playwright/mcp@latest` | 15+ browser automation tools | Browser automation, screenshots, form filling, navigation |

## Configuration Files

### For Claude Code CLI

Two configuration files are used:

#### 1. `.mcp/config.json`
Primary configuration for Claude Code workspace MCP servers.

**Location**: [.mcp/config.json](../.mcp/config.json)

**Servers Configured**:
- zelda3
- snes9x
- snes-mister
- zelda3-disasm
- playwright

#### 2. `.mcp.json`
Alternative configuration format (legacy/compatibility).

**Location**: [.mcp.json](../.mcp.json)

**Servers Configured**: Same as above

### For Codex CLI

#### `codex-mcp-config.toml`
Master configuration file for Codex CLI with all SNES MCP servers.

**Location**: [codex-mcp-config.toml](../codex-mcp-config.toml)

**Servers Configured**: All 5 servers (zelda3, snes9x, snes-mister, zelda3-disasm, playwright)

**Installation**:
```bash
# Option 1: Use setup script (recommended)
./scripts/setup-codex-mcp.sh

# Option 2: Manual installation
cp codex-mcp-config.toml ~/.codex/config.toml
```

## Server Status

All servers verified and ready:

```
✓ repos/zelda3/.mcp-server/index.js
✓ repos/snes9x/.mcp-server/index.js
✓ repos/SNES_MiSTer/.mcp-server/index.js
✓ repos/zelda3-disasm/dist/index.js
✓ Playwright (npx @playwright/mcp@latest)
```

All dependencies installed:

```
✓ repos/zelda3/.mcp-server/node_modules
✓ repos/snes9x/.mcp-server/node_modules
✓ repos/SNES_MiSTer/.mcp-server/node_modules
✓ repos/zelda3-disasm/node_modules
```

## Usage

### With Claude Code CLI

Claude Code automatically detects and loads MCP servers from `.mcp/config.json` and `.mcp.json`.

**Example queries**:
```
"Search zelda3 for Link's movement code"
"Find sprite rendering in snes9x"
"Show me PPU implementation in MiSTer FPGA core"
"Search zelda3-disasm for dungeon entrance code"
"Take a screenshot of the current browser page" (with Playwright)
```

### With Codex CLI

After running the setup script, Codex CLI will have access to all MCP servers.

**Setup**:
```bash
# Install Codex CLI
npm install -g @openai/codex

# Run automated setup
./scripts/setup-codex-mcp.sh

# Start Codex
codex
```

**Example queries in Codex**:
```
"Search zelda3 for magic consumption code"
"Find audio emulation in snes9x APU"
"Compare PPU scanline timing in MiSTer vs snes9x"
"Show assembly for the game intro sequence"
```

## MCP Server Architecture

### Code Search Servers Architecture

All code search MCP servers (`zelda3`, `snes9x`, `snes-mister`) follow the same architecture:

**Implementation**: Simple Node.js MCP servers using `@modelcontextprotocol/sdk`

**Tools Provided**:
1. **search_code** - Search for code patterns using ripgrep
   - Parameters: `query` (search pattern), `file_pattern` (optional glob)
   - Returns: Matching files with code snippets

2. **list_files** - List all files in the repository
   - Parameters: `pattern` (optional glob filter)
   - Returns: List of file paths

3. **read_source_file** - Read complete file contents
   - Parameters: `file_path` (relative path)
   - Returns: Full file contents with line numbers

**Directory Structure**:
```
repos/{project}/.mcp-server/
├── index.js           # MCP server implementation
├── package.json       # Dependencies (@modelcontextprotocol/sdk)
├── node_modules/      # Installed dependencies
├── codex-config.toml  # Per-server Codex config
└── CODEX_CLI.md       # Usage documentation
```

### Zelda3-disasm Architecture

The Zelda 3 assembly disassembly MCP server is a TypeScript-based implementation.

**Implementation**: TypeScript MCP server with build step

**Directory Structure**:
```
repos/zelda3-disasm/
├── src/               # TypeScript source
├── dist/              # Compiled JavaScript
│   └── index.js       # MCP server entry point
├── package.json       # Build scripts + dependencies
└── node_modules/      # Installed dependencies
```

**Build**:
```bash
cd repos/zelda3-disasm
npm run build
```

### Playwright Architecture

Official Playwright MCP server, dynamically loaded via npx.

**No Installation Required**: Automatically downloaded when needed

**Command**: `npx -y @playwright/mcp@latest`

## Configuration Management

### Synchronized Configurations

All three configuration files are kept in sync:
- `.mcp/config.json` (Claude Code primary)
- `.mcp.json` (Claude Code alternative)
- `codex-mcp-config.toml` (Codex CLI)

**To update all configs**:
1. Edit one configuration file
2. Propagate changes to the others
3. Verify with: `./scripts/setup-codex-mcp.sh`

### Adding New MCP Servers

To add a new MCP server:

1. **Create the server directory**:
```bash
mkdir -p repos/{project}/.mcp-server
cd repos/{project}/.mcp-server
```

2. **Initialize and install dependencies**:
```bash
npm init -y
npm install @modelcontextprotocol/sdk
```

3. **Create `index.js`** with MCP server implementation

4. **Add to all config files**:
   - Add entry to `.mcp/config.json`
   - Add entry to `.mcp.json`
   - Add entry to `codex-mcp-config.toml`
   - Update `scripts/setup-codex-mcp.sh`

5. **Test the server**:
```bash
node repos/{project}/.mcp-server/index.js
# Should start and wait for JSON-RPC input
```

## Troubleshooting

### MCP Server Not Found

**Symptom**: "Server not found" or "Command failed"

**Solution**:
```bash
# Verify entry point exists
ls -la repos/{project}/.mcp-server/index.js

# Check dependencies
cd repos/{project}/.mcp-server && npm install
```

### Dependencies Missing

**Symptom**: "Cannot find module '@modelcontextprotocol/sdk'"

**Solution**:
```bash
cd repos/{project}/.mcp-server
npm install
```

### Codex CLI Config Not Working

**Symptom**: Codex doesn't see MCP servers

**Solution**:
```bash
# Re-run setup script
./scripts/setup-codex-mcp.sh

# Verify config
cat ~/.codex/config.toml

# Check for absolute paths
grep "args = " ~/.codex/config.toml
```

### Zelda3-disasm Not Built

**Symptom**: "Cannot find repos/zelda3-disasm/dist/index.js"

**Solution**:
```bash
cd repos/zelda3-disasm
npm run build
```

## Documentation

### Per-Server Documentation

Each MCP server has its own documentation:

- [repos/zelda3/.mcp-server/CODEX_CLI.md](../repos/zelda3/.mcp-server/CODEX_CLI.md)
- [repos/snes9x/.mcp-server/CODEX_CLI.md](../repos/snes9x/.mcp-server/CODEX_CLI.md)
- [repos/SNES_MiSTer/.mcp-server/CODEX_CLI.md](../repos/SNES_MiSTer/.mcp-server/CODEX_CLI.md)

### Integration Guides

- [docs/guides/codex-cli-integration.md](guides/codex-cli-integration.md) - Complete Codex CLI guide
- [docs/CODEX_CLI_QUICK_START.md](../CODEX_CLI_QUICK_START.md) - 3-minute quick start
- [.mcp/README.md](../.mcp/README.md) - Claude Code CLI configuration
- [mcp-servers/README.md](../mcp-servers/README.md) - Future MCP server directory

### Reference Documentation

- [docs/guides/mcp-servers-overview.md](guides/mcp-servers-overview.md) - Overview of all servers
- [docs/CODE_ORGANIZATION_TOOLS.md](../docs/CODE_ORGANIZATION_TOOLS.md) - Code organization tools

## Scripts

### Setup Script

**Location**: [scripts/setup-codex-mcp.sh](../scripts/setup-codex-mcp.sh)

**Purpose**: Automated Codex CLI configuration

**Usage**:
```bash
./scripts/setup-codex-mcp.sh
```

**What it does**:
1. Checks if Codex CLI is installed
2. Backs up existing config (if present)
3. Generates new config with absolute paths
4. Verifies all MCP server files exist
5. Provides usage instructions

## Directory Structure

```
snes/
├── .mcp/                          # Claude Code MCP config
│   ├── config.json                # Primary config
│   └── README.md                  # Documentation
├── .mcp.json                      # Alternative Claude Code config
├── codex-mcp-config.toml          # Codex CLI config (master)
├── mcp-servers/                   # Future standalone servers
│   └── README.md                  # Placeholder documentation
├── repos/                         # Git repositories
│   ├── zelda3/
│   │   └── .mcp-server/           # Code search MCP server
│   │       ├── index.js
│   │       ├── package.json
│   │       ├── codex-config.toml
│   │       └── CODEX_CLI.md
│   ├── snes9x/
│   │   └── .mcp-server/           # Code search MCP server
│   │       └── (same structure)
│   ├── SNES_MiSTer/
│   │   └── .mcp-server/           # Code search MCP server
│   │       └── (same structure)
│   └── zelda3-disasm/             # TypeScript MCP server
│       ├── src/
│       ├── dist/index.js
│       └── package.json
├── scripts/
│   └── setup-codex-mcp.sh         # Automated setup
└── docs/
    ├── MCP_INTEGRATION_COMPLETE.md  # This file
    ├── CODEX_CLI_QUICK_START.md     # Quick start guide
    └── guides/
        ├── codex-cli-integration.md  # Full integration guide
        └── mcp-servers-overview.md   # Server overview
```

## Summary

### Completed Setup

✅ **5 MCP Servers Configured**:
- zelda3 (C reimplementation)
- snes9x (emulator)
- snes-mister (FPGA core)
- zelda3-disasm (assembly)
- playwright (browser automation)

✅ **3 Configuration Files Updated**:
- `.mcp/config.json` (Claude Code primary)
- `.mcp.json` (Claude Code alternative)
- `codex-mcp-config.toml` (Codex CLI)

✅ **All Dependencies Verified**:
- All node_modules installed
- All entry points exist
- All builds complete

✅ **Setup Script Created**:
- Automated Codex CLI configuration
- Absolute path generation
- Verification checks

✅ **Comprehensive Documentation**:
- Per-server guides
- Integration documentation
- Quick start guides
- Troubleshooting tips

### Next Steps for Users

1. **For Claude Code**: MCP servers are automatically loaded - just start using them
2. **For Codex CLI**: Run `./scripts/setup-codex-mcp.sh` to configure

### Future Expansion

The `mcp-servers/` directory is ready for additional standalone MCP servers:
- snes-mcp-server (SNES development tools)
- bsnes-gamer (native emulator control)
- emulatorjs-mcp-server (browser emulation)
- Custom MCP servers for specific tasks

---

**Last Updated**: 2025-10-19
**Integration Status**: Complete ✅
