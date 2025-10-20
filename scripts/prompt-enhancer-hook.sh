#!/usr/bin/env bash
#
# Claude Code User Prompt Submit Hook
#
# This hook intercepts user prompts and enhances them using the codex exec command
# to refine prompts for better AI agent performance.
#
# Usage: Configure in Claude Code settings as:
#   "claudeCode.hooks.userPromptSubmit": "/path/to/prompt-enhancer-hook.sh"
#
# The hook receives the original prompt via stdin and outputs the enhanced prompt to stdout.

set -euo pipefail

# Check if codex CLI is available
if ! command -v codex >/dev/null 2>&1; then
  echo "Warning: codex CLI not found, returning original prompt unchanged" >&2
  cat  # Pass through original prompt
  exit 0
fi

# Read the original prompt from stdin
original_prompt="$(cat)"

# If the prompt is empty, return it unchanged
if [[ -z "$original_prompt" ]]; then
  echo "$original_prompt"
  exit 0
fi

# Skip enhancement for very short prompts (likely commands or quick queries)
if [[ ${#original_prompt} -lt 20 ]]; then
  echo "$original_prompt"
  exit 0
fi

# Create a temporary file for the enhancement request
temp_dir="$(mktemp -d -t prompt-enhancer-XXXXXX)"
trap 'rm -rf "$temp_dir"' EXIT

enhancement_output="${temp_dir}/enhanced.txt"

# Craft the enhancement prompt for codex
enhancement_request=$(cat <<'EOF'
You are a prompt refinement specialist. Your task is to take a user's prompt and enhance it to be more effective for an AI coding agent.

Guidelines for enhancement:
1. Maintain the user's core intent and requirements
2. Add clarity and specificity where needed
3. Break down complex requests into clear steps if appropriate
4. Include relevant technical context that helps the agent
5. Suggest validation or testing steps if applicable
6. Keep the enhanced prompt concise but complete
7. Do not change the fundamental request
8. If the prompt is already well-formed, only make minor improvements

Original user prompt:
"""
EOF
)

enhancement_request+=$'\n'
enhancement_request+="$original_prompt"
enhancement_request+=$'\n"""'
enhancement_request+=$'\n\nProvide ONLY the enhanced prompt as your response, with no preamble or explanation.'

# Use codex exec to enhance the prompt
# Use a timeout to avoid hanging the user's workflow
if timeout 10s codex exec "$enhancement_request" > "$enhancement_output" 2>/dev/null; then
  enhanced_prompt="$(<"$enhancement_output")"

  # Validate that we got a reasonable response
  if [[ -n "$enhanced_prompt" ]] && [[ ${#enhanced_prompt} -ge ${#original_prompt} ]]; then
    # Log the enhancement for user review (optional)
    if [[ "${PROMPT_ENHANCER_LOG:-}" == "1" ]]; then
      log_file="${temp_dir}/prompt-enhancement.log"
      {
        echo "=== $(date) ==="
        echo "Original:"
        echo "$original_prompt"
        echo ""
        echo "Enhanced:"
        echo "$enhanced_prompt"
        echo ""
      } >> "$log_file"
      cat "$log_file" >&2
    fi

    echo "$enhanced_prompt"
  else
    # Enhancement failed validation, return original
    echo "$original_prompt"
  fi
else
  # Enhancement timed out or failed, return original without logging prompt contents
  echo "Warning: prompt enhancer unavailable; using original prompt." >&2
  echo "$original_prompt"
fi
