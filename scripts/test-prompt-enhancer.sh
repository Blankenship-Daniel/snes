#!/usr/bin/env bash
#
# Test script for the prompt enhancer hook
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK_SCRIPT="${SCRIPT_DIR}/prompt-enhancer-hook.sh"

echo "Testing Prompt Enhancer Hook"
echo "=============================="
echo ""

# Test 1: Very short prompt (should pass through unchanged)
echo "Test 1: Very short prompt (should skip enhancement)"
echo "---------------------------------------------------"
original="fix bug"
result=$(echo "$original" | "$HOOK_SCRIPT")
echo "Original: $original"
echo "Result:   $result"
if [[ "$result" == "$original" ]]; then
  echo "✓ PASS: Short prompt passed through unchanged"
else
  echo "✗ FAIL: Short prompt was modified"
fi
echo ""

# Test 2: Empty prompt (should pass through unchanged)
echo "Test 2: Empty prompt"
echo "-------------------"
original=""
result=$(echo "$original" | "$HOOK_SCRIPT")
if [[ "$result" == "$original" ]]; then
  echo "✓ PASS: Empty prompt passed through unchanged"
else
  echo "✗ FAIL: Empty prompt was modified"
fi
echo ""

# Test 3: Medium-length prompt (should be enhanced)
echo "Test 3: Medium-length prompt (should be enhanced if codex available)"
echo "--------------------------------------------------------------------"
original="Add error handling to the authentication module"
echo "Original: $original"
echo ""
echo "Running enhancement..."
result=$(echo "$original" | "$HOOK_SCRIPT" 2>&1)
echo ""
echo "Result:"
echo "$result"
echo ""
if [[ ${#result} -gt ${#original} ]]; then
  echo "✓ PASS: Prompt was enhanced (${#original} chars -> ${#result} chars)"
elif [[ "$result" == "$original" ]]; then
  echo "⚠ SKIP: Prompt unchanged (codex may not be available)"
else
  echo "✗ FAIL: Unexpected result"
fi
echo ""

# Test 4: With logging enabled
echo "Test 4: Test with logging enabled"
echo "---------------------------------"
original="refactor the database connection code for better performance"
echo "Original: $original"
echo ""
echo "Running with PROMPT_ENHANCER_LOG=1..."
result=$(PROMPT_ENHANCER_LOG=1 "$HOOK_SCRIPT" <<<"$original" 2>&1 | tail -20)
echo ""
echo "Last 20 lines of output:"
echo "$result"
echo ""

# Test 5: Check codex availability
echo "Test 5: Codex CLI availability"
echo "------------------------------"
if command -v codex >/dev/null 2>&1; then
  echo "✓ codex CLI is installed"
  echo "  Location: $(which codex)"
  echo "  Version info:"
  codex --version 2>&1 | head -5 || echo "  (version command not available)"
else
  echo "✗ codex CLI not found in PATH"
  echo "  Hook will pass through prompts unchanged"
fi
echo ""

echo "=============================="
echo "Testing complete!"
