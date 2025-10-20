# MCP Server Connection Troubleshooting Guide

## Problem Summary

The MCP servers in this repository were failing to connect when used with Claude Code CLI and Codex CLI. This document explains the root cause and the solution.

## Root Cause

The original `.mcp.json` configuration used **relative paths** without specifying a working directory:

```json
{
  "mcpServers": {
    "snes-mcp-server": {
      "command": "node",
      "args": [
        "./snes-mcp-server/dist/index.js"  // ❌ Relative path
      ]
    }
  }
}
```

### Why This Failed

1. **Working Directory Dependency**: Relative paths in MCP configurations are resolved from the **current working directory** of the CLI process
2. **Different Execution Contexts**: Claude Code and Codex may start from different directories depending on:
   - Where the CLI was launched
   - IDE workspace settings
   - Terminal current directory
3. **Result**: If the CLI wasn't running from the repository root (e.g., `/path/to/your/snes-repo`), the relative path `./snes-mcp-server/dist/index.js` would point to a non-existent location

## Solution

Use the `cwd` (current working directory) parameter to ensure all MCP servers run from the repository root:

```json
{
  "mcpServers": {
    "snes-mcp-server": {
      "command": "node",
      "args": [
        "./snes-mcp-server/dist/index.js"
      ],
      "cwd": "/path/to/your/snes-repo",  // ✅ Explicit working directory (repo root)
      "description": "SNES development tools..."
    }
  }
}
```

## How `cwd` Fixes the Problem

The `cwd` parameter tells the MCP client:
1. **Change to this directory first** before executing the command
2. **Resolve all relative paths** from this location
3. **Consistent behavior** across different CLI invocations

This approach provides:
- ✅ **Cross-CLI Compatibility**: Works with Claude Code, Codex, and other MCP clients
- ✅ **Predictable Behavior**: Always runs from the same directory
- ✅ **Portable Configuration**: Can be version controlled and shared
- ✅ **Relative Paths**: Keep using simple relative paths in `args`

## Additional Fix: snes-mcp-server Path Resolution

The `snes-mcp-server` also had an internal path resolution issue. It was looking for `parsed-data` using:

```typescript
// ❌ BEFORE: Used process.cwd() which depended on where the process started
const parsedDataDir = path.join(process.cwd(), 'parsed-data');
```

This failed because:
- `process.cwd()` returns the repository root (e.g., `/path/to/your/snes-repo`)
- But `parsed-data` is located at `<repo-root>/snes-mcp-server/parsed-data`

### Fix Applied

Changed to use the script's own directory:

```typescript
// ✅ AFTER: Use __dirname to find data relative to the server code
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In dist/manual, go up 2 levels to snes-mcp-server root
const parsedDataDir = path.join(__dirname, '..', '..', 'parsed-data');
```

## Alternative Solutions (Not Recommended)

### Option 1: Absolute Paths
```json
{
  "args": [
    "/path/to/your/snes-repo/snes-mcp-server/dist/index.js"
  ]
}
```
❌ **Problem**: Not portable across different machines or user directories

### Option 2: Environment Variables
```json
{
  "args": [
    "${SNES_REPO_PATH}/snes-mcp-server/dist/index.js"
  ],
  "env": {
    "SNES_REPO_PATH": "/path/to/your/snes-repo"
  }
}
```
❌ **Problem**: Requires setting environment variables; more complex

### Option 3: Workspace Variables (IDE-specific)
```json
{
  "args": [
    "${workspaceFolder}/snes-mcp-server/dist/index.js"
  ]
}
```
❌ **Problem**: Not supported by all MCP clients; Claude Code doesn't expand these variables

## Testing the Fix

After applying the fix, all servers should start successfully:

```bash
# Test each server individually
cd /path/to/your/snes-repo

node ./snes-mcp-server/dist/index.js    # Should start without errors
node ./repos/bsnes-plus/mcp-server/index.js   # Should print "bsnes-plus MCP server running on stdio"
node ./repos/zelda3/mcp-server/index.js       # Should print "Zelda3 MCP server running on stdio"
node ./repos/SNES_MiSTer/mcp-server/index.js  # Should print "SNES MiSTer MCP server running on stdio"
node ./repos/snes9x/mcp-server/index.js       # Should print "SNES9x MCP server running on stdio"
```

## Verifying in Claude Code/Codex

1. **Restart the CLI** to reload the `.mcp.json` configuration
2. **Check server status**:
   ```bash
   claude mcp list  # or equivalent in Codex
   ```
3. **Look for all 5 servers** listed as available
4. **Test a tool** to ensure the connection works

## Best Practices for MCP Configuration

1. **Always use `cwd`** for project-scoped MCP servers
2. **Use relative paths** in `args` after setting `cwd`
3. **Use absolute paths** only for globally installed tools
4. **Document the expected directory structure** in your README
5. **Version control** your `.mcp.json` for team sharing
6. **Test from different directories** to ensure portability

## Key Learnings from Exa Research

From researching MCP configurations across different projects:

1. **The `cwd` parameter is well-supported** by major MCP clients (Claude Code, Codex, Continue, etc.)
2. **Configuration scopes** exist at multiple levels:
   - **User scope**: `~/.claude/mcp.json` (global for all projects)
   - **Project scope**: `.mcp.json` or `.claude/mcp.json` (project-specific)
   - **Local scope**: `.claude/mcp.local.json` (git-ignored overrides)
3. **Environment variable expansion** is NOT universally supported
4. **Workspace variables** like `${workspaceFolder}` are IDE-specific

## Common Issues and Solutions

### Issue: "Command not found" or "Cannot find module"
**Cause**: MCP client can't find the server executable
**Solution**: Add `cwd` parameter to set the correct working directory

### Issue: "ENOENT: no such file or directory"
**Cause**: Server code uses `process.cwd()` to find data files
**Solution**: Use `__dirname` or `import.meta.url` for path resolution

### Issue: "Server connection timeout"
**Cause**: Server crashes on startup due to missing dependencies
**Solution**: Check server logs; ensure all npm dependencies are installed

### Issue: "Different behavior in different CLIs"
**Cause**: Each CLI starts from a different working directory
**Solution**: Use `cwd` parameter for consistency

## Further Reading

- [MCP Specification](https://modelcontextprotocol.io)
- [Claude Code MCP Documentation](https://docs.claude.com/en/docs/claude-code/mcp)
- [GitHub Issue #3098: MCP Configuration Inconsistency](https://github.com/anthropics/claude-code/issues/3098)
- [MCP Server Configuration Best Practices](https://mcp-framework.com/docs/server-configuration)

## Summary

The fix is simple:
1. **Add `cwd` parameter** to each MCP server in `.mcp.json`
2. **Set it to the repository root** so relative paths work consistently
3. **Fix internal path resolution** in server code to use `__dirname` instead of `process.cwd()`

This ensures your MCP servers work reliably across Claude Code CLI, Codex CLI, and any other MCP-compatible client.
