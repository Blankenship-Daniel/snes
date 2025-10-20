#!/bin/bash

# Continuous Zelda 3 Gameplay - Single Session
# Runs everything in one continuous emulator session

set -e

echo "🎮 Zelda 3 - Continuous Automated Gameplay"
echo "═══════════════════════════════════════════"
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

ROM="${1:-repos/snes-modder/zelda3-rich-start-999.smc}"
OUTPUT_DIR="${OUTPUT_DIR:-output}"

# Create output directories
mkdir -p "$OUTPUT_DIR"

# Check if bsnes exists
if ! command -v "$BSNES" >/dev/null 2>&1; then
    echo "❌ Error: bsnes not found at '$BSNES'"
    exit 1
fi

# Check if ROM exists
if [ ! -f "$ROM" ]; then
    echo "❌ Error: ROM not found: $ROM"
    exit 1
fi

echo "📁 ROM: $ROM"
echo "📊 Output: $OUTPUT_DIR"
echo ""

# Build input sequence for continuous gameplay
# We'll inject inputs at specific frame intervals

echo "🎬 Building input sequence..."
echo ""

# Frame timing for Zelda 3 intro:
# 0-180:     Boot + title screen
# 180:       Press Start (enter file select)
# 240:       Press A (select new game)
# 300:       Press A (confirm)
# 400-1200:  Intro cutscene (trying to skip with Start)
# 1200-2000: Gameplay starts - Link in bed
# 2000+:     Free exploration

echo "📋 Planned Input Sequence:"
echo "  Frame    0: Boot"
echo "  Frame  180: Press Start (title screen)"
echo "  Frame  240: Press A (file select)"
echo "  Frame  300: Press A (confirm name)"
echo "  Frame  400: Press Start (skip intro)"
echo "  Frame  600: Press Start (skip more)"
echo "  Frame  800: Press Start (keep trying)"
echo "  Frame 1200: Hold Down (get out of bed)"
echo "  Frame 1300: Hold Down (move down)"
echo "  Frame 1400: Hold Right (explore)"
echo "  Frame 1500: Hold Up (explore)"
echo "  Frame 1600: Hold Left (explore)"
echo "  Frame 1700: Hold Down (find door)"
echo "  Frame 1900: Hold Down (exit room)"
echo "  Frame 2100: Hold Down (explore house)"
echo "  Frame 2300: Hold Down (find exit)"
echo "  Frame 2500: Hold Down (exit house)"
echo "  Frame 2700: Hold Up (walk to castle)"
echo "  Frame 3000: Hold Up (continue to castle)"
echo "  Frame 3300: Hold Up (approach castle)"
echo "  Frame 3600: Hold Up (enter castle)"
echo ""

# Total frames to run
TOTAL_FRAMES=4000

# Run single continuous session with all inputs
echo "▶️  Running continuous gameplay ($TOTAL_FRAMES frames = ~66 seconds)..."
echo "   This will take about 1-2 minutes depending on your system..."
echo ""

"$BSNES" "$ROM" \
  --run-frames $TOTAL_FRAMES \
  --ai-controller \
  --input-command "p1_press_start@180" \
  --input-command "p1_press_a@240" \
  --input-command "p1_press_a@300" \
  --input-command "p1_press_start@400" \
  --input-command "p1_press_start@600" \
  --input-command "p1_press_start@800" \
  --input-command "p1_hold_down@1200-1299" \
  --input-command "p1_hold_down@1300-1399" \
  --input-command "p1_hold_right@1400-1499" \
  --input-command "p1_hold_up@1500-1599" \
  --input-command "p1_hold_left@1600-1699" \
  --input-command "p1_hold_down@1700-1899" \
  --input-command "p1_hold_down@1900-2099" \
  --input-command "p1_hold_down@2100-2299" \
  --input-command "p1_hold_down@2300-2499" \
  --input-command "p1_hold_down@2500-2699" \
  --input-command "p1_hold_up@2700-2999" \
  --input-command "p1_hold_up@3000-3299" \
  --input-command "p1_hold_up@3300-3599" \
  --input-command "p1_hold_up@3600-3999" \
  --dump-wram "0x7EF360:64:$OUTPUT_DIR/final-memory.bin" \
  --trace-cpu "$OUTPUT_DIR/gameplay-trace.log" \
  > "$OUTPUT_DIR/gameplay-output.log" 2>&1

echo "✅ Gameplay complete!"
echo ""

# Check if files were created
if [ ! -f "$OUTPUT_DIR/gameplay-output.log" ]; then
    echo "❌ Error: No output log created"
    echo "bsnes may have crashed or failed to run"
    exit 1
fi

echo "════════════════════════════════════════"
echo "📊 Results"
echo "════════════════════════════════════════"
echo ""

# Show emulator output
echo "📝 Emulator Output:"
cat "$OUTPUT_DIR/gameplay-output.log" | sed 's/^/   /'
echo ""

# Analyze final memory state
if [ -f "$OUTPUT_DIR/final-memory.bin" ]; then
    echo "💾 Final Memory State (64 bytes from 0x7EF360):"
    xxd -l 64 "$OUTPUT_DIR/final-memory.bin" | sed 's/^/   /'
    echo ""

    if command -v od &> /dev/null; then
        echo "💰 Parsed Game State:"
        # Read rupees (bytes 0-1, little-endian)
        RUPEES=$(od -An -t u2 -N 2 "$OUTPUT_DIR/final-memory.bin" | tr -d ' ')
        echo "   Rupees: $RUPEES"

        # Read health (byte 13 in the dump, offset 0xD from 0x7EF360)
        # 0x7EF360 + 0xD = 0x7EF36D (link_health_current)
        if [ -s "$OUTPUT_DIR/final-memory.bin" ]; then
            HEALTH=$(od -An -t u1 -j 13 -N 1 "$OUTPUT_DIR/final-memory.bin" | tr -d ' ')
            echo "   Health: $HEALTH"
        fi
    fi
fi

echo ""
echo "📁 Output Files:"
echo "   Gameplay log: $OUTPUT_DIR/gameplay-output.log"
echo "   CPU trace:    $OUTPUT_DIR/gameplay-trace.log"
echo "   Memory dump:  $OUTPUT_DIR/final-memory.bin"
echo ""

echo "⏱️  Total Gameplay:"
echo "   Frames:  $TOTAL_FRAMES"
echo "   Time:    $((TOTAL_FRAMES / 60)) seconds (at 60 FPS)"
echo ""

echo "✨ Analysis complete!"
echo ""
echo "🎮 To verify the game state:"
echo "   - Check if rupees are 999 (from Rich Start mod)"
echo "   - Look for non-zero memory values"
echo "   - Review CPU trace for game activity"
