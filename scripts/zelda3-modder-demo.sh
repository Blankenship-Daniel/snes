#!/bin/bash
set -euo pipefail

# Zelda 3 Modder - 30 Second ROM Mod Demo
# The WORKING version that SHIPS TODAY!

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
source "$SCRIPT_DIR/mod-manifest.sh"

echo "🎮 Zelda 3 Modder - 30 Second Mods (MVP Demo)"
echo "═══════════════════════════════════════════════"

# Optional output directory (env or flag), defaults to repo root
OUTPUT_DIR="${OUTPUT_DIR:-.}"

print_mod_list() {
    echo "📦 Available Pre-Built Mods (Ready in 30 seconds):"
    echo ""
    local group_entry group_key group_label key description category default_label
    for group_entry in "${MOD_MANIFEST_GROUPS[@]}"; do
        IFS='|' read -r group_key group_label <<<"$group_entry"
        default_label="$group_label"
        if ! group_label="$(mod_manifest_group_label "$group_key")"; then
            group_label="$default_label"
        fi
        echo "  $group_label:"
        while IFS= read -r key; do
            category=$(mod_manifest_field "$key" category)
            if [[ "$category" != "$group_key" ]]; then
                continue
            fi
            description=$(mod_manifest_field "$key" description)
            printf "    • %-16s - %s\n" "$key" "$description"
        done < <(mod_manifest_keys)
        echo ""
    done
}

# Support a non-interactive 'list' command without requiring the base ROM
if [ "$1" = "list" ] || [ "$1" = "--list" ]; then
    print_mod_list
    exit 0
fi

# Check if we have the base ROM
if [ ! -f "zelda3.smc" ]; then
    echo "❌ Please add your Zelda 3 ROM as 'zelda3.smc' in this directory"
    exit 1
fi

print_mod_list

# Parse command line arguments
MOD_TYPE=""
print_usage() {
  echo "Usage: $0 [options] <mod-type>"
  echo "       $0 list"
  echo "Options:"
  echo "  -o, --out, --output-dir <dir>   Output directory (default: .)"
  echo "Examples:"
  echo "  $0 infinite-magic"
  echo "  OUTPUT_DIR=out $0 2x-speed"
  echo "  $0 -o out team-solution"
}

while [ $# -gt 0 ]; do
  case "$1" in
    -o|--out|--output-dir)
      if [ -n "${2:-}" ]; then
        OUTPUT_DIR="$2"; shift 2
      else
        echo "❌ Missing directory after $1"; exit 1
      fi
      ;;
    -h|--help)
      print_usage; exit 0
      ;;
    --)
      shift; break
      ;;
    -*)
      echo "❌ Unknown option: $1"; print_usage; exit 1
      ;;
    *)
      if [ -z "$MOD_TYPE" ]; then
        MOD_TYPE="$1"; shift
      else
        echo "❌ Unexpected argument: $1"; print_usage; exit 1
      fi
      ;;
  esac
done

if [ -z "$MOD_TYPE" ]; then
  print_usage; exit 1
fi

if ! MOD_KEY="$(mod_manifest_resolve_key "$MOD_TYPE")"; then
  echo "❌ Unknown mod type: $MOD_TYPE"
  echo ""
  print_mod_list
  exit 1
fi

SOURCE_ROM="$(mod_manifest_field "$MOD_KEY" source)"
OUTPUT_PREFIX="$(mod_manifest_field "$MOD_KEY" output_prefix)"
DESCRIPTION="$(mod_manifest_field "$MOD_KEY" description)"
OUTPUT_NAME="${OUTPUT_PREFIX}-$(date +%Y%m%d).smc"

START_TIME=$(date +%s)

echo "🔧 Creating: $DESCRIPTION"
echo "⏱️  Starting the 30-second countdown..."

# Check if source ROM exists
if [ ! -f "$SOURCE_ROM" ]; then
    echo "❌ Pre-built mod not found: $SOURCE_ROM"
    echo "🔨 Building from scratch would take longer - this is the MVP!"
    exit 1
fi

# Prepare output directory
mkdir -p "$OUTPUT_DIR"

# Copy the pre-built mod
echo "📋 Applying modifications..."
OUTPUT_PATH="$OUTPUT_DIR/$OUTPUT_NAME"
if ! cp "$SOURCE_ROM" "$OUTPUT_PATH"; then
    echo "❌ Failed to copy mod ROM to $OUTPUT_PATH"
    exit 1
fi

if [ ! -f "$OUTPUT_PATH" ]; then
    echo "❌ Copy operation did not produce $OUTPUT_PATH"
    exit 1
fi

# Calculate elapsed time
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo ""
echo "✨ SUCCESS! $DESCRIPTION applied in $ELAPSED seconds"
echo "📁 Output: $OUTPUT_PATH"
echo "🎮 Ready to play in your SNES emulator!"
echo ""
echo "🚀 The 30-second ROM mod experience: DELIVERED!"
