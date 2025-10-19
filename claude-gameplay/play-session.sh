#!/bin/bash
# Claude's Zelda 3 Gameplay Session
# This script plays through the game opening and explores

# Resolve repo root relative to this script to avoid absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Allow override via $ROM; default to repo-local base ROM
ROM="${ROM:-$REPO_ROOT/zelda3.smc}"
FRAMES_PER_SECOND=60

echo "=== CLAUDE PLAYS ZELDA 3 ==="
echo "Starting gameplay session..."
echo

# PHASE 1: Navigate Title Screen
echo "[PHASE 1] Waiting for title screen..."
bsnes-cli "$ROM" --run-frames 180 2>&1 | grep -E "(Loaded|Completed)"

echo "[PHASE 1] Pressing Start to enter file select..."
bsnes-cli "$ROM" --run-frames 240 --ai-controller --input-command p1_press_start 2>&1 | grep -E "(Start|Completed)"

# PHASE 2: File Select
echo
echo "[PHASE 2] At file select menu, selecting File 1..."
bsnes-cli "$ROM" --run-frames 300 \
  --ai-controller --input-command p1_press_start \
  2>&1 | grep -E "(Controller|Completed)"

echo "[PHASE 2] Pressing A to start new game..."
bsnes-cli "$ROM" --run-frames 360 \
  --ai-controller --input-command p1_press_a \
  2>&1 | grep -E "(pressed|Completed)"

# PHASE 3: Wait for intro cutscene
echo
echo "[PHASE 3] Watching intro cutscene (10 seconds)..."
bsnes-cli "$ROM" --run-frames 600 2>&1 | grep "Completed"

# PHASE 4: Check game state after intro
echo
echo "[PHASE 4] Checking game state..."
bsnes-cli "$ROM" --run-frames 1200 \
  --dump-wram 0x7EF360:2:rupees.bin \
  --dump-wram 0x7EF36D:1:health.bin \
  --dump-wram 0x7E00A0:2:room.bin \
  2>&1 | grep -E "(Completed|Dumped)"

# Read and display game state
if [ -f rupees.bin ]; then
  echo
  echo "=== GAME STATE ==="
  echo -n "Rupees: "
  xxd -p rupees.bin | tr -d '\n' && echo
  echo -n "Health: "
  xxd -p health.bin | tr -d '\n' && echo
  echo -n "Room: "
  xxd -p room.bin | tr -d '\n' && echo
fi

echo
echo "=== SESSION COMPLETE ==="
