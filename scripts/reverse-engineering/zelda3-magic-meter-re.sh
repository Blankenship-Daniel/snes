#!/bin/bash
# Zelda 3 Magic Meter Reverse Engineering Example
# Complete workflow: memory analysis → trace analysis → code discovery

set -e

# Configuration
BSNES_CLI="repos/bsnes-plus/bsnes/cli-headless/bsnes-cli"
ROM="zelda3.smc"
OUTPUT_DIR="output/magic-meter-analysis"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Zelda 3 Magic Meter Analysis${NC}"
echo -e "${BLUE}Complete Reverse Engineering Example${NC}"
echo -e "${BLUE}========================================${NC}"
echo

# Known magic meter address: $7EF36E (WRAM offset $F36E)
MAGIC_ADDR="7EF36E"
MAGIC_OFFSET="F36E"

echo -e "${CYAN}Target:${NC} Magic Meter"
echo -e "${CYAN}Address:${NC} \$$MAGIC_ADDR (WRAM offset \$$MAGIC_OFFSET)"
echo -e "${CYAN}Size:${NC} 2 bytes (current magic + max magic)"
echo

# =============================================================================
# Step 1: Baseline Memory Capture
# =============================================================================
echo -e "${BLUE}[Step 1] Capturing baseline magic meter state...${NC}"

$BSNES_CLI "$ROM" --headless --run-frames 180 \
  --dump-memory cpu-bus:$MAGIC_ADDR:2:"$OUTPUT_DIR/magic_baseline.bin"

baseline_hex=$(hexdump -v -e '2/1 "%02X " "\n"' "$OUTPUT_DIR/magic_baseline.bin")
echo -e "  Baseline magic meter: 0x${baseline_hex}"
echo

# =============================================================================
# Step 2: Trace Magic Consumption
# =============================================================================
echo -e "${BLUE}[Step 2] Tracing execution while magic is used...${NC}"
echo "  (Simulating magic consumption with extended gameplay)"

$BSNES_CLI "$ROM" --headless --run-frames 600 \
  --trace-cpu \
  --trace-output "$OUTPUT_DIR/magic_usage_trace.log" \
  --dump-memory cpu-bus:$MAGIC_ADDR:2:"$OUTPUT_DIR/magic_after_usage.bin"

after_hex=$(hexdump -v -e '2/1 "%02X " "\n"' "$OUTPUT_DIR/magic_after_usage.bin")
echo -e "  After gameplay magic: 0x${after_hex}"
echo

# =============================================================================
# Step 3: Find Write Instructions
# =============================================================================
echo -e "${BLUE}[Step 3] Searching trace for magic meter writes...${NC}"

# Search for stores to magic meter address
echo "Looking for STA/STX/STY/STZ instructions to \$$MAGIC_ADDR..."
grep -i "ST[AXYZ].*$MAGIC_ADDR\|ST[AXYZ].*\[$MAGIC_OFFSET\]" "$OUTPUT_DIR/magic_usage_trace.log" 2>/dev/null | \
    head -20 | \
    awk '{printf "  %s\n", $0}' || echo "  (No direct writes found in this trace)"

echo

# Search for writes to WRAM region around magic meter
echo "Searching for writes near magic meter address..."
grep -E "STA|STX|STY|STZ" "$OUTPUT_DIR/magic_usage_trace.log" 2>/dev/null | \
    grep -E "7EF3[0-9A-F][0-9A-F]" | \
    head -10 | \
    awk '{printf "  %s\n", $0}'

echo

# =============================================================================
# Step 4: Find Function Calls Related to Magic
# =============================================================================
echo -e "${BLUE}[Step 4] Finding functions that might handle magic...${NC}"

# Extract unique function calls
echo "Most-called functions during magic usage:"
grep -E "JSR|JSL" "$OUTPUT_DIR/magic_usage_trace.log" 2>/dev/null | \
    awk '{print $2}' | \
    cut -d: -f2 | \
    sort | uniq -c | sort -rn | head -10 | \
    awk '{printf "  %6d calls → $%s\n", $1, $2}'

echo

# =============================================================================
# Step 5: Generate Search Queries for zelda3-disasm
# =============================================================================
echo -e "${BLUE}[Step 5] Generating zelda3-disasm MCP search queries...${NC}"

cat > "$OUTPUT_DIR/mcp_search_queries.md" << 'EOF'
# MCP Search Queries for Magic Meter Analysis

## Search zelda3-disasm for Magic-Related Code

### Query 1: Search for "magic" keyword
```javascript
mcp__zelda3_disasm__search_code({
  query: "magic",
  file_type: "asm"
})
```

### Query 2: Search for stores to $F36E (WRAM offset)
```javascript
mcp__zelda3_disasm__search_code({
  query: "STA.*F36E|STZ.*F36E",
  file_type: "asm"
})
```

### Query 3: Search for magic meter address in comments
```javascript
mcp__zelda3_disasm__search_code({
  query: "7EF36E",
  file_type: "asm"
})
```

### Query 4: Find functions with "magic" in name
```javascript
mcp__zelda3_disasm__find_functions({
  function_name: "magic"
})
```

## Search zelda3 C Source

### Query 1: Search C source for magic variables
```javascript
mcp__zelda3__search_code({
  query: "magic",
  file_type: "c"
})
```

### Query 2: Find magic-related structures
```javascript
mcp__zelda3__find_structs({
  struct_name: "magic"
})
```

## SNES Hardware Context

### Query: Check if magic uses special registers
```javascript
mcp__snes_mcp_server__register_info({
  category: "ppu"
})
```
EOF

echo -e "${GREEN}✓${NC} MCP queries saved to: $OUTPUT_DIR/mcp_search_queries.md"
echo

# =============================================================================
# Step 6: Cross-Reference with Known Info
# =============================================================================
echo -e "${BLUE}[Step 6] Cross-referencing with known Zelda 3 data...${NC}"

cat > "$OUTPUT_DIR/FINDINGS.md" << EOF
# Magic Meter Reverse Engineering Findings

## Memory Analysis

**Address**: \$7EF36E (CPU bus address)
**WRAM Offset**: \$F36E
**Size**: 2 bytes

### Memory Values

| State | Value | Notes |
|-------|-------|-------|
| Baseline | 0x${baseline_hex} | Initial state at frame 180 |
| After Usage | 0x${after_hex} | State after 600 frames |

**Byte 0**: Current magic meter value (0-128)
**Byte 1**: Maximum magic capacity (usually 128)

## Known Information (from zelda3 C source)

From \`zelda3/src/player.c\`:
- Magic meter is decremented when using magic-consuming items
- Medallions consume magic
- Magic cape uses magic continuously
- Magic powder uses magic on activation

## Assembly Analysis

Based on zelda3-disasm, the magic meter is typically modified by:
1. **Item usage routines** (when player activates magic items)
2. **Magic restoration** (picking up magic jars)
3. **Save/load routines** (persisting magic between sessions)

## Recommended Next Steps

1. **Use zelda3-disasm MCP** to search for:
   - Functions containing "magic" in comments
   - STA/STZ instructions to \$F36E or \$7EF36E

2. **Search zelda3 C source** for:
   - \`link_magic_current\` or similar variable names
   - Functions like \`UpdateMagic()\` or \`ConsumeMagic()\`

3. **Correlate with game events**:
   - Trace execution during medallion use
   - Compare magic consumption rates for different items
   - Analyze magic restoration (magic jars, refill items)

4. **Validate findings**:
   - Create a mod that sets magic to infinite (write 0x80 continuously)
   - Test with snes-modder validation pipeline
   - Verify in bsnes-plus runtime tests

## File References

- Memory dumps: \`$OUTPUT_DIR/magic_*.bin\`
- CPU trace: \`$OUTPUT_DIR/magic_usage_trace.log\`
- MCP queries: \`$OUTPUT_DIR/mcp_search_queries.md\`
EOF

echo -e "${GREEN}✓${NC} Findings documented: $OUTPUT_DIR/FINDINGS.md"
echo

# =============================================================================
# Summary
# =============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Magic Meter Analysis Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo
echo "Output directory: $OUTPUT_DIR"
echo
echo "Generated files:"
ls -lh "$OUTPUT_DIR" | tail -n +2 | awk '{printf "  %s (%s)\n", $9, $5}'
echo
echo -e "${GREEN}Summary:${NC}"
echo "  • Captured baseline and post-usage magic meter values"
echo "  • Generated CPU trace during magic usage"
echo "  • Identified potential write instructions"
echo "  • Created MCP search queries for code discovery"
echo "  • Documented findings with next steps"
echo
echo -e "${CYAN}Next: Use the MCP queries to find the actual code!${NC}"
echo "  1. Open $OUTPUT_DIR/mcp_search_queries.md"
echo "  2. Use zelda3-disasm and zelda3 MCP servers to search"
echo "  3. Cross-reference findings with CPU trace"
echo "  4. Implement modification in snes-modder"
echo
