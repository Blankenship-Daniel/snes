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
  "--glob=!**/venv/**"
  "--glob=!**/.ai-team-workspace/**"
  "--glob=!**/.rom-backups/**"
  "--glob=!**/*.png"
  "--glob=!**/*.jpg"
  "--glob=!**/*.bin"
  "--glob=!**/*.smc"
  "--glob=!**/CMakeCache.txt"
  "--glob=!**/tools/check-no-absolute-paths.sh"
  "--glob=!**/zelda3/web/**"
  "--glob=!**/docker-compose.yml"
)

# File types to scan (code + config + docs where it matters)
TYPES=(sh bash zsh py ts js tsx jsx json yml yaml)

PATTERNS=(
  '/Users/'
  'C:/Users/'
  'C\\Users\\'  # C:\Users\ (fixed string)
  '/mnt/c/Users/'
)

matches_file="$(mktemp)"
trap 'rm -f "$matches_file"' EXIT

# Build pattern args for ripgrep (fixed string patterns)
pattern_args=()
for pat in "${PATTERNS[@]}"; do
  pattern_args+=( -F -e "$pat" )
done

for ext in "${TYPES[@]}"; do
  # Collect matches for this extension; do not stop on non-zero (no matches)
  rg -n "${pattern_args[@]}" "${EXCLUDES[@]}" --glob "**/*.${ext}" "$ROOT" \
    | grep -v "tools/check-no-absolute-paths.sh" \
    >> "$matches_file" || true
done

if [[ -s "$matches_file" ]]; then
  echo "❌ Found hard-coded absolute user paths (e.g., /Users/, C:/Users/, /mnt/c/Users/):" >&2
  echo "" >&2
  cat "$matches_file" >&2
  echo "" >&2
  echo "Please replace with repo-relative paths or env-configurable values." >&2
  exit 1
fi

echo "✅ No hard-coded absolute user paths found in scanned files."
