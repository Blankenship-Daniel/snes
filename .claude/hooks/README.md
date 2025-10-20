# Claude Code Hooks

This directory contains hooks that are automatically executed by Claude Code at specific lifecycle events.

## Installed Hooks

### UserPromptSubmit: prompt-enhancer.sh

**File**: [`prompt-enhancer.sh`](./prompt-enhancer.sh)
**Event**: `UserPromptSubmit`
**Purpose**: Automatically enhance user prompts using codex CLI for better AI agent comprehension

**How it works**:
1. Intercepts user prompts before they're sent to Claude Code
2. Uses `codex exec` to refine the prompt for clarity and actionability
3. Returns enhanced prompt (or original if enhancement fails)

**Features**:
- Smart filtering (skips prompts < 20 chars)
- 10-second timeout to prevent blocking
- Graceful fallback to original prompt
- Optional logging with `PROMPT_ENHANCER_LOG=1`

**Configuration**: See [`.claude/settings.local.json`](../settings.local.json)

**Testing**:
```bash
# Test directly
echo "add error handling" | ./.claude/hooks/prompt-enhancer.sh

# Run test suite
./scripts/test-prompt-enhancer.sh

# Enable logging
PROMPT_ENHANCER_LOG=1 ./.claude/hooks/prompt-enhancer.sh <<<"refactor code"
```

**Documentation**: See [`docs/PROMPT_ENHANCER_HOOK.md`](../../docs/PROMPT_ENHANCER_HOOK.md)

## Hook Configuration

Hooks are configured in [`.claude/settings.local.json`](../settings.local.json):

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/prompt-enhancer.sh"
          }
        ]
      }
    ]
  }
}
```

## Available Hook Events

Claude Code supports these hook events:

| Event | When It Fires | Use Cases |
|-------|---------------|-----------|
| `PreToolUse` | Before Claude executes a tool | Block dangerous commands, validate inputs |
| `PostToolUse` | After a tool completes | Log actions, run formatters, run tests |
| `Stop` | When Claude finishes responding | Send notifications, commit changes |
| `Notification` | When Claude sends notifications | Auto-approve certain actions |
| `UserPromptSubmit` | When user submits a prompt | Log prompts, enhance input |
| `PreCompact` | Before compaction | Backup transcripts |
| `SessionStart` | When session starts | Load context, setup environment |

## Hook Requirements

All hooks must:
- Be executable: `chmod +x .claude/hooks/your-hook.sh`
- Read input from stdin (for hooks that receive data)
- Write output to stdout
- Use exit codes appropriately:
  - `0` = Success, continue normally
  - `1` = Error, show message to user
  - `2` = Block, prevent the action

## Environment Variables

Claude Code provides these variables to hooks:

- `$CLAUDE_PROJECT_DIR` - Project root directory
- `$CLAUDE_FILE_PATHS` - Space-separated file paths
- `$CLAUDE_TOOL_OUTPUT` - Tool output (PostToolUse only)
- `$CLAUDE_NOTIFICATION` - Notification message

## Adding New Hooks

1. Create hook script in this directory
2. Make it executable: `chmod +x .claude/hooks/your-hook.sh`
3. Add configuration to `.claude/settings.local.json`
4. Test manually before using in Claude Code
5. Document in this README

Example:
```bash
# Create hook
cat > .claude/hooks/my-hook.sh <<'EOF'
#!/usr/bin/env bash
# Your hook logic here
EOF

# Make executable
chmod +x .claude/hooks/my-hook.sh

# Test
echo "test input" | ./.claude/hooks/my-hook.sh
```

## Troubleshooting

### Hook not running?
1. Check permissions: `ls -la .claude/hooks/`
2. Verify configuration in `.claude/settings.local.json`
3. Test manually: `echo "test" | ./.claude/hooks/your-hook.sh`
4. Check for errors in Claude Code output

### Hook errors?
- Errors print to stderr (visible in Claude Code)
- Add debug output: `echo "Debug: $var" >&2`
- Test with logging enabled

### Wrong path?
- Use `$CLAUDE_PROJECT_DIR` for absolute paths
- Test with: `echo $CLAUDE_PROJECT_DIR`

## Best Practices

1. **Keep hooks fast** - They run synchronously and block Claude
2. **Handle errors gracefully** - Always use try/catch or error checks
3. **Validate input** - Check for empty/invalid data
4. **Use timeouts** - Don't hang indefinitely (see prompt-enhancer.sh)
5. **Log to stderr** - stdout is for hook output, stderr for diagnostics
6. **Test thoroughly** - Test edge cases before deploying

## Resources

- **Official Docs**: https://docs.claude.com/en/docs/claude-code/hooks
- **Project Docs**: [docs/PROMPT_ENHANCER_HOOK.md](../../docs/PROMPT_ENHANCER_HOOK.md)
- **Quick Start**: [docs/HOOKS_QUICK_START.md](../../docs/HOOKS_QUICK_START.md)
- **Implementation Summary**: [docs/PROMPT_ENHANCER_SUMMARY.md](../../docs/PROMPT_ENHANCER_SUMMARY.md)
