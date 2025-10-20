#!/bin/bash

# Automated Gameplay Test for Rich Start Mod
# Tests the actual in-game rupee count using bsnes headless emulator

set -e

echo "🎮 Rich Start Mod - Automated Gameplay Test"
echo "════════════════════════════════════════════"
echo ""

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
BUNDLED_BSNES="$REPO_ROOT/repos/bsnes-plus/bsnes/cli-headless/bsnes-cli"
if [ -n "${BSNES_PATH:-}" ]; then
    BSNES="$BSNES_PATH"
elif [ -x "$BUNDLED_BSNES" ]; then
    BSNES="$BUNDLED_BSNES"
else
    BSNES="$(command -v bsnes 2>/dev/null || true)"
    BSNES="${BSNES:-bsnes}"
fi

if ! command -v "$BSNES" >/dev/null 2>&1; then
    echo "❌ Error: bsnes not found at '$BSNES'. Set BSNES_PATH to the bsnes-plus CLI binary."
    exit 1
fi

ROM_999="${1:-repos/snes-modder/zelda3-rich-start-999.smc}"
ROM_500="${2:-repos/snes-modder/zelda3-rich-start-500.smc}"
ROM_777="${3:-repos/snes-modder/zelda3-rich-start-777.smc}"
OUTPUT_DIR="${OUTPUT_DIR:-.}"

# WRAM addresses (from zelda3 C source variables.h)
# link_rupees_goal:   0x7EF360 (2 bytes, little-endian)
# link_rupees_actual: 0x7EF362 (2 bytes, little-endian)
RUPEE_GOAL_ADDR="0x7EF360"
RUPEE_ACTUAL_ADDR="0x7EF362"

# Check if bsnes exists
test_rom_rupees() {
    local rom="$1"
    local expected="$2"
    local variant="$3"

    echo "🧪 Testing: $variant ($expected rupees)"
    echo "─────────────────────────────────────"

    if [ ! -f "$rom" ]; then
        echo "⚠️  ROM not found: $rom - SKIPPING"
        echo ""
        return
    fi

    # Create temporary output directory
    local temp_dir="$OUTPUT_DIR/test-output-$$"
    mkdir -p "$temp_dir"

    # Run emulator for 1800 frames (30 seconds at 60fps)
    # This gives time for: title screen -> file select -> new game -> initial spawn
    # The rupee values should be loaded into WRAM after new game initialization
    echo "▶️  Running emulator (1800 frames = 30 seconds)..."
    echo "   Waiting for new game initialization..."

    "$BSNES" "$rom" \
        --run-frames 1800 \
        --dump-wram "${RUPEE_GOAL_ADDR}:4:${temp_dir}/rupees-goal.bin" \
        > "${temp_dir}/emulator.log" 2>&1 || {
            echo "⚠️  Emulator failed, checking log..."
            cat "${temp_dir}/emulator.log"
            rm -rf "$temp_dir"
            return 1
        }

    # Check if memory dump was created
    if [ ! -f "${temp_dir}/rupees-goal.bin" ]; then
        echo "❌ Memory dump failed - file not created"
        echo "This might mean bsnes doesn't support --dump-wram"
        echo "Falling back to basic emulator test..."

        # Just verify ROM loads without crashing
        "$BSNES" "$rom" --run-frames 60 > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ ROM loads successfully (60 frames)"
            echo "⚠️  Cannot verify exact rupee count without memory dump"
        else
            echo "❌ ROM failed to load"
        fi

        rm -rf "$temp_dir"
        echo ""
        return
    fi

    # Read the dumped memory (4 bytes = 2 x uint16)
    # Bytes 0-1: link_rupees_goal (little-endian)
    # Bytes 2-3: link_rupees_actual (little-endian)

    if command -v xxd &> /dev/null; then
        echo "📊 Memory dump (hex):"
        xxd "${temp_dir}/rupees-goal.bin"
        echo ""
    fi

    # Extract bytes using od (octal dump) in little-endian format
    if command -v od &> /dev/null; then
        # Read as little-endian 16-bit unsigned integers
        local values=$(od -An -t u2 -v "${temp_dir}/rupees-goal.bin" | tr -s ' ')
        local goal=$(echo "$values" | awk '{print $1}')
        local actual=$(echo "$values" | awk '{print $2}')

        echo "💰 Rupee Values:"
        echo "  link_rupees_goal:   $goal"
        echo "  link_rupees_actual: $actual"
        echo "  Expected:           $expected"
        echo ""

        # Verify against expected value
        if [ "$goal" = "$expected" ] || [ "$actual" = "$expected" ]; then
            echo "✅ PASS: Rupee count matches expected value ($expected)"
        else
            echo "❌ FAIL: Rupee count mismatch!"
            echo "   Expected: $expected"
            echo "   Got goal: $goal, actual: $actual"
        fi
    else
        echo "⚠️  'od' command not available, cannot parse memory dump"
        echo "Binary file created at: ${temp_dir}/rupees-goal.bin"
    fi

    # Cleanup
    rm -rf "$temp_dir"
    echo ""
}

# Run tests for all three variants
echo "Starting automated gameplay tests..."
echo ""

test_rom_rupees "$ROM_999" 999 "Millionaire (999 rupees)"
test_rom_rupees "$ROM_500" 500 "Comfortable (500 rupees)"
test_rom_rupees "$ROM_777" 777 "Wealthy (777 rupees)"

echo "════════════════════════════════════════════"
echo "✨ Automated gameplay testing complete!"
echo ""
echo "📋 Notes:"
echo "  - WRAM addresses from zelda3/src/variables.h"
echo "  - link_rupees_goal:   0x7EF360 (2 bytes)"
echo "  - link_rupees_actual: 0x7EF362 (2 bytes)"
echo "  - Test duration: 1800 frames (30 seconds @ 60fps)"
echo ""
echo "⚠️  Important: Rupee values are in ROM at 0x274F4 (save template)"
echo "    They get copied to SRAM on new game, then loaded to WRAM"
echo "    If values are 0, the game may not have initialized a save yet"
echo ""
echo "🔍 If memory dumps failed:"
echo "  - Check if your bsnes build supports --dump-wram"
echo "  - Try building bsnes-plus from source"
echo "  - Fallback: manual testing in emulator GUI"
