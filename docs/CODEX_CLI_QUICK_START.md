# Codex CLI Quick Start Guide

**Get started with Codex CLI + SNES MCP Servers in 3 minutes!**

## Installation (1 minute)

```bash
# Install Codex CLI
npm install -g @openai/codex

# Run automated setup
./scripts/setup-codex-mcp.sh
```

## Start Codex (30 seconds)

```bash
codex
```

Follow prompts to authenticate with your OpenAI account.

## Try It Out (1 minute)

Once in Codex CLI, try these queries:

### Example 1: Game Mechanics
```
How does Zelda 3 implement the magic meter drain?
```

### Example 2: Code Search
```
Search zelda3 for Link's sword attack collision detection
```

### Example 3: Repository Exploration
```
List all C files in the zelda3 src directory
```

### Example 4: Cross-Codebase Comparison
```
Compare how DMA is implemented in zelda3 C code vs snes9x emulator
```

### Example 5: FPGA Analysis
```
Find PPU rendering code in the MiSTer FPGA core
```

## Verify Setup

In Codex prompt, type:

```
/mcp servers
```

Should show:
- ✓ zelda3
- ✓ snes9x
- ✓ snes-mister
- ✓ zelda3-disasm

## Available Tools

Each MCP server provides:

| Tool | Description | Example |
|------|-------------|---------|
| `search_code` | Search code with regex | "Search for sprite.*render" |
| `list_files` | Browse repository | "List all files in src/" |
| `read_source_file` | Read specific file | "Read src/player.c" |

## Tips

✅ **Be Specific**: "Search zelda3/src for magic" is better than "magic code"

✅ **Use Filters**: "Search only .c files in zelda3/src directory"

✅ **Iterate**: Search → Read → Ask follow-up questions

✅ **Cross-Reference**: "Compare X in zelda3 vs snes9x"

## Need Help?

- Full Guide: [docs/guides/codex-cli-integration.md](guides/codex-cli-integration.md)
- Per-Server Docs: `repos/*/.mcp-server/CODEX_CLI.md`
- Codex CLI Help: `codex --help`

## Models

```bash
codex --model gpt-5      # Best quality (ChatGPT subscription)
codex --model o3         # Complex reasoning
codex --model o3-mini    # Faster responses
```

That's it! Start exploring SNES development with AI assistance! 🎮✨
