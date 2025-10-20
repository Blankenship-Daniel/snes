# Human Gameplay Recording for EmulatorJS MCP Server

## Overview

The Human Gameplay Recording feature allows you to record your own gameplay inputs in real-time while playing through a ROM in the browser. This is incredibly valuable for teaching AI agents optimal routes, strategies, and demonstrating complex sequences that are difficult to program.

## Features

- **Keyboard Input Capture**: Automatically captures all keyboard inputs (A, B, X, Y, L, R, Start, Select, D-pad)
- **Frame-Perfect Timing**: Records exact frame counts for each button press and release
- **Hold Duration Tracking**: Tracks how long each button is held
- **Memory Snapshots**: Captures game memory state at configurable intervals
- **Event Tracking**: Records significant game events (room changes, item acquisitions, etc.)
- **Metadata Rich**: Stores tags, notes, and success status for each recording

## MCP Tools

### `start_human_recording`

Start recording your keyboard inputs while you play.

**Parameters:**
```typescript
{
  name: string,              // "tutorial-walkthrough", "boss-fight-strategy"
  description: string,       // What you're demonstrating
  captureInterval?: number,  // Memory snapshot interval (default: 60 frames)
  autoScreenshot?: boolean   // Auto-screenshot on room changes (default: true)
}
```

**Example:**
```typescript
await mcp.start_human_recording({
  name: "links-house-to-castle",
  description: "Optimal route from Link's house to Hyrule Castle entrance",
  captureInterval: 30,  // Capture memory every 30 frames (0.5 seconds)
  autoScreenshot: true
});
```

### `stop_human_recording`

Stop the current recording and save it.

**Parameters:**
```typescript
{
  success: boolean,    // Did you accomplish the goal?
  notes?: string[],    // Optional notes about the recording
  tags?: string[]      // Tags for categorization
}
```

**Example:**
```typescript
await mcp.stop_human_recording({
  success: true,
  notes: ["Avoided all enemies", "Got the chest in second room"],
  tags: ["tutorial", "navigation", "overworld"]
});
```

### `get_human_recording_status`

Check if a recording is currently in progress.

**Returns:**
```typescript
{
  isRecording: boolean,
  currentRecording?: {
    name: string,
    startFrame: number,
    inputCount: number,
    snapshotCount: number,
    duration: number  // milliseconds
  }
}
```

### `list_human_recordings`

List all your saved human recordings.

**Parameters:**
```typescript
{
  tag?: string  // Optional: filter by tag
}
```

**Returns:**
```typescript
{
  success: true,
  count: number,
  recordings: [
    {
      id: string,
      name: string,
      success: boolean,
      duration: number,      // frames
      inputCount: number,
      timestamp: number
    }
  ]
}
```

## Workflow Example

### Recording a Tutorial Section

```typescript
// 1. Start the emulator
await mcp.start_emulator({
  rom_path: "/path/to/zelda3.smc",
  headless: false
});

// 2. Navigate to your starting point (e.g., using AI or manually)
// ... get to Link's house...

// 3. Start recording
await mcp.start_human_recording({
  name: "get-lamp-from-chest",
  description: "Demonstrate getting the lamp from the chest in Link's house",
  captureInterval: 60
});

// 4. NOW PLAY THE GAME!
// - Use arrow keys to move Link
// - Press X for A button, Z for B button
// - The system automatically captures all your inputs

// 5. When done, stop recording
await mcp.stop_human_recording({
  success: true,
  notes: ["Walked straight to chest", "Opened chest", "Got lamp"],
  tags: ["tutorial", "item-collection", "lamp"]
});

// 6. List your recordings
const recordings = await mcp.list_human_recordings();
console.log(`You have ${recordings.count} recordings`);
```

## Recording Format

Each recording is saved as a JSON file in `recordings/zelda3/human/`:

```json
{
  "id": "get-lamp-1760855000000",
  "name": "get-lamp-from-chest",
  "description": "Demonstrate getting the lamp from the chest",
  "recordingType": "human",
  "startFrame": 1500,
  "endFrame": 1800,
  "duration": 300,
  "startTime": 1760855000000,
  "endTime": 1760855005000,
  "inputs": [
    {
      "frame": 0,
      "timestamp": 1760855000000,
      "key": "ArrowUp",
      "button": "Up",
      "action": "press"
    },
    {
      "frame": 45,
      "timestamp": 1760855000750,
      "key": "ArrowUp",
      "button": "Up",
      "action": "release",
      "heldDuration": 45
    },
    {
      "frame": 50,
      "timestamp": 1760855000833,
      "key": "x",
      "button": "A",
      "action": "press"
    }
  ],
  "snapshots": [
    {
      "frame": 60,
      "timestamp": 1760855001000,
      "memory": {
        "health": 24,
        "maxHealth": 24,
        "rupees": 0
      },
      "position": { "x": 120, "y": 95 }
    }
  ],
  "events": [],
  "metadata": {
    "success": true,
    "notes": ["Walked straight to chest", "Opened chest", "Got lamp"],
    "tags": ["tutorial", "item-collection", "lamp"],
    "captureInterval": 60,
    "totalInputs": 15,
    "roomsVisited": ["0x0104"]
  }
}
```

## Keyboard Mapping

The emulator uses EmulatorJS default keyboard mapping:

| SNES Button | Keyboard Key |
|-------------|--------------|
| A | X |
| B | Z |
| X | S |
| Y | A |
| L | Q |
| R | W |
| Start | Enter |
| Select | Shift |
| D-Pad | Arrow Keys |

## Use Cases

### 1. Teaching AI Agents

Record yourself playing through difficult sections, then use the recordings as training data for AI agents.

```typescript
// Record multiple attempts
await mcp.start_human_recording({
  name: "eastern-palace-boss-attempt-1",
  description: "First attempt at defeating Armos Knights"
});
// ... play ...
await mcp.stop_human_recording({ success: false });

// Try again
await mcp.start_human_recording({
  name: "eastern-palace-boss-attempt-2",
  description: "Second attempt with better strategy"
});
// ... play ...
await mcp.stop_human_recording({ success: true });

// AI can now learn from your successful attempt
```

### 2. Creating Gameplay Templates

Record optimal routes that AI agents can replay:

```typescript
await mcp.start_human_recording({
  name: "speedrun-intro-section",
  description: "Fastest route through intro (sub-2 minutes)",
  captureInterval: 30
});
```

### 3. Debugging AI Behavior

Compare human gameplay with AI gameplay to identify where the AI struggles:

```typescript
// Record human playthrough
const humanRecording = await mcp.start_human_recording({
  name: "navigate-lost-woods",
  description: "Human navigation through Lost Woods"
});
// ... play ...
await mcp.stop_human_recording({ success: true });

// Later, compare with AI recording to see differences
```

## Advanced Features

### Memory Snapshot Analysis

The `captureInterval` parameter controls how often memory is sampled:

```typescript
await mcp.start_human_recording({
  name: "health-management",
  description: "Demonstrate careful health management in dungeon",
  captureInterval: 15  // Capture every 15 frames (4x per second)
});
```

This allows you to correlate player actions with game state changes.

### Event-Driven Captures

The system can auto-capture on significant events:

- Room/screen transitions
- Health changes
- Item acquisitions
- Enemy defeats

Set `autoScreenshot: true` to enable automatic screenshots at these moments.

## Replay and Analysis

While playback functionality isn't implemented yet, the recorded data contains everything needed to:

1. **Replay the input sequence**: The frame-perfect inputs can be fed back into the emulator
2. **Analyze timing**: See exactly when buttons were pressed relative to game events
3. **Study patterns**: Identify common sequences (e.g., "always press Up+A when entering this room")
4. **Build AI strategies**: Use successful recordings as templates for AI behavior

## Limitations

- Currently records keyboard input only (no gamepad support yet)
- Memory snapshots are periodic, not event-triggered (except for auto-screenshot events)
- No built-in playback feature (recordings must be manually replayed using AI tools)
- Screenshots are placeholder (full implementation pending)

## Future Enhancements

- [ ] Gamepad/controller support
- [ ] Real-time playback of recorded sessions
- [ ] Visual timeline editor for recordings
- [ ] Automatic strategy extraction from recordings
- [ ] Recording diff comparison tool
- [ ] Export to TAS (Tool-Assisted Speedrun) format

## Troubleshooting

### Recording doesn't capture inputs

**Solution**: Make sure the browser window has focus. Click the emulator canvas before starting recording.

### Memory snapshots are empty

**Solution**: Ensure the emulator is fully loaded and running before starting the recording.

### Recording file not saved

**Solution**: Check that the `recordings/zelda3/human/` directory exists and has write permissions.

## Example: Complete Recording Session

```typescript
// Full example: Record getting through Link's house tutorial
async function recordTutorialSection() {
  // 1. Start emulator
  console.log("Starting emulator...");
  await mcp.start_emulator({
    rom_path: "./zelda3.smc",
    headless: false
  });

  // 2. Wait for intro to finish (or skip manually)
  console.log("Navigate to Link's house in the browser...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 3. Start recording
  console.log("Starting recording - PLAY NOW!");
  await mcp.start_human_recording({
    name: "tutorial-link-house",
    description: "Complete Link's house tutorial sequence",
    captureInterval: 30,
    autoScreenshot: true
  });

  // 4. Human plays (wait for them to finish)
  console.log("Recording... Press any key when done.");
  await waitForKeypress();

  // 5. Stop recording
  const result = await mcp.stop_human_recording({
    success: true,
    notes: ["Got lamp", "Talked to uncle", "Exited house"],
    tags: ["tutorial", "intro"]
  });

  console.log("Recording saved:", result.recording.id);
  console.log("Total inputs:", result.recording.inputs.length);
  console.log("Duration:", result.recording.duration, "frames");
}
```

## Summary

The Human Gameplay Recording feature bridges the gap between human expertise and AI learning. By recording your own gameplay, you can:

- Create high-quality training data for AI agents
- Demonstrate complex strategies that are hard to program
- Build a library of proven routes and techniques
- Debug AI behavior by comparing with human play
- Preserve optimal strategies for future reference

Start recording your Zelda 3 expertise today!
