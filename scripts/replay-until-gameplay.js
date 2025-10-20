#!/usr/bin/env node

/**
 * Replay human recording until gameplay starts (health != 0)
 * Then create a save state for future AI sessions
 */

const fs = require('fs');
const path = require('path');

// Read the human recording
const recordingPath = process.argv[2] || 'recordings/zelda3/human/Opening Dungeon Sequence-1760857246160.json';
const recording = JSON.parse(fs.readFileSync(recordingPath, 'utf8'));

console.log(`📼 Loaded recording: ${recording.name}`);
console.log(`📊 Total inputs: ${recording.inputs.length}`);

// Group press/release pairs into button holds
const buttonHolds = [];
const pressMap = new Map();

for (const input of recording.inputs) {
  if (input.action === 'press') {
    pressMap.set(input.button, input);
  } else if (input.action === 'release') {
    const press = pressMap.get(input.button);
    if (press) {
      const duration = input.timestamp - press.timestamp;
      const frames = Math.max(1, Math.round(duration / 16.67)); // 60 FPS = 16.67ms per frame

      buttonHolds.push({
        button: input.button,
        frames,
        timestamp: press.timestamp
      });

      pressMap.delete(input.button);
    }
  }
}

console.log(`🎮 Converted to ${buttonHolds.length} button holds`);

// Output as JSON for MCP replay
console.log('\n📝 Button hold sequence:');
console.log(JSON.stringify(buttonHolds.slice(0, 20), null, 2));

console.log(`\n💡 Total button holds to replay: ${buttonHolds.length}`);
console.log(`\n✅ Run this with MCP tools, checking health every ~50 inputs`);
