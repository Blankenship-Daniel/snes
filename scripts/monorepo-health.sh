#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Monorepo Healthcheck (repos/ + Yarn workspaces)"
echo "==============================================="

if command -v node >/dev/null 2>&1; then
  echo "Node: $(node --version)"
else
  echo "⚠️  Node not found on PATH" >&2
fi

if command -v yarn >/dev/null 2>&1; then
  echo "Yarn: $(yarn --version)"
else
  echo "⚠️  Yarn not found on PATH (using Corepack if available)" >&2
fi

if command -v corepack >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || true
fi

echo
echo "➡️  Checking workspaces…"
YARN_ENABLE_SCRIPTS=false yarn install --mode skip-build >/dev/null 2>&1 || true
yarn workspaces list || true

echo
echo "➡️  Running path linter…"
bash ./tools/check-no-absolute-paths.sh

echo
echo "➡️  Checking base ROM symlink…"
if [ -L zelda3.smc ]; then
  tgt=$(readlink zelda3.smc)
  echo "zelda3.smc → $tgt"
  case "$tgt" in
    repos/snes-modder/.rom-backups/*) echo "✅ ROM symlink OK";;
    *) echo "⚠️  ROM symlink points to unexpected location";;
  esac
elif [ -e zelda3.smc ]; then
  echo "⚠️  zelda3.smc exists but is not a symlink"
else
  echo "ℹ️  zelda3.smc missing (place ROM in root or link to repos/snes-modder/.rom-backups)"
fi

echo
echo "✅ Monorepo healthcheck complete"
