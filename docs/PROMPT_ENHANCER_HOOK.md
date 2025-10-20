# Prompt Enhancer Hook

A user-prompt-submit hook for Claude Code that automatically refines and enhances user prompts using the codex CLI to make them more effective for AI agents.

## Overview

This hook intercepts prompts before they're sent to the AI agent and uses `codex exec` to refine them for better clarity, specificity, and actionability.

## Features

- **Automatic Enhancement**: Refines prompts for better AI agent comprehension
- **Maintains Intent**: Preserves the user's core request while adding helpful details
- **Smart Filtering**: Only enhances prompts that would benefit (skips very short ones)
- **Fail-Safe**: Returns original prompt if enhancement fails or times out
- **Optional Logging**: Can log before/after comparisons for review

## Installation

### Step 1: Ensure the hook is executable

```bash
chmod +x ./scripts/prompt-enhancer-hook.sh
```

### Step 2: Configure Claude Code

Add this to your Claude Code settings (VSCode):

**Via Settings UI:**
1. Open Settings (Cmd+, on macOS)
2. Search for "Claude Code Hooks"
3. Find "User Prompt Submit" setting
4. Set value to: `${workspaceFolder}/scripts/prompt-enhancer-hook.sh`

**Via settings.json:**
```json
{
  "claudeCode.hooks.userPromptSubmit": "${workspaceFolder}/scripts/prompt-enhancer-hook.sh"
}
```

**Via Workspace Settings:**
Create/edit `.vscode/settings.json` in your workspace:
```json
{
  "claudeCode.hooks.userPromptSubmit": "${workspaceFolder}/scripts/prompt-enhancer-hook.sh"
}
```

## Usage

Once configured, the hook runs automatically whenever you submit a prompt to Claude Code.

### Normal Operation

```
You type: "add error handling"

Hook enhances to:
"Add comprehensive error handling to the current module. Include:
1. Try-catch blocks around async operations
2. Input validation with clear error messages
3. Proper error logging
4. Graceful fallback behavior where appropriate
Please ensure existing functionality is preserved and add tests for error cases."
```

### Enable Logging (Optional)

To see before/after comparisons:

```bash
export PROMPT_ENHANCER_LOG=1
```

Then use Claude Code normally. Enhancement logs will be printed to stderr.

## How It Works

1. **Receives Prompt**: Hook gets original prompt via stdin
2. **Smart Filtering**: Skips very short prompts (< 20 chars) or empty ones
3. **Enhancement Request**: Sends prompt to `codex exec` with refinement instructions
4. **Validation**: Ensures enhanced prompt is reasonable
5. **Output**: Returns enhanced prompt to Claude Code

### Enhancement Guidelines

The hook instructs codex to:
- Maintain the user's core intent
- Add clarity and specificity
- Break down complex requests into steps
- Include relevant technical context
- Suggest validation/testing steps
- Keep prompts concise but complete

### Fail-Safe Behavior

The hook returns the original prompt unchanged if:
- codex CLI is not installed
- Enhancement times out (10s limit)
- Enhanced prompt is shorter than original
- Enhanced prompt is empty
- Any error occurs

## Configuration Options

### Timeout

Default: 10 seconds

To change, edit this line in the script:
```bash
if timeout 10s codex exec "$enhancement_request" ...
```

### Minimum Prompt Length

Default: 20 characters

To change, edit this line:
```bash
if [[ ${#original_prompt} -lt 20 ]]; then
```

### Enable Logging

```bash
# Temporary (current session)
export PROMPT_ENHANCER_LOG=1

# Permanent (add to ~/.bashrc or ~/.zshrc)
echo 'export PROMPT_ENHANCER_LOG=1' >> ~/.bashrc
```

## Testing

Test the hook directly from command line:

```bash
# Test with a simple prompt
echo "fix the bug" | ./scripts/prompt-enhancer-hook.sh

# Test with a complex prompt
echo "I want to add a new feature that tracks user metrics" | ./scripts/prompt-enhancer-hook.sh

# Test with logging enabled
PROMPT_ENHANCER_LOG=1 ./scripts/prompt-enhancer-hook.sh <<<"refactor this code"
```

## Examples

### Example 1: Simple Request Enhancement

**Original:**
```
add tests
```

**Enhanced:**
```
Add comprehensive test coverage for the current module. Include:
1. Unit tests for all public functions
2. Integration tests for key workflows
3. Edge case and error condition testing
4. Mock external dependencies appropriately
Ensure tests follow the existing test framework and naming conventions.
```

### Example 2: Bug Fix Enhancement

**Original:**
```
fix the memory leak
```

**Enhanced:**
```
Investigate and fix the reported memory leak. Steps:
1. Identify the source of the memory leak using available debugging tools
2. Review object lifecycle and cleanup code
3. Implement proper resource disposal
4. Add tests to prevent regression
5. Verify fix with memory profiling
Please document the root cause and solution in comments.
```

### Example 3: Feature Addition Enhancement

**Original:**
```
add dark mode
```

**Enhanced:**
```
Implement dark mode support for the application. Requirements:
1. Add dark mode toggle in settings/preferences
2. Implement CSS variables or theme system for colors
3. Update all UI components to respect theme preference
4. Persist user's theme choice
5. Handle system theme preference detection
6. Ensure sufficient contrast for accessibility
Test across all main application views.
```

## Troubleshooting

### Hook doesn't seem to run

1. Check that codex CLI is installed: `which codex`
2. Verify hook path in Claude Code settings
3. Ensure script is executable: `ls -l scripts/prompt-enhancer-hook.sh`
4. Check Claude Code output panel for hook errors

### Enhancement is too slow

1. Reduce timeout value in script (currently 10s)
2. Check codex CLI performance: `time codex exec "test prompt"`
3. Consider increasing minimum prompt length threshold

### Getting original prompts back unchanged

This is expected behavior when:
- Prompt is < 20 characters
- Enhancement fails or times out
- codex CLI is not available

Enable logging to see what's happening:
```bash
export PROMPT_ENHANCER_LOG=1
```

### Want to disable temporarily

Comment out the setting in your settings.json:
```json
{
  // "claudeCode.hooks.userPromptSubmit": "/path/to/prompt-enhancer-hook.sh"
}
```

Or rename the hook file temporarily:
```bash
mv scripts/prompt-enhancer-hook.sh scripts/prompt-enhancer-hook.sh.disabled
```

## Performance Considerations

- **Latency**: Adds ~1-5 seconds per prompt (timeout max: 10s)
- **API Costs**: Each prompt enhancement uses codex CLI credits
- **Filtering**: Short prompts skip enhancement to reduce overhead
- **Fail-Fast**: 10s timeout prevents indefinite hanging

## Future Enhancements

Potential improvements:
- Cache common prompt patterns
- Learn from user edits to refined prompts
- Project-specific enhancement rules
- Async enhancement with preview
- Integration with project CLAUDE.md context

## Related

- [scripts/codex-review-loop.js](../scripts/codex-review-loop.js) - Paired codex sessions for code review
- [CLAUDE.md](../CLAUDE.md) - Project guidance for Claude Code
- Claude Code Hooks Documentation: https://docs.claude.com/en/docs/claude-code/user-hooks
