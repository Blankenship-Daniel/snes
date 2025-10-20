#!/usr/bin/env node
/*
  Autoplay Zelda 3 via EmulatorJS MCP server.
  - Starts server on a safe port
  - Uses system Chrome in headless mode (no Playwright download)
  - Attempts to advance past title and into play, taking screenshots
*/
const fs = require('fs');
const path = require('path');
const { Client } = require('../emulatorjs-mcp-server/node_modules/@modelcontextprotocol/sdk/dist/cjs/client/index.js');
const { StdioClientTransport } = require('../emulatorjs-mcp-server/node_modules/@modelcontextprotocol/sdk/dist/cjs/client/stdio.js');

async function main() {
  // Resolve ROM path
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'zelda3.smc'),
    path.join(cwd, 'zelda3.sfc'),
    path.join(cwd, 'emulatorjs-mcp-server', 'public', 'zelda3.smc'),
  ];
  const rom = candidates.find(p => fs.existsSync(p));
  if (!rom) {
    console.error('ROM not found. Place zelda3.smc at repo root.');
    process.exit(1);
  }

  // Prepare output directory
  const outDir = path.join(cwd, 'output', 'emulatorjs-autoplay');
  fs.mkdirSync(outDir, { recursive: true });

  const env = {
    EMULATORJS_PORT: String(43021 + Math.floor(Math.random() * 1000)),
    PLAYWRIGHT_EXECUTABLE_PATH: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    PLAYWRIGHT_HEADLESS: '1',
  };

  const transport = new StdioClientTransport({
    command: 'node',
    args: [path.join(cwd, 'emulatorjs-mcp-server', 'dist', 'index.js')],
    env,
  });
  const client = new Client({ name: 'autoplay', version: '0.1.0' }, { capabilities: { tools: {} } });
  await client.connect(transport);

  const call = async (name, args = {}) => {
    const res = await client.callTool({ name, arguments: args });
    const text = res?.content?.[0]?.text;
    return text ? JSON.parse(text) : res;
  };

  const snap = async (label) => {
    const file = path.join(outDir, `${label}.png`);
    await call('take_screenshot', { filepath: file });
    console.log('screenshot:', file);
  };

  console.log('Starting emulator with', rom);
  await call('start_emulator', { rom_path: rom, headless: true });

  // Title screen wait
  await call('run_frames', { frames: 180 });
  await snap('01-title');

  // Press Start to enter file select
  await call('press_button', { button: 'Start', frames: 12 });
  await call('run_frames', { frames: 180 });
  await snap('02-post-start');

  // Try to select first slot and accept default name
  // Sequence: A (select slot) -> Start (accept) x3
  await call('press_button', { button: 'A', frames: 8 });
  await call('run_frames', { frames: 90 });
  for (let i = 0; i < 3; i++) {
    await call('press_button', { button: 'Start', frames: 8 });
    await call('run_frames', { frames: 60 });
  }
  await snap('03-after-file-select');

  // Spam A to pass cutscenes/text, periodically screenshot
  for (let i = 1; i <= 20; i++) {
    await call('press_button', { button: 'A', frames: 5 });
    await call('run_frames', { frames: 120 });
    if (i % 4 === 0) await snap(`04-cutscene-${i}`);
  }

  // Attempt simple movement pattern
  for (let j = 1; j <= 8; j++) {
    for (const b of ['Right', 'Down', 'Left', 'Up']) {
      await call('press_button', { button: b, frames: 18 });
      await call('run_frames', { frames: 36 });
    }
    await snap(`05-move-${j}`);
  }

  // Save a checkpoint if game allows
  try {
    const saved = await call('save_state_file', { name: 'autoplay-mid', location: 'autoplay' });
    console.log('save_state_file:', saved?.message || saved);
  } catch {}

  await snap('99-final');
  await call('stop_emulator', {});
  console.log('Autoplay complete. Screenshots in', outDir);
}

main().catch(err => {
  console.error('Autoplay error:', err);
  process.exit(1);
});

