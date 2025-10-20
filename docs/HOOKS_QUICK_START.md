# Claude Code Hooks - Quick Start

## Prompt Enhancer Hook

### What It Does
Automatically refines your prompts using codex CLI to make them more effective for AI agents.

### Quick Setup

1. **The hook is already configured** in both:
   - `.claude/settings.local.json` (preferred - native Claude Code)
   - `.vscode/settings.json` (VSCode extension fallback)
2. **Restart Claude Code** (if currently running)
3. **Start using** - enhancement happens automatically

### Test It

```bash
# Run the test suite
./scripts/test-prompt-enhancer.sh

# Test manually
echo "add error handling" | ./scripts/prompt-enhancer-hook.sh
```

### Enable Logging (See Before/After)

```bash
# In your shell
export PROMPT_ENHANCER_LOG=1

# Then use Claude Code normally
# You'll see enhancement comparisons in the output
```

### Configuration Files

- **Hook Script (Primary)**: [`.claude/hooks/prompt-enhancer.sh`](../.claude/hooks/prompt-enhancer.sh)
- **Hook Script (Standalone)**: [`scripts/prompt-enhancer-hook.sh`](../scripts/prompt-enhancer-hook.sh)
- **Claude Settings**: [`.claude/settings.local.json`](../.claude/settings.local.json)
- **VSCode Settings**: [`.vscode/settings.json`](../.vscode/settings.json)
- **Documentation**: [`docs/PROMPT_ENHANCER_HOOK.md`](./PROMPT_ENHANCER_HOOK.md)
- **Test Script**: [`scripts/test-prompt-enhancer.sh`](../scripts/test-prompt-enhancer.sh)

### How It Works

```
You type: "add tests"
         ↓
Hook intercepts prompt
         ↓
Sends to: codex exec "refine this prompt: add tests"
         ↓
Gets back enhanced version:
"Add comprehensive test coverage for the current module.
Include unit tests, integration tests, and edge cases..."
         ↓
Enhanced prompt sent to Claude Code
```

### Behavior

- **Short prompts** (< 20 chars): Pass through unchanged
- **Empty prompts**: Pass through unchanged
- **Timeout** (> 10s): Returns original prompt
- **Error**: Returns original prompt
- **No codex CLI**: Returns original prompt

### Disable Temporarily

**Option 1**: Comment out in `.claude/settings.local.json`:
```json
{
  "hooks": {
    // "UserPromptSubmit": [...]
  }
}
```

**Option 2**: Rename the hook script:
```bash
mv .claude/hooks/prompt-enhancer.sh .claude/hooks/prompt-enhancer.sh.disabled
```

**Option 3**: Comment out in `.vscode/settings.json`:
```json
{
  // "claudeCode.hooks.userPromptSubmit": "${workspaceFolder}/scripts/prompt-enhancer-hook.sh"
}
```

### Performance

- **Adds**: ~1-5 seconds per prompt
- **Timeout**: Max 10 seconds
- **Cost**: Uses codex CLI credits for enhancement

### Examples

**Before**: `fix the bug`
**After**: `Investigate and fix the reported bug. Include: 1) Root cause analysis 2) Proposed fix 3) Tests to prevent regression 4) Documentation of the issue`

**Before**: `add dark mode`
**After**: `Implement dark mode support. Requirements: 1) Theme toggle in settings 2) CSS variables for colors 3) Component updates 4) Persist preference 5) Test all views`

### Troubleshooting

**Hook not running?**
- Check: `which codex` (must be installed)
- Check: `ls -l scripts/prompt-enhancer-hook.sh` (must be executable)
- Check: Claude Code Output panel for errors

**Too slow?**
- Edit timeout in hook script (default: 10s)
- Increase minimum length threshold (default: 20 chars)

**Want to see what's happening?**
```bash
export PROMPT_ENHANCER_LOG=1
```

## Related Hooks

This workspace includes:
- **prompt-enhancer-hook.sh**: This hook - refines user prompts
- **codex-review-loop.js**: Paired codex sessions for iterative code review (not a hook)

## More Information

- Full documentation: [`docs/PROMPT_ENHANCER_HOOK.md`](./PROMPT_ENHANCER_HOOK.md)
- Claude Code hooks docs: https://docs.claude.com/en/docs/claude-code/user-hooks
- Related: [`scripts/codex-review-loop.js`](../scripts/codex-review-loop.js)
