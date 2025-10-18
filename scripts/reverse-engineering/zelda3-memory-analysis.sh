#!/bin/bash
# Zelda 3 Memory Analysis Script
# Automated memory dumping and analysis using bsnes-cli headless emulator

set -e

# Configuration
BSNES_CLI="bsnes-plus/bsnes/cli-headless/bsnes-cli"
ROM="zelda3.smc"
OUTPUT_DIR="output/memory-analysis"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Zelda 3 Memory Analysis${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Check if ROM exists
if [ ! -e "$ROM" ]; then
    echo -e "${YELLOW}Error: ROM file not found: $ROM${NC}"
    echo "Please ensure zelda3.smc exists or create symlink:"
    echo "  ln -s snes-modder/.rom-backups/zelda3-original.smc zelda3.smc"
    exit 1
fi

echo -e "${GREEN}✓${NC} ROM: $ROM"
echo -e "${GREEN}✓${NC} Emulator: $BSNES_CLI"
echo

# =============================================================================
# Example 1: Startup Memory State
# =============================================================================
echo -e "${BLUE}[1] Capturing startup WRAM (128KB)...${NC}"

$BSNES_CLI "$ROM" --run-frames 60 \
  --dump-wram 0:131072:"$OUTPUT_DIR/wram_startup.bin"

echo -e "${GREEN}✓${NC} Dumped WRAM startup state"
echo

# =============================================================================
# Example 2: Key Game Variables
# =============================================================================
echo -e "${BLUE}[2] Dumping known Zelda 3 game variables...${NC}"

# Known memory locations (WRAM offsets from $7E0000)
# Format: "name|offset|size"
ZELDA_VARS="
magic_meter|F36E|2
health|F36D|1
rupees|F360|2
arrows|F377|1
bombs|F375|1
"

echo "$ZELDA_VARS" | grep -v "^$" | while IFS="|" read -r var_name offset size; do
    [ -z "$var_name" ] && continue

    # Convert hex offset to decimal
    offset_dec=$((0x$offset))

    $BSNES_CLI "$ROM" --run-frames 180 \
      --dump-wram $offset_dec:$size:"$OUTPUT_DIR/var_${var_name}.bin"

    # Display hex value
    hex_value=$(hexdump -v -e '1/1 "%02X "' "$OUTPUT_DIR/var_${var_name}.bin")
    echo -e "  ${var_name}: ${hex_value}(WRAM offset \$$offset)"
done

echo -e "${GREEN}✓${NC} Dumped all key game variables"
echo

# =============================================================================
# Example 3: After Extended Gameplay
# =============================================================================
echo -e "${BLUE}[3] Capturing WRAM after 5 seconds of gameplay...${NC}"

$BSNES_CLI "$ROM" --run-frames 300 \
  --dump-wram 0:131072:"$OUTPUT_DIR/wram_after_gameplay.bin"

echo -e "${GREEN}✓${NC} Dumped WRAM after gameplay"
echo

# =============================================================================
# Example 4: Memory Comparison
# =============================================================================
echo -e "${BLUE}[4] Comparing startup vs after-gameplay memory...${NC}"

if command -v cmp &> /dev/null; then
    echo "First 20 memory differences:"
    cmp -l "$OUTPUT_DIR/wram_startup.bin" "$OUTPUT_DIR/wram_after_gameplay.bin" 2>/dev/null | \
        head -20 | \
        awk '{printf "  WRAM offset 0x%05X: 0x%02X → 0x%02X (CPU \$7E%05X)\n", $1-1, strtonum("0"$2), strtonum("0"$3), $1-1}' || true

    total_diffs=$(cmp -l "$OUTPUT_DIR/wram_startup.bin" "$OUTPUT_DIR/wram_after_gameplay.bin" 2>/dev/null | wc -l || echo "0")
    echo -e "${GREEN}✓${NC} Found $total_diffs changed bytes total"
else
    echo -e "${YELLOW}Note: Install 'cmp' for memory comparison${NC}"
fi

echo

# =============================================================================
# Summary
# =============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Analysis Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo
echo "Output directory: $OUTPUT_DIR"
echo
echo "Generated files:"
ls -lh "$OUTPUT_DIR" 2>/dev/null | tail -n +2 | awk '{printf "  %-30s %s\n", $9, $5}' || true
echo
echo -e "${GREEN}Next steps:${NC}"
echo "  1. Analyze memory dumps with hex editor (hexdump, xxd, or Hex Fiend)"
echo "  2. Compare dumps to find variable locations"
echo "  3. Use zelda3-disasm MCP to search for code that modifies these addresses"
echo "  4. Cross-reference with zelda3 C source for game logic"
echo
echo "Example commands:"
echo "  hexdump -C $OUTPUT_DIR/wram_startup.bin | less"
echo "  xxd $OUTPUT_DIR/var_magic_meter.bin"
echo
