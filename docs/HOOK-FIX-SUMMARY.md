# UserPromptSubmit Hook Error - Fixed

## Problem

The UserPromptSubmit hook was crashing with:
```
AttributeError: module 'logging' has no attribute 'getLogger'
```

## Root Cause

**Module Name Conflict**

1. Custom logging module: `.claude/hooks/utils/logging.py`
2. This shadowed Python's built-in `logging` module
3. When `neo4j_rag` imported `neo4j`, it needed Python's standard `logging.getLogger()`
4. But got the custom `logging.py` instead, which didn't have `getLogger()`

### Error Chain
```
user_prompt_submit.py
    → imports neo4j_rag
        → imports neo4j
            → imports asyncio
                → imports concurrent.futures
                    → tries to call logging.getLogger()
                        → ERROR: wrong logging module!
```

## Solution

Renamed the custom logging module to avoid conflict:

```bash
# Renamed file
.claude/hooks/utils/logging.py → .claude/hooks/utils/hook_logging.py

# Updated all imports
from logging import log_event, read_stdin_json
→
from hook_logging import log_event, read_stdin_json
```

### Files Updated
- `.claude/hooks/utils/logging.py` → `hook_logging.py` (renamed)
- `.claude/hooks/user_prompt_submit.py` (updated imports)
- `.claude/hooks/pre_tool_use.py` (updated imports)
- `.claude/hooks/post_tool_use.py` (updated imports)
- `.claude/hooks/stop.py` (updated imports)
- `.claude/hooks/subagent_stop.py` (updated imports)
- `.claude/hooks/notification.py` (updated imports)

## Testing

Before fix:
```bash
$ python3 .claude/hooks/user_prompt_submit.py <<< '{}'
AttributeError: module 'logging' has no attribute 'getLogger'
```

After fix:
```bash
$ python3 .claude/hooks/user_prompt_submit.py <<< '{}'
============================================================
🔍 Automatic Context Injection
============================================================
📍 Git branch: `main`
📚 Project guidelines (AGENTS.md):
...
============================================================
```

## Prevention

To avoid similar issues in the future:

1. **Never name local modules after standard library modules**
   - ❌ `logging.py`, `json.py`, `os.py`, `sys.py`
   - ✅ `hook_logging.py`, `custom_json.py`, etc.

2. **Use descriptive names** that indicate context
   - `hook_logging.py` clearly indicates it's for hooks
   - Prevents shadowing built-in modules

3. **Test hooks in isolation** before deploying
   ```bash
   python3 path/to/hook.py <<< '{}'
   ```

## Hook Status

All hooks are now working:
- ✅ PreToolUse
- ✅ PostToolUse
- ✅ UserPromptSubmit (FIXED)
- ✅ Notification
- ✅ Stop
- ✅ SubagentStop

## Next Steps

The UserPromptSubmit hook now:
1. Injects git context (branch, commits, status)
2. Injects project context (AGENTS.md, CLAUDE.md)
3. Can inject RAG context from Neo4j (when available)

No further action required - the hook is working as intended!
