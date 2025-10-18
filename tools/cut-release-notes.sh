#!/usr/bin/env bash
set -euo pipefail

# Cut release notes from docs/releases/next.md into docs/releases/vX.Y.Z.md
# Usage: tools/cut-release-notes.sh v1.2.3 [YYYY-MM-DD]

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 vX.Y.Z [YYYY-MM-DD]" >&2
  exit 2
fi

TAG="$1"
DATE="${2:-$(date +%Y-%m-%d)}"

if [[ ! "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "ERROR: Tag must be semantic version with leading 'v', e.g., v1.2.3" >&2
  exit 2
fi

SRC="docs/releases/next.md"
DEST="docs/releases/${TAG}.md"

if [[ ! -f "$SRC" ]]; then
  echo "ERROR: $SRC not found" >&2
  exit 1
fi

if [[ -s "$DEST" ]]; then
  echo "ERROR: $DEST already exists and is non-empty" >&2
  exit 1
fi

TITLE="# Zelda 3 Modder ${TAG}"

{
  echo "$TITLE"
  echo
  echo "Release date: ${DATE}"
  echo
  # Body from next.md without the top heading if present
  awk 'NR==1 && $0 ~ /^# / {next} {print}' "$SRC"
} > "$DEST"

echo "✓ Wrote release notes to $DEST"

# Reset next.md to template
cat > "$SRC" << 'TEMPLATE'
# Next Release (Unreleased)

Use this file to accumulate noteworthy changes for the next release. When cutting a release, copy this into `docs/releases/vX.Y.Z.md` (see `tools/cut-release-notes.sh`), then reset this file to the template.

## Highlights
- 

## Changes
- 

## Docs
- 

## CI / Tooling
- 

## Lint / Policy
- 

## MCP / Integrations
- 

## Validation
- 

## Upgrade Notes
- 

---

Template last updated: $(date +%Y-%m-%d)
TEMPLATE

echo "✓ Reset $SRC to template"

echo "Done. To tag and push:"
echo "  git add $DEST $SRC"
echo "  git commit -m \"docs(release): add ${TAG} notes\""
echo "  git tag -a ${TAG} -m \"Zelda 3 Modder ${TAG}\""
echo "  git push && git push origin ${TAG}"

