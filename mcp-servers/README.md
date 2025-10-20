# MCP Servers Directory

This directory is intended to contain standalone MCP (Model Context Protocol) server implementations.

## Currently Available MCP Servers

The following MCP servers are currently implemented:

### Code Search Servers (in repos/)
- **zelda3** - Zelda 3 C reimplementation code search (`repos/zelda3/.mcp-server/`)
- **snes9x** - SNES9x emulator code search (`repos/snes9x/.mcp-server/`)
- **snes-mister** - SNES MiSTer FPGA code search (`repos/SNES_MiSTer/.mcp-server/`)
- **zelda3-disasm** - Zelda 3 assembly disassembly (`repos/zelda3-disasm/dist/`)

### Planned/Future Servers
- **snes-mcp-server** - SNES development tools (instruction lookup, memory mapping, manual search)
- **bsnes-gamer** - Native bsnes emulator control
- **emulatorjs-mcp-server** - Browser-based emulator with Playwright
- **bsnes** - bsnes MCP server

## Configuration

MCP servers are configured in two places:

1. **For Claude Code CLI**: `.mcp/config.json` and `.mcp.json`
2. **For Codex CLI**: `codex-mcp-config.toml`

## Creating New MCP Servers

To create a new MCP server:

1. Create a directory: `mkdir mcp-servers/your-server-name`
2. Initialize with npm: `cd mcp-servers/your-server-name && npm init`
3. Install MCP SDK: `npm install @modelcontextprotocol/sdk`
4. Implement your server following MCP protocol
5. Add configuration to `.mcp/config.json` and `codex-mcp-config.toml`

