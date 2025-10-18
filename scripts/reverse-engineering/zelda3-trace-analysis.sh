#!/bin/bash
# Zelda 3 CPU Trace Analysis Script
# Automated execution tracing and hotspot analysis

set -e

# Configuration
BSNES_CLI="bsnes-plus/bsnes/cli-headless/bsnes-cli"
ROM="zelda3.smc"
OUTPUT_DIR="output/trace-analysis"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Zelda 3 CPU Trace Analysis${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Check dependencies
if [ ! -f "$ROM" ]; then
    echo -e "${YELLOW}Error: ROM file not found: $ROM${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} ROM: $ROM"
echo

# =============================================================================
# Example 1: Basic CPU Trace (First 300 frames)
# =============================================================================
echo -e "${BLUE}[1] Capturing basic CPU trace (5 seconds)...${NC}"

$BSNES_CLI "$ROM" --headless --run-frames 300 \
  --trace-cpu \
  --trace-output "$OUTPUT_DIR/cpu_trace_basic.log"

echo -e "${GREEN}✓${NC} CPU trace saved to: $OUTPUT_DIR/cpu_trace_basic.log"

# Show sample
echo "Sample trace (first 10 lines):"
head -n 10 "$OUTPUT_DIR/cpu_trace_basic.log" | sed 's/^/  /'
echo

# =============================================================================
# Example 2: Masked Trace (Unique Addresses Only)
# =============================================================================
echo -e "${BLUE}[2] Capturing masked trace (unique addresses)...${NC}"

$BSNES_CLI "$ROM" --headless --run-frames 600 \
  --trace-cpu \
  --trace-mask \
  --trace-output "$OUTPUT_DIR/cpu_trace_masked.log"

echo -e "${GREEN}✓${NC} Masked trace saved (unique addresses only)"

basic_size=$(wc -l < "$OUTPUT_DIR/cpu_trace_basic.log")
masked_size=$(wc -l < "$OUTPUT_DIR/cpu_trace_masked.log")
echo "  Basic trace: $basic_size lines"
echo "  Masked trace: $masked_size lines"
echo "  Reduction: $(echo "scale=1; (1 - $masked_size / $basic_size) * 100" | bc)%"
echo

# =============================================================================
# Example 3: Hotspot Analysis (Find Most-Called Functions)
# =============================================================================
echo -e "${BLUE}[3] Analyzing execution hotspots...${NC}"

# Extract JSR/JSL (function calls) and count frequency
echo "Top 15 most-called functions:"
grep -E "JSR|JSL" "$OUTPUT_DIR/cpu_trace_basic.log" 2>/dev/null | \
    awk '{print $2}' | \
    cut -d: -f2 | \
    sort | uniq -c | sort -rn | head -15 | \
    awk '{printf "  %6d calls → $%s\n", $1, $2}'

echo

# =============================================================================
# Example 4: Memory Write Analysis
# =============================================================================
echo -e "${BLUE}[4] Analyzing memory writes...${NC}"

echo "Top 15 most-written addresses (STA instructions):"
grep "STA" "$OUTPUT_DIR/cpu_trace_basic.log" 2>/dev/null | \
    awk '{for(i=3;i<=NF;i++) if($i ~ /^\$[0-9A-F]+$/) print $i}' | \
    sort | uniq -c | sort -rn | head -15 | \
    awk '{printf "  %6d writes → %s\n", $1, $2}'

echo

# =============================================================================
# Example 5: Trace with Input Simulation
# =============================================================================
echo -e "${BLUE}[5] Tracing with simulated button press...${NC}"

$BSNES_CLI "$ROM" --headless --run-frames 300 \
  --ai-controller \
  --input-command p1_press_start \
  --trace-cpu \
  --trace-output "$OUTPUT_DIR/cpu_trace_with_input.log"

echo -e "${GREEN}✓${NC} Trace with START button saved"
echo

# =============================================================================
# Example 6: Generate Analysis Report
# =============================================================================
echo -e "${BLUE}[6] Generating analysis report...${NC}"

cat > "$OUTPUT_DIR/ANALYSIS_REPORT.md" << 'EOF'
# Zelda 3 CPU Trace Analysis Report

## Execution Statistics

Generated: $(date)

### Trace Files
- Basic trace: `cpu_trace_basic.log` (300 frames, ~5 seconds)
- Masked trace: `cpu_trace_masked.log` (600 frames, unique addresses only)
- Input trace: `cpu_trace_with_input.log` (with START button press)

### Hotspot Analysis

Top called functions represent the game's main loops and frequently used subroutines.
These are prime candidates for reverse engineering as they contain core game logic.

**Recommendation**: Cross-reference these addresses with:
1. `zelda3-disasm` assembly source
2. `zelda3` C source code
3. SNES memory map documentation

### Memory Write Patterns

Frequently written addresses indicate:
- Game state variables (health, position, flags)
- Graphics registers (PPU registers $2100-$213F)
- Audio registers (APU ports $2140-$2143)
- DMA registers ($4300-$437F)

### Next Steps

1. **Function Discovery**: Use zelda3-disasm MCP to find function names for hot addresses
2. **Data Structure Analysis**: Identify memory layouts from write patterns
3. **Event Correlation**: Compare traces with/without input to isolate event handlers
4. **Performance Profiling**: Use hotspot data to understand critical paths

### Known Zelda 3 Functions (for reference)

| Address | Function (from zelda3-disasm) |
|---------|-------------------------------|
| $8080xx | Main game loop |
| $809xxx | Player control routines |
| $80Axxx | Sprite management |
| $80Bxxx | Dungeon logic |
| $80Fxxx | DMA transfers |

EOF

# Fill in actual statistics
sed -i.bak "s/Generated:.*/Generated: $(date)/" "$OUTPUT_DIR/ANALYSIS_REPORT.md"
rm "$OUTPUT_DIR/ANALYSIS_REPORT.md.bak"

echo -e "${GREEN}✓${NC} Report generated: $OUTPUT_DIR/ANALYSIS_REPORT.md"
echo

# =============================================================================
# Summary
# =============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Trace Analysis Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo
echo "Output directory: $OUTPUT_DIR"
echo
echo "Generated files:"
ls -lh "$OUTPUT_DIR" | tail -n +2 | awk '{printf "  %s (%s)\n", $9, $5}'
echo
echo -e "${GREEN}Next steps:${NC}"
echo "  1. Review ANALYSIS_REPORT.md for hotspot summary"
echo "  2. Search zelda3-disasm for function addresses"
echo "  3. Use grep/awk to filter trace logs for specific patterns"
echo "  4. Compare different traces to isolate specific behaviors"
echo
