# Install EmulatorJS MCP Server in Codex CLI

This guide wires the local `emulatorjs-mcp-server` from this repo into the OpenAI Codex CLI, so Codex can load and control a browser‑based SNES emulator via MCP tools.

## Prerequisites

- Node.js 18+ and npm
- Codex CLI installed: `npm i -g @openai/codex`
- A valid SNES ROM placed in this repo (e.g., `zelda3.smc` at repo root; do not commit it)

## Build the MCP server

```bash
cd emulatorjs-mcp-server
npm install
npm run setup
npm run build

# Install a Playwright browser runtime
npx playwright install chromium
```

## Add to Codex CLI config

Codex reads MCP servers from `~/.codex/config.toml` using the `mcp_servers` table.

Add an entry pointing to this repo’s server (replace `<ABSOLUTE_PATH_TO_REPO>` with your path):

```toml
[mcp_servers.emulatorjs]
command = "bash"
args = ["-lc", 'cd "<ABSOLUTE_PATH_TO_REPO>" && node ./emulatorjs-mcp-server/dist/index.js']

# Optional: change the HTTP port used by the local web UI
# [mcp_servers.emulatorjs.env]
# EMULATORJS_PORT = "3000"
```

Notes:
- Use `mcp_servers` (snake_case), not `mcpServers`.
- The server runs over stdio; Codex will launch it on demand.

## Verify installation

```bash
codex mcp list
```

You should see a row named `emulatorjs` with the command pointing to `emulatorjs-mcp-server/dist/index.js`.

## Quick sanity test (from an MCP client)

Open Codex CLI (`codex`) and in a session run tools similar to:

```ts
// Start emulator with an absolute ROM path
await use_mcp_tool("emulatorjs", "start_emulator", { rom_path: "/absolute/path/to/zelda3.smc" });

// Let it run ~3 seconds
await use_mcp_tool("emulatorjs", "run_frames", { frames: 180 });

// Take a screenshot to confirm visuals
await use_mcp_tool("emulatorjs", "take_screenshot", { filepath: "./output/test.png" });

// Stop when done
await use_mcp_tool("emulatorjs", "stop_emulator", {});
```

For a fuller walkthrough, see `docs/guides/emulatorjs-mcp-quick-start.md`.

## Troubleshooting

- If a browser does not open or tools hang:
  - Install Playwright runtime: `npx playwright install chromium`
  - Ensure the port is free: `lsof -i :3000`
  - Kill any stale node processes spawns: `killall node`
- If ROM fails to load:
  - Use an absolute file path
  - Confirm `.smc`/`.sfc` file and that it’s readable

