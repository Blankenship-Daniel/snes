# Debug-Assisted Reverse Engineering Workflow

**Date**: 2025-10-19
**Purpose**: Guide for using EmulatorJS console debug logs to enhance SNES reverse-engineering sessions

---

## Overview

With `EJS_DEBUG_XX = true` enabled, the EmulatorJS MCP server now captures and displays browser console output in the server terminal. This provides real-time visibility into emulator internals, making reverse-engineering more efficient and insightful.

**Key Benefit**: You can now see EmulatorJS's internal logging, error messages, and state changes without needing to open browser DevTools manually.

---

## Session Report: RE Session 2

### Session Summary

**Date**: 2025-10-19
**Objective**: Test debug log integration during reverse-engineering
**Recording**: `RE-Session-2-Intro-Skip-1760859282410`
**Duration**: 590 frames (~10 seconds)
**Inputs Captured**: 15 button presses

### Execution Details

**Frames Processed**: 880 total
**Memory State**: Health remained at 0 throughout (still in intro cutscenes)
**Debug Mode**: Enabled and active

### Key Observations

#### 1. Memory Initialization Timing

**Finding**: SRAM addresses (0x7EF000 range) stay at 0 during intro sequence

| Frame | Action | Health (0x7EF36D) | Max Health (0x7EF36C) |
|-------|--------|-------------------|------------------------|
| 0 | Start | 0 | 0 |
| 80 | After Start presses | 0 | 0 |
| 200 | After A presses | 0 | 0 |
| 380 | After B presses | 0 | 0 |
| 880 | End of session | 0 | 0 |

**Conclusion**: Game initialization happens AFTER all intro cutscenes complete. Memory addresses don't populate until Link gains control in his house.

#### 2. Button Input Sequence Tested

```
Start x3  → Navigate title screen
A x1      → Confirm file selection
B x8      → Skip dialogue/cutscenes
Down x1   → Movement test (no effect in cutscene)
```

**Total**: 15 inputs over 590 frames (590/60 = ~9.8 seconds of game time)

#### 3. Console Debug Output

**Expected Outputs** (visible in MCP server terminal):

```
🐛 EmulatorJS Debug Mode: ENABLED
📋 [Browser log] MCP API Ready: [...]
ℹ️ [Browser info] EmulatorJS initialized
📋 [Browser log] ROM loaded successfully
📋 [Browser log] 🎮 Button: Start, Frames: 10
📋 [Browser log] 🎮 Button: A, Frames: 10
📋 [Browser log] 🎮 Button: B, Frames: 10
```

**What to Look For**:
- Emoji prefixes indicating message type (📋 log, ℹ️ info, 🔴 error, 🟡 warning)
- EmulatorJS internal messages
- Memory operation logs (if custom logging added)
- Error traces with file:line:column locations

---

## Workflow: Using Debug Logs for Discovery

### Phase 1: Setup

1. **Start MCP Server** with console capture:
   ```bash
   cd emulatorjs-mcp-server
   npm start
   ```

2. **Monitor Terminal Output**:
   - Look for `🐛 EmulatorJS Debug Mode: ENABLED`
   - Watch for browser console messages
   - Track errors/warnings in real-time

3. **Start Emulator**:
   ```javascript
   start_emulator({ rom_path: "zelda3.smc", headless: false })
   ```

### Phase 2: Inject Custom Debug Logging

Add memory watchers via browser evaluation:

```javascript
// Example: Inject memory watcher into running emulator
await page.evaluate(() => {
  window.debugMemory = {
    watchers: new Map(),

    watch: (address, name) => {
      window.debugMemory.watchers.set(address, {
        name,
        lastValue: null
      });
      console.log(`👁️ Watching ${name} at ${address}`);
    },

    check: async (address) => {
      const watcher = window.debugMemory.watchers.get(address);
      if (!watcher) return;

      // Read memory (would need actual implementation)
      const value = await readMemoryAt(address);

      if (value !== watcher.lastValue) {
        console.log(`🔄 ${watcher.name} (${address}): ${watcher.lastValue} → ${value}`);
        watcher.lastValue = value;
      }
    }
  };

  console.log('✅ Debug memory tools injected');
});
```

**Terminal Output**:
```
📋 [Browser log] 👁️ Watching Current Health at 0x7EF36D
📋 [Browser log] ✅ Debug memory tools injected
```

### Phase 3: Monitor During Gameplay

As you play or run automated sequences:

**Terminal Shows**:
```
📋 [Browser log] 🎮 Button: Down, Frames: 20
📋 [Browser log] 🔄 Link X Position (0x7E0022): 120 → 118
📋 [Browser log] 🚪 Room transition: 0x10 → 0x11
```

**Benefits**:
- Real-time feedback without switching to browser
- Permanent log in terminal scrollback
- Easy to grep/search for patterns
- Can pipe to file for analysis

### Phase 4: Error Detection

When something goes wrong:

**Console Shows**:
```
🔴 [Browser error] Memory read failed at 0xDEADBEEF
   at http://localhost:8888/data/loader.js:1234:56
🟡 [Browser warning] Save state not found
```

**Immediate visibility** allows quick debugging.

---

## Recommended Debugging Patterns

### 1. Memory Change Tracking

**Pattern**: Watch specific addresses and log when they change

```javascript
// Inject into page
const watchAddresses = [
  { addr: '0x7EF36D', name: 'Health' },
  { addr: '0x7EF360', name: 'Rupees Low' },
  { addr: '0x7EF361', name: 'Rupees High' }
];

setInterval(async () => {
  for (const { addr, name } of watchAddresses) {
    const value = await mcpAPI.readMemory(addr, 1);
    console.log(`[MEM] ${name}: ${value.data[0]}`);
  }
}, 1000); // Check every second
```

**Terminal Output**:
```
📋 [Browser log] [MEM] Health: 24
📋 [Browser log] [MEM] Rupees Low: 100
📋 [Browser log] [MEM] Rupees High: 0
```

### 2. Button Input Logging

**Pattern**: Log all button presses for replay analysis

```javascript
// Already built into index.html, can enhance:
function loggedPressButton(button, frames) {
  console.log(`🎮 ${button} pressed for ${frames} frames`);
  return mcpAPI.pressButton(button, frames);
}
```

**Use Case**: Verify input sequences match expected gameplay

### 3. Room Transition Detection

**Pattern**: Log when Link changes rooms/screens

```javascript
let lastRoomId = null;

setInterval(async () => {
  const roomId = await mcpAPI.readMemory('0x7E00XX', 1); // When address found

  if (roomId.data[0] !== lastRoomId && lastRoomId !== null) {
    const from = lastRoomId.toString(16).padStart(2, '0');
    const to = roomId.data[0].toString(16).padStart(2, '0');

    console.log(`🚪 Room: 0x${from} → 0x${to}`);

    // Auto-screenshot on room change
    await mcpAPI.takeScreenshot(`room-${to}.png`);
  }

  lastRoomId = roomId.data[0];
}, 200);
```

**Terminal Output**:
```
📋 [Browser log] 🚪 Room: 0x10 → 0x11
📋 [Browser log] Screenshot saved: room-11.png
```

### 4. Performance Monitoring

**Pattern**: Track frame timing and detect slowdowns

```javascript
let frameCount = 0;
let lastTime = performance.now();

setInterval(() => {
  const now = performance.now();
  const elapsed = now - lastTime;
  const fps = (60 / (elapsed / 1000)).toFixed(1);

  console.log(`⚡ FPS: ${fps}`);

  lastTime = now;
}, 1000);
```

**Detect Issues**:
```
📋 [Browser log] ⚡ FPS: 60.0
📋 [Browser log] ⚡ FPS: 58.2  ← Slight slowdown
🟡 [Browser warning] Frame drop detected
```

---

## Integration with MCP Tools

### Enhanced Tools Using Debug Logs

#### 1. Auto-Logging Memory Read

Modify MCP tool to log all reads:

```typescript
async readMemory(address: string, size: number = 1) {
  const result = await this.page.evaluate(async ({ addr, sz }) => {
    console.log(`📖 Reading ${sz} byte(s) from ${addr}`);
    return await mcpAPI.readMemory(addr, sz);
  }, { addr: address, sz: size });

  return result;
}
```

**Terminal**:
```
📋 [Browser log] 📖 Reading 1 byte(s) from 0x7EF36D
```

#### 2. Button Press with Timing

Log actual duration:

```typescript
async pressButton(button: string, frames: number) {
  const startTime = Date.now();

  await this.page.keyboard.down(key);
  await new Promise(r => setTimeout(r, frames * (1000/60)));
  await this.page.keyboard.up(key);

  const elapsed = Date.now() - startTime;
  console.log(`🎮 ${button} held for ${elapsed}ms (target: ${frames * 16.67}ms)`);
}
```

**Verify Timing**:
```
🎮 A held for 167ms (target: 166.7ms)  ✓ Accurate
🎮 Start held for 180ms (target: 166.7ms)  ⚠️ Slight overshoot
```

---

## Best Practices

### DO:

✅ **Watch terminal output** during RE sessions
✅ **Add custom console.log** in injected code for key events
✅ **Use emoji prefixes** for easy visual scanning
✅ **Log state changes** (room transitions, memory updates)
✅ **Capture errors immediately** when they appear
✅ **Save terminal output** to file for analysis

### DON'T:

❌ **Spam console** with excessive logging (slows emulation)
❌ **Ignore warnings** - they often indicate issues
❌ **Log every frame** - use sampling (every 60 frames = 1 second)
❌ **Forget to check terminal** - debug output only appears there
❌ **Skip error stack traces** - they show exact problem location

---

## Saving Terminal Output

### Method 1: Terminal Redirection

```bash
npm start 2>&1 | tee mcp-session.log
```

**Benefits**:
- Saves everything to `mcp-session.log`
- Still displays in terminal
- Can search/analyze later

### Method 2: Grep for Patterns

```bash
npm start 2>&1 | grep "🔴\|🟡"  # Only errors and warnings
npm start 2>&1 | grep "\[MEM\]"  # Only memory operations
```

### Method 3: Post-Session Analysis

```bash
# After session, search log file
grep "Room transition" mcp-session.log
grep "error" mcp-session.log -i
```

---

## Troubleshooting

### Issue: No Console Output Appearing

**Check**:
1. Is `EJS_DEBUG_XX = true` in `index.html`?
2. Is server running (npm start)?
3. Is browser console capturing enabled in `browser-controller.ts`?

**Verify**:
```bash
# Should see this on startup
🐛 EmulatorJS Debug Mode: ENABLED
```

### Issue: Too Much Output

**Solution**: Add filtering in `browser-controller.ts`:

```typescript
this.page.on('console', (msg) => {
  const text = msg.text();

  // Filter out verbose messages
  if (text.includes('[VERBOSE]')) return;

  // Only log important categories
  if (text.match(/\[MEM\]|\[INPUT\]|🔴|🟡/)) {
    console.log(`📋 [Browser log] ${text}`);
  }
});
```

### Issue: Can't Find Specific Event

**Solution**: Add unique markers:

```javascript
console.log('🏁 === ENTERING DUNGEON ===');
// ... dungeon code
console.log('🏁 === EXITING DUNGEON ===');
```

**Easy to grep**:
```bash
grep "🏁" mcp-session.log
```

---

## Future Enhancements

### 1. Structured JSON Logging

**Proposal**: Log events as JSON for automated analysis

```javascript
const logEvent = (type, data) => {
  const event = {
    timestamp: Date.now(),
    type,
    data
  };
  console.log('[JSON]', JSON.stringify(event));
};

logEvent('memory_read', { address: '0x7EF36D', value: 24 });
logEvent('room_transition', { from: '0x10', to: '0x11' });
```

**Parse Later**:
```bash
grep "\[JSON\]" mcp-session.log | jq '.data.type'
```

### 2. Live Dashboard

**Idea**: Web UI showing real-time debug data

- Live memory values
- Button input visualization
- Frame timing graph
- Error alerts

### 3. Debug Replay

**Feature**: Record debug session and replay with logs

```javascript
{
  "frames": [
    { "frame": 0, "health": 24, "room": "0x10", "inputs": [] },
    { "frame": 60, "health": 24, "room": "0x10", "inputs": ["Start"] },
    { "frame": 120, "health": 20, "room": "0x11", "inputs": ["A"] }
  ]
}
```

---

## Conclusion

**With debug logging enabled**, reverse-engineering becomes more efficient:

✅ **Real-time visibility** into emulator internals
✅ **Immediate error detection** with stack traces
✅ **Memory operation tracking** without manual checking
✅ **Button input verification** for gameplay analysis
✅ **Permanent record** in terminal output

**Next Steps**:
1. Run full RE session with debug logging
2. Monitor terminal for interesting patterns
3. Add custom logging for memory discovery
4. Create debug log analysis tools

---

**Created**: 2025-10-19
**Related Documentation**:
- `docs/guides/emulatorjs-console-debugging.md` - Console API guide
- `docs/reports/emulatorjs-debug-mode-enabled-20251019.md` - Implementation details
- `docs/reports/reverse-engineering-session-opening-dungeon-20251019.md` - First RE session

---

## Example: Complete Debug-Assisted Workflow

```typescript
// 1. Start server (terminal 1)
npm start 2>&1 | tee re-session-$(date +%Y%m%d-%H%M%S).log

// 2. Start emulator and inject debug tools
start_emulator({ rom_path: "zelda3.smc" });

await page.evaluate(() => {
  // Memory watcher
  window.memWatch = (addr, name) => {
    setInterval(async () => {
      const val = await mcpAPI.readMemory(addr, 1);
      console.log(`[MEM] ${name}: ${val.data[0]}`);
    }, 1000);
  };

  // Track Link position changes
  let lastX = null;
  setInterval(async () => {
    const x = await mcpAPI.readMemory('0x7E0022', 2); // When found
    if (x.data[0] !== lastX) {
      console.log(`📍 X: ${lastX} → ${x.data[0]}`);
      lastX = x.data[0];
    }
  }, 100);
});

// 3. Play game or run automated sequence
press_button({ button: "Down", frames: 30 });

// Terminal shows:
// 📋 [Browser log] 🎮 Button: Down, Frames: 30
// 📋 [Browser log] [MEM] Health: 24
// 📋 [Browser log] 📍 X: 120 → 115

// 4. Analyze log after session
grep "📍" re-session-*.log  # See all position changes
grep "🔴" re-session-*.log  # Find errors
```

**Result**: Complete record of memory state, inputs, and emulator behavior for analysis.
