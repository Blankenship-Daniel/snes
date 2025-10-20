#!/bin/bash

# Simple Zelda 3 Test - Just run the game and see what happens
set -e

echo "🎮 Zelda 3 - Simple Gameplay Test"
echo "═════════════════════════════════════"
echo ""

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

ROM="${1:-repos/snes-modder/zelda3-rich-start-999.smc}"
OUTPUT_DIR="${OUTPUT_DIR:-output}"

mkdir -p "$OUTPUT_DIR"

if ! command -v "$BSNES" >/dev/null 2>&1; then
    echo "❌ Error: bsnes not found at '$BSNES'"
    exit 1
fi

echo "📁 ROM: $ROM"
echo ""

# Test 1: Run for 3600 frames (60 seconds) with no input
# Just let the game run through attract mode/demos
echo "🎬 Test 1: Let game run for 60 seconds (no input)"
echo "   This should boot, show title screen, and possibly play attract mode..."
echo ""

"$BSNES" "$ROM" \
  --run-frames 3600 \
  --dump-wram "0x7EF360:128:$OUTPUT_DIR/test1-attract-mode.bin" \
  > "$OUTPUT_DIR/test1-output.log" 2>&1

echo "✅ Test 1 complete"
echo ""

# Analyze memory
if [ -f "$OUTPUT_DIR/test1-attract-mode.bin" ]; then
    echo "💾 Memory after attract mode (first 64 bytes):"
    xxd -l 64 "$OUTPUT_DIR/test1-attract-mode.bin" | sed 's/^/   /'
    echo ""

    # Check for any non-zero values
    NONZERO=$(xxd -l 128 "$OUTPUT_DIR/test1-attract-mode.bin" | grep -v "0000 0000 0000 0000" || echo "")
    if [ -n "$NONZERO" ]; then
        echo "✅ Found non-zero memory values (game is running!):"
        echo "$NONZERO" | sed 's/^/   /'
    else
        echo "❌ All zeros - game may not have initialized yet"
    fi
fi

echo ""
echo "════════════════════════════════════════"
echo ""

# Test 2: Run REALLY long (10800 frames = 3 minutes)
# This should be enough for intro cutscenes to finish
echo "🎬 Test 2: Run for 3 minutes (10800 frames)"
echo "   Letting all intros/cutscenes complete..."
echo ""

"$BSNES" "$ROM" \
  --run-frames 10800 \
  --dump-wram "0x7EF000:1024:$OUTPUT_DIR/test2-long-run.bin" \
  > "$OUTPUT_DIR/test2-output.log" 2>&1

echo "✅ Test 2 complete"
echo ""

# Analyze memory - look at different offsets
if [ -f "$OUTPUT_DIR/test2-long-run.bin" ]; then
    echo "💾 Memory Analysis (1KB dump from $7EF000):"
    echo ""

    # Check rupee area (offset 0x360 in the dump)
    echo "   📍 Rupee area (offset 0x360-0x363):"
    xxd -s 0x360 -l 16 "$OUTPUT_DIR/test2-long-run.bin" | sed 's/^/     /'
    echo ""

    # Check game mode (if we can find it)
    echo "   📍 Start of save data (offset 0x0-0x20):"
    xxd -s 0 -l 32 "$OUTPUT_DIR/test2-long-run.bin" | sed 's/^/     /'
    echo ""

    # Parse rupees if possible
    if command -v od &> /dev/null; then
        # Rupees are at offset 0x360 in our dump
        RUPEES=$(od -An -t u2 -j $((0x360)) -N 2 "$OUTPUT_DIR/test2-long-run.bin" | tr -d ' ')
        echo "   💰 Rupees at 0x7EF360: $RUPEES"

        if [ "$RUPEES" -eq 999 ] || [ "$RUPEES" -eq 500 ] || [ "$RUPEES" -eq 777 ]; then
            echo "   ✅ SUCCESS! Rich Start mod is working!"
            echo "   🎮 Game has initialized with modified rupee count!"
        elif [ "$RUPEES" -eq 0 ]; then
            echo "   ⚠️  Rupees are 0 - game may not have started yet"
        else
            echo "   ❓ Unexpected rupee value: $RUPEES"
        fi
    fi
fi

echo ""
echo "════════════════════════════════════════"
echo "✨ Testing complete!"
echo ""
echo "📁 Output files:"
ls -lh "$OUTPUT_DIR"/*.bin "$OUTPUT_DIR"/*.log | sed 's/^/   /'
