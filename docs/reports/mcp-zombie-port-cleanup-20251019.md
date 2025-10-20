# MCP Servers: Zombie Port Cleanup — Investigation and Fixes (2025-10-19)

## Summary
- Symptom: After closing the Claude Code client, the EmulatorJS MCP server and SNES MCP server processes continue running; EmulatorJS leaves an HTTP port open (appears as a zombie port).
- Root causes:
  - EmulatorJS MCP: HTTP server listens and the process misses shutdown signals when the client exits; no handling for stdio close. The listener alone keeps the event loop alive.
  - SNES MCP: A background `setInterval` in the manual cache manager keeps the Node event loop alive; the server does not register shutdown handlers, so the process lingers.
- Fixes implemented: Robust shutdown hooks, explicit resource teardown, and “do not keep-alive” semantics for the HTTP listener.

## Key Changes
- EmulatorJS MCP
  - `emulatorjs-mcp-server/src/web-server.ts:8` — Add `unref()` on the HTTP server, set aggressive timeouts, track and destroy sockets, and expose a `destroy()` hook for shutdown.
  - `emulatorjs-mcp-server/src/index.ts:19` — Store `destroyWebServer`;
  - `emulatorjs-mcp-server/src/index.ts:1020` — Add unified `shutdown()` handling SIGINT/SIGTERM/SIGHUP/SIGQUIT, stdio `end/close`, `disconnect`, and fatal error cases; call `stopWebServer(server, destroy)` and close Playwright browser.
- SNES MCP
  - `snes-mcp-server/src/manual/cache-manager.ts:23` — Store the cleanup timer, call `unref()` so it won’t keep the event loop alive, and add `dispose()` to clear it and reset indexes.
  - `snes-mcp-server/src/manual/manual-data-integration.ts:86` — Add `dispose()` to tear down caches/timers.
  - `snes-mcp-server/src/index.ts:24` — Import `DatabaseService` and add `shutdown()` that calls `DatabaseService.forceReset()` and `getManualData().dispose()`; register handlers for SIGINT/SIGTERM/SIGHUP/SIGQUIT, stdio `end/close`, and fatal errors.

## How This Prevents Zombie Ports
- HTTP server no longer pins the event loop (`server.unref()`), and sockets are force-destroyed on shutdown, ensuring the port is released.
- Background timers are either `unref()`’d or cleared during shutdown, allowing Node to exit when the client disconnects.
- Stdio lifecycle (client close) now triggers cleanup through `process.stdin` `end/close` events and common signal handlers.

## Verification Steps
- EmulatorJS MCP
  - Start server via Claude Code or locally with stdio transport.
  - Trigger `start_emulator` then close the client/session.
  - Confirm the process exits within ~1s and the configured port (default `3000`) is no longer listening (e.g., `lsof -iTCP:3000 -sTCP:LISTEN` returns nothing).
- SNES MCP
  - Start server, issue any tool call, then close the client/session.
  - Confirm the process exits (no lingering Node process), and no open ports remain.

## Risk/Compatibility
- Low risk. Changes add shutdown paths and avoid keeping the event loop alive; runtime behavior and APIs are unchanged.
- For EmulatorJS MCP, `createWebServer` now returns `{app, server, destroy}` and `stopWebServer` optionally accepts `destroy` — internal usage has been updated.

## Next Steps
- If other MCP servers run timers, apply the same `unref()`/`dispose()` pattern.
- Consider adding an optional `--idle-timeout` to force shutdown after N seconds without requests.
- Add a small integration test that spawns each MCP server on stdio, closes stdin, and asserts timely process exit.
