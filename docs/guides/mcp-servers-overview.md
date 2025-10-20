# MCP Servers Overview

This repository includes multiple Model Context Protocol (MCP) servers that provide specialized capabilities to AI agents. This guide provides an overview of all available servers and their use cases.

## Available MCP Servers

### 1. snes-mcp-server (SNES Development Tools)
**Type**: Custom
**Location**: `snes-mcp-server/`
**Command**: `node ./snes-mcp-server/dist/index.js`

**Purpose**: Comprehensive SNES development toolkit with 65816 assembly programming support, ROM analysis, and official Nintendo manual access.

**Key Tools** (14 total):
- `lookup_instruction` - 65816 instruction details
- `memory_map` - SNES memory region queries
- `register_info` - Hardware register documentation
- `generate_asm_template` - Assembly code generation
- `manual_search` - Search Nintendo dev manuals
- `sprite_calc` - Sprite/tile calculations
- ROM analysis and asset extraction tools

**Use Cases**:
- Looking up 65816 assembly instructions
- Understanding SNES hardware registers
- Searching official Nintendo documentation
- Generating assembly code templates
- Analyzing ROM structure

### 2. bsnes-gamer (Native Emulator Control)
**Type**: Custom
**Location**: `bsnes-gamer/`
**Command**: `node ./bsnes-gamer/dist/index.js`

**Purpose**: Real-time control of native bsnes emulator for gameplay testing and memory analysis.

**Key Tools** (7 total):
- `start_emulator` - Launch bsnes with ROM
- `press_button` - Controller input
- `run_frames` - Run emulation
- `read_memory` - Full WRAM access
- `get_game_state` - Zelda 3 game state (rupees, hearts, etc.)
- `reset_emulator` - Reset game
- `stop_emulator` - Stop emulator

**Use Cases**:
- Fast native emulation testing
- Full memory access for reverse engineering
- Automated gameplay testing
- ROM validation with actual game state

### 3. emulatorjs (Browser-Based Emulator)
**Type**: Custom
**Location**: `emulatorjs-mcp-server/`
**Command**: `node ./emulatorjs-mcp-server/dist/index.js`

**Purpose**: Browser-based SNES emulation with Playwright automation for visual testing and AI gameplay control.

**Key Tools** (10 total):
- `start_emulator` - Launch browser emulator with ROM
- `press_button` - Controller input (A, B, X, Y, L, R, etc.)
- `run_frames` - Run emulation frames
- `take_screenshot` - Capture game visuals
- `read_memory` - Memory access (limited)
- `get_game_state` - Emulator state
- `save_state`/`load_state` - State management
- `reset_emulator` - Reset game
- `stop_emulator` - Cleanup

**Use Cases**:
- Visual regression testing
- Screenshot-based AI analysis
- Browser-based ROM validation
- Automated playtesting with visual feedback

### 4. playwright (Official Playwright MCP)
**Type**: Official (via npx)
**Command**: `npx -y @playwright/mcp@latest`

**Purpose**: General-purpose browser automation for web testing, form filling, and UI interaction.

**Key Tools** (15+ total):
- `browser_navigate` - Navigate to URLs
- `browser_click` - Click elements
- `browser_type` - Type text
- `browser_snapshot` - Accessibility tree snapshot
- `browser_take_screenshot` - Visual screenshots
- `browser_fill_form` - Fill multiple fields
- `browser_evaluate` - Run JavaScript
- `browser_wait_for` - Wait for conditions
- And more...

**Use Cases**:
- Testing web-based tools and dashboards
- Automating browser workflows
- Form automation
- Web UI testing

### 5. zelda3 (C Reimplementation Search)
**Type**: Custom Code Search
**Location**: `repos/zelda3/mcp-server/`
**Command**: `node ./repos/zelda3/mcp-server/index.js`

**Purpose**: Search and analyze the Zelda 3 C reimplementation codebase.

**Use Cases**:
- Understanding game logic from C source
- Finding function implementations
- Cross-referencing with assembly code
- Learning game mechanics

### 6. zelda3-disasm (Assembly Disassembly)
**Type**: Custom Code Search
**Location**: `repos/zelda3-disasm/mcp-server/`
**Command**: `node ./repos/zelda3-disasm/mcp-server/index.js`

**Purpose**: Search and analyze the full Zelda 3 assembly disassembly.

**Use Cases**:
- Finding assembly functions and routines
- Understanding ROM bank organization
- Locating sprite/enemy handlers
- Analyzing game components (player, dungeons, etc.)

### 7. bsnes (bsnes-plus Code Search)
**Type**: Custom Code Search
**Location**: `repos/bsnes-plus/mcp-server/`
**Command**: `node ./repos/bsnes-plus/mcp-server/index.js`

**Purpose**: Search bsnes-plus emulator source code.

**Use Cases**:
- Understanding emulator implementation
- Finding CPU/PPU/APU code
- Analyzing debugger features
- Learning SNES hardware emulation

### 8. snes9x (SNES9x Code Search)
**Type**: Custom Code Search
**Location**: `repos/snes9x/mcp-server/`
**Command**: `node ./repos/snes9x/mcp-server/index.js`

**Purpose**: Search SNES9x emulator source code.

**Use Cases**:
- Alternative emulator implementation reference
- Comparing with bsnes approach
- Finding specific emulation features

### 9. snes-mister (FPGA Core Analysis)
**Type**: Custom Code Search
**Location**: `repos/SNES_MiSTer/mcp-server/`
**Command**: `node ./repos/SNES_MiSTer/mcp-server/index.js`

**Purpose**: Search and analyze SNES MiSTer FPGA core (VHDL/SystemVerilog).

**Use Cases**:
- Understanding hardware-level SNES implementation
- Analyzing FPGA synthesis
- Learning cycle-accurate hardware design

## Server Categories

### Development Tools
- **snes-mcp-server** - Assembly programming and documentation

### Emulation & Testing
- **bsnes-gamer** - Native emulator (fast, full memory access)
- **emulatorjs** - Browser emulator (visual, screenshots)
- **playwright** - General browser automation

### Code Search & Analysis
- **zelda3** - C reimplementation
- **zelda3-disasm** - Assembly disassembly
- **bsnes** - bsnes-plus source
- **snes9x** - SNES9x source
- **snes-mister** - FPGA core

## Common Workflows

### 1. Reverse Engineering a Game Feature

```typescript
// 1. Search assembly for the feature
await use_mcp_tool("zelda3-disasm", "search_code", {
  query: "magic consumption"
});

// 2. Cross-reference with C reimplementation
await use_mcp_tool("zelda3", "search_code", {
  query: "magic"
});

// 3. Lookup hardware registers involved
await use_mcp_tool("snes-mcp-server", "register_info", {
  name: "VRAM"
});

// 4. Test with native emulator
await use_mcp_tool("bsnes-gamer", "start_emulator", {
  rom_path: "./zelda3.smc"
});

await use_mcp_tool("bsnes-gamer", "read_memory", {
  address: "0x7EF36E"  // Magic meter
});
```

### 2. Creating and Validating a ROM Mod

```bash
# 1. Create mod using snes-modder
./scripts/zelda3-modder-demo.sh infinite-magic

# 2. Binary validation
./scripts/validate-mods.sh

# 3. Test with native emulator
await use_mcp_tool("bsnes-gamer", "start_emulator", {
  rom_path: "./zelda3-infinite-magic.smc"
});

await use_mcp_tool("bsnes-gamer", "run_frames", { frames: 600 });
await use_mcp_tool("bsnes-gamer", "get_game_state", {});

# 4. Visual validation with browser emulator
await use_mcp_tool("emulatorjs", "start_emulator", {
  rom_path: "./zelda3-infinite-magic.smc"
});

await use_mcp_tool("emulatorjs", "run_frames", { frames: 300 });
await use_mcp_tool("emulatorjs", "take_screenshot", {
  filepath: "./validation/infinite-magic-test.png"
});
```

### 3. Web Dashboard Testing

```typescript
// Use Playwright for web UI testing
await use_mcp_tool("playwright", "browser_navigate", {
  url: "http://localhost:3000/dashboard"
});

await use_mcp_tool("playwright", "browser_snapshot", {});

await use_mcp_tool("playwright", "browser_click", {
  element: "Build ROM button",
  ref: "#build-btn"
});

await use_mcp_tool("playwright", "browser_wait_for", {
  text: "Build complete"
});

await use_mcp_tool("playwright", "browser_take_screenshot", {
  filename: "./screenshots/dashboard.png"
});
```

## Server Selection Guide

**Need to...**

- **Lookup 65816 instructions?** → snes-mcp-server
- **Search Nintendo manuals?** → snes-mcp-server
- **Understand game logic?** → zelda3 (C code) or zelda3-disasm (assembly)
- **Test a ROM quickly?** → bsnes-gamer (native, fast)
- **Take gameplay screenshots?** → emulatorjs (browser-based)
- **Read game memory?** → bsnes-gamer (full access)
- **Automate web testing?** → playwright
- **Understand emulator internals?** → bsnes or snes9x
- **Study hardware implementation?** → snes-mister (FPGA)

## Setup Requirements

### All Servers
```bash
# Build all MCP servers
cd snes-mcp-server && npm install && npm run build && cd ..
cd bsnes-gamer && npm install && npm run build && cd ..
cd emulatorjs-mcp-server && npm install && npm run build && cd ..
# Other servers follow similar pattern
```

### Browser-Based Servers
```bash
# Install Playwright browsers (for emulatorjs and playwright)
npx playwright install chromium
```

### Native Emulator
```bash
# Build bsnes for bsnes-gamer
cd bsnes-plus && make && cd ..
```

## Configuration

All servers are configured in `.mcp.json` at the repository root. Claude Code automatically loads this configuration.

## Documentation

- **General Guides**: `docs/guides/`
  - `emulatorjs-mcp-quick-start.md`
  - `playwright-mcp-integration.md`
  - `bsnes-headless-testing.md`

- **Server READMEs**: Each server directory contains detailed documentation

- **Project Overview**: See `CLAUDE.md` for build commands and architecture

## Resources

- **MCP Protocol**: https://modelcontextprotocol.io
- **Playwright**: https://playwright.dev
- **EmulatorJS**: https://emulatorjs.org
- **bsnes**: https://github.com/bsnes-emu/bsnes

## Next Steps

1. Explore individual server documentation in their respective directories
2. Review quick-start guides in `docs/guides/`
3. Try the example workflows above
4. Create custom workflows combining multiple servers
