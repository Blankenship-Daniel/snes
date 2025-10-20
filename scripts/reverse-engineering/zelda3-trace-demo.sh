#!/bin/bash
# Zelda 3 CPU Trace Demo
# Quick demonstration of CPU execution tracing

set -e

# Configuration
BSNES_CLI="repos/bsnes-plus/bsnes/cli-headless/bsnes-cli"
ROM="zelda3.smc"
OUTPUT_DIR="output/trace-demo"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Zelda 3 CPU Trace Demo${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Check ROM
if [ ! -e "$ROM" ]; then
    echo -e "${YELLOW}Error: ROM not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} ROM: $ROM"
echo -e "${GREEN}✓${NC} Emulator: $BSNES_CLI"
echo

# =============================================================================
# Example 1: Basic CPU Trace
# =============================================================================
echo -e "${BLUE}[1] Capturing basic CPU trace (60 frames / 1 second)...${NC}"

$BSNES_CLI "$ROM" --run-frames 60 \
  --trace-cpu "$OUTPUT_DIR/cpu_trace_1sec.log"

trace_lines=$(wc -l < "$OUTPUT_DIR/cpu_trace_1sec.log")
echo -e "${GREEN}✓${NC} Captured $trace_lines instructions"
echo

# Show sample
echo "Sample trace (first 10 lines):"
head -n 10 "$OUTPUT_DIR/cpu_trace_1sec.log" | sed 's/^/  /'
echo

# =============================================================================
# Example 2: Longer Trace
# =============================================================================
echo -e "${BLUE}[2] Capturing extended trace (180 frames / 3 seconds)...${NC}"

$BSNES_CLI "$ROM" --run-frames 180 \
  --trace-cpu "$OUTPUT_DIR/cpu_trace_3sec.log"

trace_lines=$(wc -l < "$OUTPUT_DIR/cpu_trace_3sec.log")
echo -e "${GREEN}✓${NC} Captured $trace_lines instructions"
echo

# =============================================================================
# Example 3: Find Hotspots (Most-Called Functions)
# =============================================================================
echo -e "${BLUE}[3] Analyzing execution hotspots...${NC}"

echo "Top 10 most executed addresses:"
awk '{print $1}' "$OUTPUT_DIR/cpu_trace_3sec.log" | \
    sort | uniq -c | sort -rn | head -10 | \
    awk '{printf "  %8d calls → %s\n", $1, $2}'

echo

# =============================================================================
# Example 4: Find Function Calls
# =============================================================================
echo -e "${BLUE}[4] Finding JSR/JSL (subroutine calls)...${NC}"

grep -E "JSR|JSL" "$OUTPUT_DIR/cpu_trace_3sec.log" | head -10 | sed 's/^/  /'
echo "  ..."

jsr_count=$(grep -c -E "JSR|JSL" "$OUTPUT_DIR/cpu_trace_3sec.log" || echo "0")
echo -e "${GREEN}✓${NC} Found $jsr_count function calls"
echo

# =============================================================================
# Example 5: Memory Access Patterns
# =============================================================================
echo -e "${BLUE}[5] Analyzing memory writes...${NC}"

echo "Sample STA (store accumulator) instructions:"
grep "STA" "$OUTPUT_DIR/cpu_trace_3sec.log" | head -10 | sed 's/^/  /'
echo "  ..."

sta_count=$(grep -c "STA" "$OUTPUT_DIR/cpu_trace_3sec.log" || echo "0")
echo -e "${GREEN}✓${NC} Found $sta_count STA instructions"
echo

# =============================================================================
# Summary
# =============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Trace Demo Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo
echo "Output directory: $OUTPUT_DIR"
echo
echo "Generated files:"
ls -lh "$OUTPUT_DIR" 2>/dev/null | tail -n +2 | awk '{printf "  %-30s %s\n", $9, $5}' || true
echo
echo -e "${GREEN}Next steps:${NC}"
echo "  1. Analyze trace logs with grep/awk"
echo "  2. Find specific instruction patterns"
echo "  3. Identify frequently called functions"
echo "  4. Use zelda3-disasm MCP to look up addresses"
echo
echo "Example commands:"
echo "  grep 'LDA' $OUTPUT_DIR/cpu_trace_3sec.log | head -20"
echo "  grep 'JSR \\\$80' $OUTPUT_DIR/cpu_trace_3sec.log"
echo "  awk '{print \$1}' $OUTPUT_DIR/cpu_trace_3sec.log | sort | uniq -c | sort -rn"
echo
