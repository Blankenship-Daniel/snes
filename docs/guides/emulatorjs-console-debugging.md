# EmulatorJS Console Debugging Guide

**Date**: 2025-10-19
**Purpose**: Enable detailed debug output to Chrome console for memory address tracking and emulator internals

---

## Overview

EmulatorJS provides a built-in debug mode that enables console logging and loads non-minified source files for easier debugging. This is particularly useful for:

- Tracking memory address reads/writes
- Monitoring emulator state changes
- Debugging input handling
- Analyzing performance issues
- Understanding internal emulator behavior

---

## Enabling Debug Mode

### Basic Configuration

To enable EmulatorJS debug mode, set the `EJS_DEBUG_XX` flag **before** loading the emulator:

```javascript
// Enable debug mode
EJS_DEBUG_XX = true;

// Then configure and start emulator
EJS_player = '#game';
EJS_gameUrl = 'zelda3.smc';
EJS_core = 'snes';
```

**What this enables**:
- ✅ Console logging of emulator events
- ✅ Non-minified source files (easier to read)
- ✅ Detailed error messages
- ✅ Internal state tracking

---

## Accessing Debug Information

### 1. Chrome Developer Console

**Open DevTools**:
- **Windows/Linux**: `F12` or `Ctrl + Shift + I`
- **macOS**: `Cmd + Option + I`

**Navigate to Console Tab**:
- View all `console.log()`, `console.warn()`, `console.error()` output
- See real-time emulator events
- Monitor memory operations
- Track input events

### 2. Custom Logging Integration

You can add custom logging to track specific operations:

```javascript
// Example: Log memory reads
window.addEventListener('load', () => {
  // Hook into EmulatorJS after it loads
  const originalFetch = window.fetch;

  window.fetch = function(...args) {
    console.log('EmulatorJS fetch:', args);
    return originalFetch.apply(this, args);
  };
});
```

### 3. Monitoring Memory Operations

**Using Performance API** (works with EmulatorJS):

```javascript
// Monitor memory usage over time
setInterval(() => {
  if (performance.memory) {
    console.log('Memory Stats:', {
      usedJSHeap: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      totalJSHeap: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      heapLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
    });
  }
}, 5000); // Every 5 seconds
```

### 4. Tracking Emulator State

**Add event listeners for emulator events**:

```javascript
// Log emulator loading progress
console.log('EmulatorJS Debug Mode: ENABLED');

// Monitor when ROM is loaded
document.addEventListener('EJS-loaded', () => {
  console.log('ROM loaded successfully');
});

// Monitor when emulator starts
document.addEventListener('EJS-started', () => {
  console.log('Emulator started');
});
```

---

## Advanced Debugging Techniques

### 1. Memory Address Watching

**Create a memory watcher** that logs when specific addresses change:

```javascript
class MemoryWatcher {
  constructor() {
    this.watchedAddresses = new Map();
    this.lastValues = new Map();
  }

  watch(address, name) {
    this.watchedAddresses.set(address, name);
    console.log(`👁️ Watching ${name} at ${address}`);
  }

  async checkAll() {
    for (const [address, name] of this.watchedAddresses) {
      // Read memory via EmulatorJS MCP
      const value = await readMemory(address);
      const lastValue = this.lastValues.get(address);

      if (value !== lastValue) {
        console.log(`🔄 ${name} (${address}): ${lastValue} → ${value}`);
        this.lastValues.set(address, value);
      }
    }
  }
}

// Usage
const watcher = new MemoryWatcher();
watcher.watch('0x7EF36D', 'Current Health');
watcher.watch('0x7EF360', 'Rupees (Low Byte)');

// Check every frame (60fps = ~16ms)
setInterval(() => watcher.checkAll(), 16);
```

### 2. Button Input Logging

**Track all button presses** in the console:

```javascript
// Override or wrap button press function
const originalPressButton = window.pressButton;

window.pressButton = function(button, frames) {
  console.log(`🎮 Button: ${button}, Held: ${frames} frames`);
  return originalPressButton.call(this, button, frames);
};
```

### 3. Screenshot Automation

**Auto-capture screenshots** on specific events:

```javascript
let screenshotCount = 0;

// Capture screenshot on room change
function autoScreenshot() {
  const canvas = document.querySelector('#game canvas');
  if (canvas) {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      console.log(`📸 Screenshot ${screenshotCount++}:`, url);

      // Optional: Download automatically
      const a = document.createElement('a');
      a.href = url;
      a.download = `screenshot-${screenshotCount}.png`;
      a.click();
    });
  }
}

// Trigger on specific memory change (e.g., room ID)
// Call autoScreenshot() when room changes
```

### 4. Performance Profiling

**Measure frame timing** and detect slowdowns:

```javascript
let lastFrameTime = performance.now();
let frameCount = 0;

function measureFrameRate() {
  const now = performance.now();
  const delta = now - lastFrameTime;
  frameCount++;

  if (frameCount % 60 === 0) { // Log every 60 frames
    const fps = 1000 / (delta / 60);
    console.log(`⚡ FPS: ${fps.toFixed(2)}`);
  }

  lastFrameTime = now;
  requestAnimationFrame(measureFrameRate);
}

measureFrameRate();
```

---

## Console Debugging Commands

### Useful Browser Console Commands

**1. Clear console**:
```javascript
console.clear();
```

**2. Group related logs**:
```javascript
console.group('Memory Reads');
console.log('Health:', 24);
console.log('Rupees:', 100);
console.groupEnd();
```

**3. Table formatting** (great for memory maps):
```javascript
const memoryMap = [
  { address: '0x7EF36D', name: 'Current Health', value: 24 },
  { address: '0x7EF360', name: 'Rupees Low', value: 100 },
  { address: '0x7EF361', name: 'Rupees High', value: 0 }
];

console.table(memoryMap);
```

**4. Time operations**:
```javascript
console.time('loadROM');
// ... load ROM ...
console.timeEnd('loadROM'); // Outputs: loadROM: 1234.56ms
```

**5. Stack traces**:
```javascript
function memoryRead(address) {
  console.trace('Memory read from', address);
  // ... actual read operation
}
```

### 6. Conditional logging

```javascript
const DEBUG = true;

function debugLog(category, ...args) {
  if (DEBUG) {
    console.log(`[${category}]`, ...args);
  }
}

debugLog('MEMORY', 'Read from 0x7EF36D:', 24);
debugLog('INPUT', 'Button A pressed');
```

---

## Integration with EmulatorJS MCP Server

### Our Current Setup

The **emulatorjs-mcp-server** project already integrates with Playwright, which provides additional debugging capabilities:

```typescript
// From emulatorjs-mcp-server/src/emulator.ts
async evaluateInBrowser(script: string): Promise<any> {
  if (!this.page) throw new Error('Emulator not started');

  // This allows us to inject debugging code
  return await this.page.evaluate(script);
}
```

**Example: Inject memory watcher**:

```typescript
await emulator.evaluateInBrowser(`
  console.log('🔧 Injecting memory debug tools...');

  window.memoryDebug = {
    lastReads: [],
    logRead: (address, value) => {
      console.log(\`📖 Read 0x\${address}: \${value}\`);
      window.memoryDebug.lastReads.push({ address, value, timestamp: Date.now() });
    }
  };

  console.log('✅ Memory debug tools ready');
`);
```

### Enhanced MCP Tools

We can **extend the MCP server** to enable console debugging:

```typescript
// New MCP tool: enable_debug_mode
{
  name: "enable_debug_mode",
  description: "Enable EmulatorJS debug mode with console logging",
  handler: async () => {
    await page.evaluate(() => {
      window.EJS_DEBUG_XX = true;
      console.log('🐛 EmulatorJS Debug Mode: ENABLED');
    });

    // Also enable Playwright console capturing
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[Browser ${type}]`, text);
    });

    return { success: true, message: "Debug mode enabled" };
  }
}
```

### Capturing Console Output

**Playwright automatically captures console**:

```typescript
// In emulatorjs-mcp-server/src/emulator.ts
this.page.on('console', async (msg) => {
  const type = msg.type();
  const text = msg.text();
  const location = msg.location();

  // Log to server console with formatting
  console.log(`[Browser ${type}] ${text}`);

  // Optionally save to file for analysis
  if (type === 'error' || type === 'warning') {
    fs.appendFileSync('browser-errors.log',
      `[${new Date().toISOString()}] ${type}: ${text}\n`
    );
  }
});
```

---

## Best Practices

### 1. Structured Logging

Use consistent prefixes for easy filtering:

```javascript
// Memory operations
console.log('[MEM] Read from 0x7EF36D: 24');

// Input events
console.log('[INPUT] Button A pressed, held 10 frames');

// Game state
console.log('[STATE] Room changed: 0x10 → 0x11');

// Errors
console.error('[ERROR] Failed to read memory at 0xDEADBEEF');
```

**Filter in Chrome DevTools**:
- Click the filter icon
- Enter: `[MEM]` to see only memory logs
- Enter: `-[INPUT]` to hide input logs

### 2. Log Levels

Implement severity levels:

```javascript
const LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

let currentLogLevel = LogLevel.DEBUG;

function log(level, category, ...args) {
  if (level <= currentLogLevel) {
    const prefix = `[${Object.keys(LogLevel)[level]}][${category}]`;
    console.log(prefix, ...args);
  }
}

// Usage
log(LogLevel.INFO, 'MEMORY', 'Health initialized to 24');
log(LogLevel.DEBUG, 'INPUT', 'Processing button queue');
log(LogLevel.TRACE, 'FRAME', 'Frame 12345 rendered');
```

### 3. Persistent Logging

Save logs to file for later analysis:

```javascript
class FileLogger {
  constructor(filename) {
    this.filename = filename;
    this.logs = [];
  }

  log(category, message) {
    const entry = {
      timestamp: Date.now(),
      category,
      message
    };

    this.logs.push(entry);
    console.log(`[${category}]`, message);
  }

  download() {
    const blob = new Blob([JSON.stringify(this.logs, null, 2)],
      { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = this.filename;
    a.click();
  }
}

// Usage
const logger = new FileLogger('zelda3-debug.json');
logger.log('MEMORY', 'Health: 24');
logger.log('STATE', 'Entered castle');

// When done, download logs
logger.download();
```

---

## Common Use Cases

### Use Case 1: Track Health Changes

```javascript
let lastHealth = null;

async function monitorHealth() {
  const health = await readMemoryNamed('Current Health');

  if (health !== lastHealth && lastHealth !== null) {
    console.log(`❤️ Health: ${lastHealth} → ${health} (Δ ${health - lastHealth})`);
  }

  lastHealth = health;
}

setInterval(monitorHealth, 100); // Check every 100ms
```

### Use Case 2: Map Room Transitions

```javascript
let lastRoom = null;
const roomHistory = [];

async function trackRoomChanges() {
  const room = await readMemoryNamed('Screen ID'); // When implemented

  if (room !== lastRoom && lastRoom !== null) {
    const transition = { from: lastRoom, to: room, time: Date.now() };
    roomHistory.push(transition);

    console.log(`🚪 Room: 0x${lastRoom.toString(16)} → 0x${room.toString(16)}`);
    console.table(roomHistory.slice(-5)); // Last 5 transitions
  }

  lastRoom = room;
}

setInterval(trackRoomChanges, 200);
```

### Use Case 3: Debug Memory Discovery

```javascript
// Scan a memory range and log changes
async function scanMemoryRange(startAddr, endAddr) {
  const baseline = new Map();

  // Capture baseline
  for (let addr = startAddr; addr < endAddr; addr++) {
    const value = await readMemory(addr);
    baseline.set(addr, value);
  }

  console.log(`📊 Baseline captured: 0x${startAddr.toString(16)} to 0x${endAddr.toString(16)}`);

  // Monitor for changes
  setInterval(async () => {
    for (let addr = startAddr; addr < endAddr; addr++) {
      const value = await readMemory(addr);
      const oldValue = baseline.get(addr);

      if (value !== oldValue) {
        console.log(`🔍 Change at 0x${addr.toString(16)}: ${oldValue} → ${value}`);
      }
    }
  }, 1000);
}

// Example: Scan SRAM range
scanMemoryRange(0x7EF000, 0x7EF100);
```

---

## Troubleshooting

### Console Not Showing Logs

**Issue**: `EJS_DEBUG_XX = true` but no logs appear

**Solutions**:
1. Make sure it's set BEFORE loading EmulatorJS:
   ```html
   <script>
     window.EJS_DEBUG_XX = true; // Must be first
   </script>
   <script src="loader.js"></script>
   ```

2. Check console filter settings (ensure not filtering out logs)

3. Verify EmulatorJS version supports debug mode (4.0+)

### Performance Impact

**Issue**: Debug logging slows down emulation

**Solutions**:
1. Use conditional logging (only log specific events)
2. Reduce logging frequency (sample instead of continuous)
3. Disable debug mode in production
4. Use log levels to control verbosity

### Memory Leaks from Logging

**Issue**: Console fills up with thousands of logs

**Solutions**:
1. Implement log rotation:
   ```javascript
   const MAX_LOGS = 1000;
   const logs = [];

   function addLog(msg) {
     logs.push(msg);
     if (logs.length > MAX_LOGS) {
       logs.shift(); // Remove oldest
     }
     console.log(msg);
   }
   ```

2. Use `console.clear()` periodically
3. Disable auto-scroll in DevTools

---

## Summary

**Key Takeaways**:

✅ **Enable debug mode**: Set `EJS_DEBUG_XX = true` before loading EmulatorJS
✅ **Chrome DevTools**: Your main debugging interface (F12)
✅ **Custom logging**: Add memory watchers, input trackers, state monitors
✅ **Structured logs**: Use prefixes like `[MEM]`, `[INPUT]` for easy filtering
✅ **Performance monitoring**: Track FPS, memory usage, frame timing
✅ **Integration**: Our MCP server can inject debugging code via Playwright

**Next Steps**:
1. Enable `EJS_DEBUG_XX` in emulatorjs-mcp-server
2. Add console capture to MCP tools
3. Create memory watcher tool
4. Build automated debug log analysis

---

## References

- **EmulatorJS Docs**: https://emulatorjs.org/docs4devs
- **Chrome DevTools**: https://developer.chrome.com/docs/devtools/
- **Console API**: https://developer.mozilla.org/en-US/docs/Web/API/Console
- **Performance API**: https://developer.mozilla.org/en-US/docs/Web/API/Performance
- **Playwright Console Events**: https://playwright.dev/docs/api/class-page#page-event-console

---

**Created**: 2025-10-19
**Last Updated**: 2025-10-19
**Related**: `docs/reports/reverse-engineering-session-opening-dungeon-20251019.md`
