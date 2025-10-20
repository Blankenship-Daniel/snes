# EmulatorJS Debug Logging Guide

This guide shows how to enable and use EmulatorJS debug logging in this repo.

## What It Does

- Enables EmulatorJS developer mode (`EJS_DEBUG_XX`) so the browser console prints useful diagnostics and, where supported, loads unminified assets.
- Helps triage ROM loading, controller input, language/files path issues, and core initialization.

## Default Behavior

- Debug is ON by default across our EmulatorJS pages served by the MCP server.
- You can toggle it via an environment variable without editing HTML.

## How To Run

1) Build the EmulatorJS MCP server

```
cd emulatorjs-mcp-server
npm run build
```

2) Start the static server (debug defaults ON)

```
node start-server.js
# Visit http://localhost:8888
```

3) Open DevTools in your browser and check the Console for logs (look for lines from EmulatorJS and `[MCP] ...`).

## Toggling Debug via Env Var

You can control debug without touching HTML using `EMULATORJS_DEBUG` when launching the server:

- Enable (explicit):
```
EMULATORJS_DEBUG=1 node start-server.js
EMULATORJS_DEBUG=true node start-server.js
```

- Disable:
```
EMULATORJS_DEBUG=0 node start-server.js
EMULATORJS_DEBUG=false node start-server.js
EMULATORJS_DEBUG=off node start-server.js
```

Implementation details:
- The server exposes `/mcp-config.js` which injects `window.EJS_DEBUG_XX` before `loader.js` is loaded.
- Default is ON unless explicitly disabled via the env var.

## Pages With Debug Support

- emulatorjs-mcp-server/public/index.html
- emulatorjs-mcp-server/public/test-simple.html

Both load `/mcp-config.js` first, then set a local default if the file is unavailable.

## Where Logs Appear

- Browser console (open DevTools on the EmulatorJS page).
- When driven by the MCP server (Playwright), page logs are mirrored to the terminal with the prefix `[Browser Console]`.

## Verify Debug Is Active

- Open browser DevTools → Console and look for: `[MCP] EJS_DEBUG_XX=true (via EMULATORJS_DEBUG env, default ON)`.
- In the Console, run: `window.EJS_DEBUG_XX` and confirm it returns `true`.
- Check Network tab; when supported, you may see non‑minified files (e.g., `emulator.js`, `GameManager.js`) or additional verbose requests that appear only in debug mode.
- If using the MCP server, the terminal should show page logs prefixed with `[Browser Console]` shortly after load.

## Tips

- If you see network errors, check the Network tab (verify `data/loader.js`, core `.wasm`/`.data` paths, and `EJS_pathtodata`).
- Ensure `EJS_gameUrl` is set before `loader.js` executes if you want auto-start.
- For input focus, click the canvas once after loading to ensure keyboard events are received.

## Related Docs

- Official docs (Developers): https://emulatorjs.org/docs4devs
- Options reference: https://emulatorjs.org/docs/options/
