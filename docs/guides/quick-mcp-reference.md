# Quick MCP Server Reference

Fast reference for common MCP server operations.

## Server List

| Server | Command | Purpose |
|--------|---------|---------|
| snes-mcp-server | `snes-mcp-server` | 65816 assembly, manuals, ROM analysis |
| bsnes-gamer | `bsnes-gamer` | Native emulator, memory access |
| emulatorjs | `emulatorjs` | Browser emulator, screenshots |
| playwright | `playwright` | Web automation |
| zelda3 | `zelda3` | C code search |
| zelda3-disasm | `zelda3-disasm` | Assembly search |

## Quick Commands

### SNES Development

```typescript
// Lookup instruction
await use_mcp_tool("snes-mcp-server", "lookup_instruction", {
  mnemonic: "LDA"
});

// Search Nintendo manual
await use_mcp_tool("snes-mcp-server", "manual_search", {
  query: "sprite DMA"
});

// Get register info
await use_mcp_tool("snes-mcp-server", "register_info", {
  address: "$2100"
});
```

### Emulation Testing

```typescript
// Native emulator (fast, full memory)
await use_mcp_tool("bsnes-gamer", "start_emulator", {
  rom_path: "./zelda3.smc"
});

await use_mcp_tool("bsnes-gamer", "read_memory", {
  address: "0x7EF360",
  size: 2
});

// Browser emulator (visual, screenshots)
await use_mcp_tool("emulatorjs", "start_emulator", {
  rom_path: "./zelda3.smc"
});

await use_mcp_tool("emulatorjs", "take_screenshot", {
  filepath: "./test.png"
});
```

### Code Search

```typescript
// Search C reimplementation
await use_mcp_tool("zelda3", "search_code", {
  query: "magic consumption"
});

// Search assembly
await use_mcp_tool("zelda3-disasm", "search_code", {
  query: "sprite handler"
});
```

### Web Automation

```typescript
// Navigate and screenshot
await use_mcp_tool("playwright", "browser_navigate", {
  url: "https://example.com"
});

await use_mcp_tool("playwright", "browser_take_screenshot", {
  filename: "./screenshot.png"
});

// Click element
await use_mcp_tool("playwright", "browser_click", {
  element: "Submit button",
  ref: "button[type='submit']"
});
```

## Common Workflows

### ROM Mod Testing

```bash
# 1. Create mod
./scripts/zelda3-modder-demo.sh infinite-magic

# 2. Test native
bsnes-gamer → start_emulator → run_frames → get_game_state

# 3. Visual test
emulatorjs → start_emulator → run_frames → take_screenshot
```

### Reverse Engineering

```bash
# 1. Search assembly
zelda3-disasm → search_code

# 2. Cross-ref C code
zelda3 → search_code

# 3. Lookup instructions
snes-mcp-server → lookup_instruction

# 4. Test in emulator
bsnes-gamer → read_memory
```

### Documentation

```bash
# 1. Search manuals
snes-mcp-server → manual_search

# 2. Take screenshots
playwright → browser_take_screenshot

# 3. Capture gameplay
emulatorjs → take_screenshot
```

## Tool Comparison

| Need | Use |
|------|-----|
| Fast ROM testing | bsnes-gamer |
| Visual testing | emulatorjs |
| Memory access | bsnes-gamer |
| Screenshots | emulatorjs or playwright |
| Assembly lookup | snes-mcp-server |
| Code search | zelda3 or zelda3-disasm |
| Web testing | playwright |

## Setup Checklist

```bash
# Build custom servers
cd snes-mcp-server && npm run build
cd bsnes-gamer && npm run build
cd emulatorjs-mcp-server && npm run build

# Install browsers
npx playwright install chromium

# Build bsnes
cd bsnes-plus && make

# Verify config
cat .mcp.json
```

## Help

- Full overview: `docs/guides/mcp-servers-overview.md`
- EmulatorJS: `docs/guides/emulatorjs-mcp-quick-start.md`
- Playwright: `docs/guides/playwright-mcp-integration.md`
- Project: `CLAUDE.md`
