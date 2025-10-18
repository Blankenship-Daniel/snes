#!/usr/bin/env bash
set -euo pipefail

# Fail if hard-coded /Users/<name> paths are found in code/config files.
# Excludes generated or third-party directories.

ROOT="${1:-.}"

if ! command -v rg >/dev/null 2>&1; then
  echo "ripgrep (rg) is required for this check" >&2
  exit 2
fi

EXCLUDES=(
  "--glob=!**/.git/**"
  "--glob=!**/node_modules/**"
  "--glob=!**/dist/**"
  "--glob=!**/build/**"
  "--glob=!**/out/**"
  "--glob=!**/*.png"
  "--glob=!**/*.jpg"
  "--glob=!**/*.bin"
  "--glob=!**/*.smc"
  "--glob=!**/CMakeCache.txt"
  "--glob=!tools/check-no-absolute-paths.sh"
)

# File types to scan (code + config + docs where it matters)
TYPES=(sh bash zsh py ts js tsx jsx json yml yaml)

PATTERN='/Users/'

FOUND=0

for ext in "${TYPES[@]}"; do
  if rg -n "$PATTERN" "${EXCLUDES[@]}" --glob "**/*.${ext}" "$ROOT"; then
    FOUND=1
  fi
done

if [[ $FOUND -ne 0 ]]; then
  echo "\n❌ Found hard-coded absolute /Users/ paths. Please replace with repo-relative or env-configurable paths." >&2
  exit 1
fi

echo "✅ No hard-coded /Users/ paths found in scanned files."
