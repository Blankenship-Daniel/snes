# Port Configuration

This document describes the port assignments for all services in the SNES development ecosystem.

## Port Assignments

| Service | Port | Protocol | Configurable | Notes |
|---------|------|----------|--------------|-------|
| **emulatorjs-mcp-server** | 3000 | HTTP | Yes | Web server for EmulatorJS interface |
| **snes-mcp-server** | N/A | stdio | N/A | Pure MCP server (no HTTP) |
| **zelda3-disasm** | N/A | stdio | N/A | Pure MCP server (no HTTP) |
| **bsnes** | N/A | stdio | N/A | Pure MCP server (no HTTP) |
| **snes9x** | N/A | stdio | N/A | Pure MCP server (no HTTP) |
| **zelda3** | N/A | stdio | N/A | Pure MCP server (no HTTP) |
| **snes-mister** | N/A | stdio | N/A | Pure MCP server (no HTTP) |
| **playwright** | N/A | stdio | N/A | Pure MCP server (no HTTP) |

## EmulatorJS Port Configuration

The EmulatorJS MCP server uses an HTTP port to serve the browser-based emulator interface. This port can be configured via environment variable:

### Default Port
```bash
# Default: port 3000
node ./emulatorjs-mcp-server/dist/index.js
```

### Custom Port
```bash
# Use custom port via environment variable
EMULATORJS_PORT=8080 node ./emulatorjs-mcp-server/dist/index.js
```

### MCP Configuration
To use a custom port in `.mcp.json`:

```json
{
  "mcpServers": {
    "emulatorjs": {
      "command": "node",
      "args": ["./emulatorjs-mcp-server/dist/index.js"],
      "env": {
        "EMULATORJS_PORT": "8080"
      },
      "description": "Browser-based SNES emulator with AI gameplay control"
    }
  }
}
```

## Port Conflict Resolution

### Previous Issue
The emulatorjs-mcp-server previously used port 8888, which could conflict with:
- Other development servers
- Existing services on the system
- Multiple emulatorjs instances

### Current Solution
- **Default changed to port 3000** (common development port)
- **Configurable via `EMULATORJS_PORT` environment variable**
- **All other MCP servers use stdio** (no port conflicts)

### Checking for Port Conflicts

```bash
# Check if port 3000 is available
lsof -i :3000

# Check if any custom port is available
lsof -i :YOUR_PORT
```

### Cleaning Up Port Usage

```bash
# Find process using a port
lsof -i :3000

# Kill process by PID
kill <PID>

# Kill all emulatorjs processes
pkill -f "emulatorjs-mcp-server"
```

## Best Practices

1. **Use environment variables** for port configuration in production
2. **Document custom ports** if you change from defaults
3. **Check for conflicts** before starting services
4. **Clean up zombie processes** regularly (see cleanup commands above)
5. **Use stdio-based MCP servers** when possible (no port conflicts)

## Related Documentation

- [EmulatorJS MCP Server README](../emulatorjs-mcp-server/README.md)
- [MCP Configuration](../.mcp.json)
- [CLAUDE.md - Project Overview](../CLAUDE.md)
