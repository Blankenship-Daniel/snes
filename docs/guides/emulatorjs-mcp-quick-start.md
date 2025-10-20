# EmulatorJS MCP Server - Quick Start Guide

## Overview

The EmulatorJS MCP Server enables AI agents to play SNES games in a browser with full control and visual feedback. This guide will help you get started with browser-based emulation for AI playtesting.

## Installation

```bash
# Navigate to the emulatorjs-mcp-server directory
cd emulatorjs-mcp-server

# Install dependencies
npm install

# Setup (creates directories, EmulatorJS loads from CDN)
npm run setup

# Build the MCP server
npm run build

# Install Playwright browsers (required)
npx playwright install chromium
```

## Quick Test

Use the MCP server via Claude Code or any MCP client:

```typescript
// 1. Start the emulator with your ROM
await use_mcp_tool("emulatorjs", "start_emulator", {
  rom_path: "./zelda3.smc"
});

// 2. Wait for the game to load (about 3 seconds)
await use_mcp_tool("emulatorjs", "run_frames", {
  frames: 180
});

// 3. Take a screenshot to see what's happening
await use_mcp_tool("emulatorjs", "take_screenshot", {
  filepath: "./output/test.png"
});

// 4. Press Start to begin
await use_mcp_tool("emulatorjs", "press_button", {
  button: "Start",
  frames: 10
});

// 5. Play for a bit
await use_mcp_tool("emulatorjs", "run_frames", {
  frames: 300
});

// 6. Get game state
await use_mcp_tool("emulatorjs", "get_game_state", {});

// 7. Stop when done
await use_mcp_tool("emulatorjs", "stop_emulator", {});
```

## AI Playtesting Workflow

### Scenario 1: Validate Infinite Magic Mod

```typescript
// Load modded ROM
await use_mcp_tool("emulatorjs", "start_emulator", {
  rom_path: "./zelda3-infinite-magic-20251018.smc"
});

// Skip through intro
await use_mcp_tool("emulatorjs", "press_button", {
  button: "Start",
  frames: 15
});

await use_mcp_tool("emulatorjs", "run_frames", {
  frames: 600  // 10 seconds
});

// Screenshot the title screen
await use_mcp_tool("emulatorjs", "take_screenshot", {
  filepath: "./validation/title-screen.png"
});

// Navigate to new game
await use_mcp_tool("emulatorjs", "press_button", {
  button: "Down",
  frames: 5
});

await use_mcp_tool("emulatorjs", "press_button", {
  button: "A",
  frames: 10
});

// Play through until magic is available
// (AI would analyze screenshots to determine progress)
for (let i = 0; i < 20; i++) {
  await use_mcp_tool("emulatorjs", "run_frames", {
    frames: 60
  });

  await use_mcp_tool("emulatorjs", "take_screenshot", {
    filepath: `./validation/progress-${i}.png`
  });

  // AI analyzes screenshot here to decide next action
}

// Read magic value from memory
await use_mcp_tool("emulatorjs", "read_memory", {
  address: "0x7EF36E",
  size: 1
});

// Cleanup
await use_mcp_tool("emulatorjs", "stop_emulator", {});
```

### Scenario 2: Visual Regression Testing

```typescript
// Test baseline ROM
await use_mcp_tool("emulatorjs", "start_emulator", {
  rom_path: "./zelda3-v1.smc"
});

await use_mcp_tool("emulatorjs", "run_frames", {
  frames: 300
});

await use_mcp_tool("emulatorjs", "take_screenshot", {
  filepath: "./regression/baseline.png"
});

await use_mcp_tool("emulatorjs", "stop_emulator", {});

// Test modified ROM
await use_mcp_tool("emulatorjs", "start_emulator", {
  rom_path: "./zelda3-v2.smc"
});

await use_mcp_tool("emulatorjs", "run_frames", {
  frames: 300
});

await use_mcp_tool("emulatorjs", "take_screenshot", {
  filepath: "./regression/modified.png"
});

await use_mcp_tool("emulatorjs", "stop_emulator", {});

// AI would compare baseline.png and modified.png
```

### Scenario 3: Automated Playthrough with Save States

```typescript
// Start game
await use_mcp_tool("emulatorjs", "start_emulator", {
  rom_path: "./zelda3.smc"
});

// Play to checkpoint
await use_mcp_tool("emulatorjs", "press_button", {
  button: "Start"
});

await use_mcp_tool("emulatorjs", "run_frames", {
  frames: 1800  // 30 seconds
});

// Save state at checkpoint
await use_mcp_tool("emulatorjs", "save_state", {});

await use_mcp_tool("emulatorjs", "take_screenshot", {
  filepath: "./checkpoints/checkpoint-1.png"
});

// Try different paths from this point
// Path A
await use_mcp_tool("emulatorjs", "press_button", {
  button: "Up"
});

await use_mcp_tool("emulatorjs", "run_frames", {
  frames: 300
});

await use_mcp_tool("emulatorjs", "take_screenshot", {
  filepath: "./paths/path-a.png"
});

// Load state to try different path
await use_mcp_tool("emulatorjs", "load_state", {});

// Path B
await use_mcp_tool("emulatorjs", "press_button", {
  button: "Down"
});

await use_mcp_tool("emulatorjs", "run_frames", {
  frames: 300
});

await use_mcp_tool("emulatorjs", "take_screenshot", {
  filepath: "./paths/path-b.png"
});

await use_mcp_tool("emulatorjs", "stop_emulator", {});
```

## Available Controls

All SNES controller buttons are available:

- **D-Pad**: Up, Down, Left, Right
- **Face Buttons**: A, B, X, Y
- **Shoulder Buttons**: L, R
- **System**: Start, Select

## Tips for AI Agents

1. **Wait for Loading**: Always wait 3-5 seconds (180-300 frames) after starting before interacting
2. **Take Regular Screenshots**: Screenshot every 5-10 seconds for visual progress tracking
3. **Use Save States**: Save before risky actions, load if needed
4. **Frame Timing**: 60 frames = 1 second of gameplay
5. **Button Hold**: Use `frames` parameter to hold buttons longer (useful for menus)
6. **Memory Reading**: Currently limited, use screenshots for state detection

## Troubleshooting

### Browser doesn't open
- Run `npx playwright install chromium`
- Check port 3000 is available: `lsof -i :3000`
- Kill any hanging processes: `killall node`

### ROM doesn't load
- Verify ROM path is absolute
- Check ROM is valid .smc or .sfc file
- Look at browser console (visible in non-headless mode)

### Screenshots are black
- Wait longer before taking screenshot (game may not be loaded)
- Check if EmulatorJS initialized: use `get_game_state`
- Try waiting 300+ frames after ROM load

### Performance issues
- Browser emulation is slightly slower than native
- Expect 50-60 fps normally
- Reduce screenshot frequency if needed
- Close other browser windows

## Comparison with bsnes-gamer

| Feature | EmulatorJS MCP | bsnes-gamer MCP |
|---------|----------------|-----------------|
| Platform | Browser | Native binary |
| Visual | Screenshots | Screenshots |
| Speed | Good (WASM) | Excellent (native) |
| Memory Access | Limited | Full WRAM |
| Setup | `npm install` | Requires build |
| Headless | Yes (Playwright) | Yes (bsnes-cli) |
| **Best For** | Visual testing | Memory analysis |

## Next Steps

- Read the full [README](../../emulatorjs-mcp-server/README.md)
- Review [test-manual.md](../../emulatorjs-mcp-server/test-manual.md) for detailed testing
- Integrate with your AI workflow
- Contribute memory address mappings for Zelda 3

## Resources

- EmulatorJS: https://emulatorjs.org
- Playwright: https://playwright.dev
- MCP Protocol: https://modelcontextprotocol.io
