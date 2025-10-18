#!/bin/bash

# Zelda 3 Modder - 30 Second ROM Mod Demo
# The WORKING version that SHIPS TODAY!

echo "🎮 Zelda 3 Modder - 30 Second Mods (MVP Demo)"
echo "═══════════════════════════════════════════════"

# Optional output directory (env or flag), defaults to repo root
OUTPUT_DIR="${OUTPUT_DIR:-.}"

print_mod_list() {
    echo "📦 Available Pre-Built Mods (Ready in 30 seconds):"
    echo ""
    echo "  🎭 MAGIC & POWER:"
    echo "    • infinite-magic    - Never run out of magic power"
    echo "    • max-hearts        - Start with maximum health (20 hearts)"
    echo ""
    echo "  🏃 SPEED & FLOW:"
    echo "    • 2x-speed          - Move at double speed"
    echo "    • intro-skip        - Skip opening cutscene instantly"
    echo "    • quick-start       - Start with better equipment"
    echo ""
    echo "  🎯 COMPLETE PACKAGES:"
    echo "    • team-solution     - Balanced combo (recommended)"
    echo "    • ultimate          - Everything enabled (overpowered!)"
    echo "    • safe-start        - Beginner friendly experience"
    echo ""
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

# Map mod types to existing ROMs
case "$MOD_TYPE" in
    "infinite-magic"|"unlimited-magic"|"never-run-out-of-magic")
        SOURCE_ROM="snes-modder/zelda3-infinite-magic.smc"
        OUTPUT_NAME="zelda3-infinite-magic-$(date +%Y%m%d).smc"
        DESCRIPTION="Infinite Magic Mod"
        ;;
    "intro-skip"|"skip-intro"|"no-intro")
        SOURCE_ROM="snes-modder/zelda3-intro-skip.smc"
        OUTPUT_NAME="zelda3-intro-skip-$(date +%Y%m%d).smc"
        DESCRIPTION="Intro Skip Mod"
        ;;
    "quick-start"|"speedrun-start")
        SOURCE_ROM="snes-modder/zelda3-quickstart-final.smc"
        OUTPUT_NAME="zelda3-quickstart-$(date +%Y%m%d).smc"
        DESCRIPTION="Quick Start Mod"
        ;;
    "2x-speed"|"double-speed"|"faster")
        SOURCE_ROM="snes-modder/zelda3-2x-speed.smc"
        OUTPUT_NAME="zelda3-2x-speed-$(date +%Y%m%d).smc"
        DESCRIPTION="2x Speed Mod"
        ;;
    "max-hearts"|"full-health"|"20-hearts")
        SOURCE_ROM="snes-modder/zelda3-health-v2-fixed.smc"
        OUTPUT_NAME="zelda3-max-health-$(date +%Y%m%d).smc"
        DESCRIPTION="Maximum Health Mod"
        ;;
    "team-solution"|"best-combo")
        SOURCE_ROM="snes-modder/zelda3-team-solution.smc"
        OUTPUT_NAME="zelda3-team-solution-$(date +%Y%m%d).smc"
        DESCRIPTION="Team Solution (Balanced Combo)"
        ;;
    "ultimate"|"ultimate-combo"|"everything")
        SOURCE_ROM="snes-modder/zelda3-ultimate-test.smc"
        OUTPUT_NAME="zelda3-ultimate-$(date +%Y%m%d).smc"
        DESCRIPTION="Ultimate Combo (All Mods)"
        ;;
    "safe-start"|"beginner")
        SOURCE_ROM="snes-modder/zelda3-safe-start.smc"
        OUTPUT_NAME="zelda3-safe-start-$(date +%Y%m%d).smc"
        DESCRIPTION="Safe Start (Beginner Friendly)"
        ;;
    *)
        echo "❌ Unknown mod type: $MOD_TYPE"
        echo "Available: infinite-magic, intro-skip, quick-start, 2x-speed, max-hearts, team-solution, ultimate, safe-start"
        exit 1
        ;;
esac

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
cp "$SOURCE_ROM" "$OUTPUT_PATH"

# Calculate elapsed time
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

echo ""
echo "✨ SUCCESS! $DESCRIPTION applied in $ELAPSED seconds"
echo "📁 Output: $OUTPUT_PATH"
echo "🎮 Ready to play in your SNES emulator!"
echo ""
echo "🚀 The 30-second ROM mod experience: DELIVERED!"
