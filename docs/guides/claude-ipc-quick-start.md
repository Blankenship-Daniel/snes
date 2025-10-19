# Claude IPC Quick Start: Real-Time Notifications

## The Problem

Currently, Claude IPC messages are only checked when the UserPromptSubmit hook triggers. This means messages sit unread until you send another prompt.

## The Solution ✅

Run a **background monitor** in a separate terminal that immediately displays messages as they arrive.

---

## Fastest Setup (No Dependencies)

### Step 1: Start a Background Monitor (Optional)

Note: The background monitor is provided by external tooling and is not included in this repository. If you have a compatible monitor installed, start it in a new terminal. Otherwise, skip this step.

For example (placeholder):
```bash
# Example only — requires external IPC monitor tooling
# cd /path/to/claude-ipc-mcp
# uv run python tools/ipc_background_monitor.py snes-dev 2
```

If available, this will:
- Check for messages every 2 seconds
- Display them immediately in the terminal
- Ring the terminal bell for audio alerts

### Step 2: Continue Using Claude Code Normally

In your **main Claude Code terminal:**

```bash
# Work as usual
# When messages arrive, the monitor terminal will show them instantly
```

---

## Example Output

**Monitor Terminal:**
```
🔍 Monitoring IPC messages for: snes-dev
⏱️  Polling interval: 2 seconds
📬 Waiting for messages... (Press Ctrl+C to stop)

============================================================
📬 1 NEW MESSAGE(S) RECEIVED!
============================================================

From: snes-orchestrator
Time: 2025-10-18T16:30:00
Content: Analysis complete, ready for Phase 2
Data: {
  "phase": 2,
  "status": "ready"
}
============================================================
```

---

## Advanced: Instant Notifications (Optional)

For **near-instant** notifications (10-50ms latency), use the file system watcher:

This approach depends on external tooling (not included in this repository). If you already have a file watcher installed, consult its documentation to configure it for your IPC store.

**Benefits:**
- ✅ Instant notifications (event-driven)
- ✅ Minimal CPU usage
- ✅ macOS system notifications
- ✅ Terminal bell alerts

---

## Comparison

| Method | Latency | CPU | Setup |
|--------|---------|-----|-------|
| **Background Monitor** | 2-5 sec | Low | None |
| **File Watcher** | 10-50ms | Minimal | `uv pip install watchdog` |
| **Hook (current)** | Until next prompt | None | Already configured |

---

## Recommended Workflow

1. **Active development**: Use background monitor or file watcher in a separate terminal
2. **Occasional use**: Use the existing hook (checks on every prompt)
3. **Team coordination**: Everyone runs monitors to see messages instantly

---

## Full Documentation

See `docs/guides/claude-ipc-realtime-notifications.md` for complete details, troubleshooting, and advanced features.
