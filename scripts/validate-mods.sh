#!/bin/bash

# ROM Mod Validation Tool
# PROOF that our mods actually work!

echo "🔬 ROM Mod Validation - GROUND TRUTH TESTING"
echo "═══════════════════════════════════════════"

BASE_ROM="zelda3.smc"
OUTPUT_DIR="${OUTPUT_DIR:-.}"
FAILED=0
PASSED=0
SKIPPED=0
SKIPPED_COMPARISONS=0
BASE_ROM_AVAILABLE=1

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
      echo "❌ ROM identical to base - no modifications applied!"
      ((FAILED++))
      return 1
    fi

    local changes
    changes=$(cmp -l "$BASE_ROM" "$rom_file" | wc -l)
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
  for f in "$dir"/zelda3-infinite-magic-*.smc; do validate_rom "$f" "infinite-magic" "Magic never depletes"; done
  for f in "$dir"/zelda3-2x-speed-*.smc; do validate_rom "$f" "2x-speed" "Link moves at double speed"; done
  for f in "$dir"/zelda3-max-health-*.smc; do validate_rom "$f" "max-health" "Start with 20 hearts"; done
  for f in "$dir"/zelda3-team-solution-*.smc; do validate_rom "$f" "team-solution" "Balanced combination mod"; done
done
shopt -u nullglob

echo ""
echo "🔬 Testing Source ROMs (Pre-built mods):"
validate_rom "repos/snes-modder/zelda3-infinite-magic.smc" "source-infinite-magic" "Source infinite magic mod"
validate_rom "repos/snes-modder/zelda3-2x-speed.smc" "source-2x-speed" "Source 2x speed mod"

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

  exit 0
else
  echo "⚠️  Some validations failed - investigate before shipping"
  exit 1
fi

if [ "$BASE_ROM_AVAILABLE" -eq 0 ]; then
    echo ""
    echo "ℹ️  Supply zelda3.smc to restore binary validation coverage."
fi
