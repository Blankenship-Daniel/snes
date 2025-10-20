#!/bin/bash

# Automated Zelda 3 Gameplay Using bsnes Headless
# Attempts to play through the game using scripted inputs

set -e

echo "🎮 Zelda 3 - Automated Headless Gameplay"
echo "════════════════════════════════════════"
echo ""

# Configuration
BSNES_PATH="${BSNES_PATH:-bsnes}"
ROM="${1:-repos/snes-modder/zelda3-rich-start-999.smc}"
OUTPUT_DIR="${OUTPUT_DIR:-output}"
TRACE_DIR="$OUTPUT_DIR/traces"
MEMORY_DIR="$OUTPUT_DIR/memory"

# Create output directories
mkdir -p "$TRACE_DIR"
mkdir -p "$MEMORY_DIR"

# Check if bsnes exists
if ! command -v "$BSNES_PATH" &> /dev/null; then
    echo "❌ Error: bsnes not found at '$BSNES_PATH'"
    echo "Set BSNES_PATH environment variable to bsnes binary location"
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

# Memory addresses (from zelda3/src/variables.h)
RUPEES_ADDR="0x7EF360"      # link_rupees_goal
HEALTH_ADDR="0x7EF36D"      # link_health_current (1 byte)
ROOM_ADDR="0x7E00A0"        # dungeon_room_index
LINK_X="0x7E0022"           # link_x_coord
LINK_Y="0x7E0020"           # link_y_coord
GAME_MODE="0x7E0010"        # main_module_index

play_sequence() {
    local sequence_name="$1"
    local frames="$2"
    shift 2
    local inputs=("$@")

    echo "🎬 Sequence: $sequence_name ($frames frames)"

    local cmd=("$BSNES_PATH" "$ROM" "--run-frames" "$frames")

    # Add AI controller if we have inputs
    if [ ${#inputs[@]} -gt 0 ]; then
        cmd+=("--ai-controller")
        for input in "${inputs[@]}"; do
            cmd+=("--input-command" "$input")
        done
    fi

    # Add memory dumps
    cmd+=("--dump-wram" "${RUPEES_ADDR}:32:${MEMORY_DIR}/${sequence_name}-wram.bin")
    cmd+=("--trace-cpu" "${TRACE_DIR}/${sequence_name}-cpu.log")

    echo "  Inputs: ${inputs[*]:-none}"
    echo "  Running..."

    # Run the sequence
    "${cmd[@]}" > "${TRACE_DIR}/${sequence_name}-output.log" 2>&1

    # Show memory state if dump exists
    if [ -f "${MEMORY_DIR}/${sequence_name}-wram.bin" ]; then
        echo "  Memory state:"
        xxd -l 32 "${MEMORY_DIR}/${sequence_name}-wram.bin" | head -2 | sed 's/^/    /'
    fi

    echo "  ✓ Complete"
    echo ""
}

echo "════════════════════════════════════════"
echo "🎮 Starting Automated Gameplay"
echo "════════════════════════════════════════"
echo ""

# Phase 1: Boot and Title Screen (60 frames)
play_sequence "01-boot" 60

# Phase 2: Wait for title screen to fully load (120 frames)
play_sequence "02-title-screen" 120

# Phase 3: Press Start to enter file select (30 frames)
play_sequence "03-press-start" 30 "p1_press_start"

# Phase 4: Wait for file select screen (60 frames)
play_sequence "04-file-select" 60

# Phase 5: Select "New Game" (press A on empty file slot)
play_sequence "05-new-game-select" 30 "p1_press_a"

# Phase 6: Confirm name/start game (60 frames)
play_sequence "06-confirm-start" 60 "p1_press_a"

# Phase 7: Intro cutscene - wait it out or try to skip
# The intro cutscene is long, let's try pressing start to skip
play_sequence "07-intro-cutscene" 300 "p1_press_start"

# Phase 8: More intro waiting
play_sequence "08-intro-continue" 300

# Phase 9: First gameplay - Link wakes up in bed
# Try pressing down to get out of bed
play_sequence "09-wake-up" 60 "p1_hold_down"

# Phase 10: Move Link around the room
play_sequence "10-explore-room-down" 30 "p1_hold_down"
play_sequence "11-explore-room-right" 30 "p1_hold_right"
play_sequence "12-explore-room-up" 30 "p1_hold_up"
play_sequence "13-explore-room-left" 30 "p1_hold_left"

# Phase 11: Try to find and open the door (usually requires walking down)
play_sequence "14-find-door" 60 "p1_hold_down"

# Phase 12: Exit the room (walk down)
play_sequence "15-exit-room" 60 "p1_hold_down"

# Phase 13: Explore the house
play_sequence "16-explore-house-1" 60 "p1_hold_down"
play_sequence "17-explore-house-2" 60 "p1_hold_left"

# Phase 14: Try to exit the house (find main door)
play_sequence "18-find-exit" 60 "p1_hold_down"
play_sequence "19-exit-house" 60 "p1_hold_down"

# Phase 15: Outside! Explore Hyrule
play_sequence "20-outside-explore-1" 120 "p1_hold_down"
play_sequence "21-outside-explore-2" 120 "p1_hold_right"
play_sequence "22-outside-explore-3" 120 "p1_hold_up"
play_sequence "23-outside-explore-4" 120 "p1_hold_left"

# Phase 16: Walk towards castle (usually up)
play_sequence "24-walk-to-castle-1" 180 "p1_hold_up"
play_sequence "25-walk-to-castle-2" 180 "p1_hold_up"

# Phase 17: Approach castle entrance
play_sequence "26-castle-approach" 120 "p1_hold_up"

# Phase 18: Enter castle
play_sequence "27-enter-castle" 60 "p1_hold_up"

# Phase 19: Navigate castle interior
play_sequence "28-castle-interior-1" 120 "p1_hold_up"
play_sequence "29-castle-interior-2" 120 "p1_hold_right"
play_sequence "30-castle-interior-3" 120 "p1_hold_down"

echo "════════════════════════════════════════"
echo "📊 Gameplay Statistics"
echo "════════════════════════════════════════"

# Calculate total frames
TOTAL_FRAMES=$((60 + 120 + 30 + 60 + 30 + 60 + 300 + 300 + 60 + 30 + 30 + 30 + 30 + 60 + 60 + 60 + 60 + 60 + 60 + 120 + 120 + 120 + 120 + 180 + 180 + 120 + 60 + 120 + 120 + 120))
TOTAL_SECONDS=$((TOTAL_FRAMES / 60))
TOTAL_MINUTES=$((TOTAL_SECONDS / 60))
REMAINING_SECONDS=$((TOTAL_SECONDS % 60))

echo ""
echo "⏱️  Total Gameplay Time:"
echo "   Frames:  $TOTAL_FRAMES frames"
echo "   Time:    ${TOTAL_MINUTES}m ${REMAINING_SECONDS}s (at 60 FPS)"
echo ""

echo "📁 Output Files:"
echo "   Traces:  $TRACE_DIR/"
echo "   Memory:  $MEMORY_DIR/"
echo ""

# Analyze the final memory state
FINAL_MEMORY="${MEMORY_DIR}/30-castle-interior-3-wram.bin"
if [ -f "$FINAL_MEMORY" ]; then
    echo "💾 Final Memory State:"
    echo "   Location: $FINAL_MEMORY"
    echo ""

    if command -v od &> /dev/null; then
        # Try to read rupees (first 2 bytes, little-endian)
        RUPEES=$(od -An -t u2 -N 2 "$FINAL_MEMORY" | tr -d ' ')
        echo "   💰 Rupees: $RUPEES"
    fi

    echo ""
    echo "   First 32 bytes:"
    xxd -l 32 "$FINAL_MEMORY" | sed 's/^/     /'
fi

echo ""
echo "════════════════════════════════════════"
echo "✨ Automated gameplay complete!"
echo ""
echo "🎮 Game Progress:"
echo "   ✓ Booted game"
echo "   ✓ Navigated title screen"
echo "   ✓ Started new game"
echo "   ? Intro cutscene (attempted skip)"
echo "   ? Woke up in Link's house"
echo "   ? Explored and exited house"
echo "   ? Walked towards castle"
echo "   ? Attempted castle entry"
echo ""
echo "📝 Next Steps:"
echo "   - Review CPU traces in $TRACE_DIR/"
echo "   - Analyze memory dumps in $MEMORY_DIR/"
echo "   - Check game progression"
echo "   - Refine input sequences for better navigation"
