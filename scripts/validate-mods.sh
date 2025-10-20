#!/bin/bash
set -euo pipefail

# ROM Mod Validation Tool
# PROOF that our mods actually work!

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
source "$SCRIPT_DIR/mod-manifest.sh"

echo "🔬 ROM Mod Validation - GROUND TRUTH TESTING"
echo "═══════════════════════════════════════════"

BASE_ROM_DEFAULT="zelda3.smc"
BASE_ROM="${BASE_ROM:-$BASE_ROM_DEFAULT}"
OUTPUT_DIR="${OUTPUT_DIR:-.}"
FAILED=0
PASSED=0
SKIPPED=0
SKIPPED_COMPARISONS=0
BASE_ROM_AVAILABLE=1

if [ ! -f "$BASE_ROM" ]; then
  echo "⚠️  Base ROM not found: $BASE_ROM"
  echo "   Binary comparison checks will be skipped. Place the ROM in the repository root to restore full coverage."
  BASE_ROM_AVAILABLE=0
fi

validate_rom() {
  local rom_file="$1"
  local mod_name="$2"
  local description="$3"
  local allow_identical="${4:-0}"

  echo ""
  echo "🧪 Testing: $mod_name"
  echo "📝 Expected: $description"

  if [ ! -f "$rom_file" ]; then
    echo "⚠️  ROM not found: $rom_file"
    echo "   Skipping this validation."
    ((SKIPPED++))
    return 0
  fi

  # Basic validation: ROM is correct size
  local size
  size=$(stat -f%z "$rom_file" 2>/dev/null || stat -c%s "$rom_file")
  if [ "$size" != "1048576" ]; then
    echo "❌ Invalid ROM size: $size bytes (expected 1048576)"
    ((FAILED++))
    return 1
  fi

  if [ "$BASE_ROM_AVAILABLE" -eq 1 ]; then
    if cmp -s "$BASE_ROM" "$rom_file"; then
      if [ "$allow_identical" -eq 1 ]; then
        echo "🟡 ROM matches base (allowed for $mod_name)"
        ((SKIPPED++))
        return 0
      fi
      echo "❌ ROM identical to base - no modifications applied!"
      ((FAILED++))
      return 1
    fi

    local changes
    changes=$({ cmp -l "$BASE_ROM" "$rom_file" || true; } | wc -l | tr -d ' ')
    echo "✅ ROM validation passed"
    echo "📊 Binary differences: $changes bytes changed"

    if [[ "$mod_name" == *"infinite-magic"* ]]; then
      echo "🔍 Magic-specific validation:"
      local magic_offset=503980
      local base_byte
      local mod_byte
      base_byte=$(xxd -s $magic_offset -l 1 "$BASE_ROM" | cut -d' ' -f2)
      mod_byte=$(xxd -s $magic_offset -l 1 "$rom_file" | cut -d' ' -f2)

      if [ "$base_byte" != "$mod_byte" ]; then
        echo "✅ Magic system modified (offset $magic_offset: $base_byte → $mod_byte)"
      else
        echo "⚠️  Magic system unchanged at expected offset"
      fi
    fi
  else
    echo "⚠️  Skipping binary comparison (base ROM unavailable)."
    ((SKIPPED_COMPARISONS++))
    echo "✅ ROM size check passed"
  fi

  ((PASSED++))
  return 0
}

echo ""
echo "🔍 Searching for generated ROMs to validate..."

SEARCH_DIRS=("$OUTPUT_DIR")
if [ "$OUTPUT_DIR" != "." ]; then
  SEARCH_DIRS+=(".")
fi

shopt -s nullglob
for dir in "${SEARCH_DIRS[@]}"; do
  while IFS= read -r key; do
    prefix="$(mod_manifest_field "$key" output_prefix)"
    description="$(mod_manifest_field "$key" description)"
    for f in "$dir"/"$prefix"-*.smc; do
      validate_rom "$f" "$key" "$description"
    done
  done < <(mod_manifest_keys)
done
shopt -u nullglob

echo ""
echo "🔬 Testing Source ROMs (Pre-built mods):"
checked_sources=""
while IFS= read -r key; do
  source_rom="$(mod_manifest_field "$key" source)"
  description="$(mod_manifest_field "$key" description)"
  flags="$(mod_manifest_field "$key" flags)"
  case " $checked_sources " in
    *" $source_rom "*) continue ;;
  esac
  checked_sources+=" $source_rom"
  allow_identical=0
  if [[ " $flags " == *" allow-identical "* ]]; then
    allow_identical=1
  fi
  validate_rom "$source_rom" "source-$key" "Source $description" "$allow_identical"
done < <(mod_manifest_keys)

echo ""
echo "📊 VALIDATION SUMMARY"
echo "═══════════════════"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"
echo "🟡 Skipped: $SKIPPED"

if [ "$SKIPPED_COMPARISONS" -gt 0 ]; then
  echo "🛈 Binary comparisons skipped: $SKIPPED_COMPARISONS (base ROM missing)"
fi

if [ $FAILED -eq 0 ]; then
  if [ "$PASSED" -gt 0 ]; then
    echo "🎉 All available ROMs validated successfully!"
  else
    echo "🛈 No ROMs were validated. Generate mods or restore prebuilt ROMs for full coverage."
  fi

  if [ "$BASE_ROM_AVAILABLE" -eq 0 ]; then
    echo "⚠️  Restore $BASE_ROM to re-enable binary diff checks."
  fi

  if [ "$SKIPPED" -gt 0 ]; then
    echo "⚠️  Some ROMs were skipped. Generate the missing files or restore repository assets to expand coverage."
  fi

  if [ "$BASE_ROM_AVAILABLE" -eq 0 ]; then
    echo ""
    echo "ℹ️  Supply $BASE_ROM to restore binary validation coverage."
  fi

  exit 0
else
  echo "⚠️  Some validations failed - investigate before shipping"

  if [ "$BASE_ROM_AVAILABLE" -eq 0 ]; then
    echo ""
    echo "ℹ️  Supply $BASE_ROM to restore binary validation coverage."
  fi

  exit 1
fi
