# Zelda 3 Reverse Engineering - Quick Start Guide

Get started with reverse engineering Zelda 3 using the bsnes-cli headless emulator in under 5 minutes.

## ✅ Prerequisites

1. **ROM file**: Ensure `zelda3.smc` exists (or create symlink)
2. **bsnes-cli**: Already built at `repos/bsnes-plus/bsnes/cli-headless/bsnes-cli`
3. **Basic tools**: bash, hexdump (standard on macOS/Linux)

## 🚀 Quick Start (30 Seconds)

```bash
# 1. Ensure ROM symlink exists
ln -sf repos/snes-modder/.rom-backups/zelda3-original.smc zelda3.smc

# 2. Run memory analysis
./scripts/reverse-engineering/zelda3-memory-analysis.sh

# 3. View results
ls -lh output/memory-analysis/
hexdump -C output/memory-analysis/wram_startup.bin | head -20
```

## 📊 What You'll Get

After running the memory analysis script:

```
output/memory-analysis/
├── wram_startup.bin           # 128KB WRAM at frame 60
├── wram_after_gameplay.bin    # 128KB WRAM at frame 300
└── (comparison showing ~130K changed bytes)
```

## 🔍 Basic Analysis Workflow

### 1. Capture Memory at Different States

```bash
# Startup state
repos/bsnes-plus/bsnes/cli-headless/bsnes-cli zelda3.smc \
  --run-frames 60 \
  --dump-wram 0:131072:wram_startup.bin

# After 5 seconds
repos/bsnes-plus/bsnes/cli-headless/bsnes-cli zelda3.smc \
  --run-frames 300 \
  --dump-wram 0:131072:wram_after.bin
```

### 2. Compare to Find Changes

```bash
# Find all differences
cmp -l wram_startup.bin wram_after.bin | head -20

# Or use visual diff
hexdump -C wram_startup.bin > startup.hex
hexdump -C wram_after.bin > after.hex
diff startup.hex after.hex | less
```

### 3. Extract Specific Variables

```bash
# Magic meter at WRAM offset $F36E (decimal 62318)
repos/bsnes-plus/bsnes/cli-headless/bsnes-cli zelda3.smc \
  --run-frames 180 \
  --dump-wram 62318:2:magic_meter.bin

# View the value
hexdump -v -e '2/1 "%02X " "\n"' magic_meter.bin
```

## 📍 Known Zelda 3 Memory Locations

| Variable | WRAM Offset | CPU Address | Size | Description |
|----------|-------------|-------------|------|-------------|
| Magic meter | $F36E | $7EF36E | 2 bytes | Current/max magic |
| Health | $F36D | $7EF36D | 1 byte | Current health |
| Rupees | $F360 | $7EF360 | 2 bytes | Rupee count |
| Arrows | $F377 | $7EF377 | 1 byte | Arrow count |
| Bombs | $F375 | $7EF375 | 1 byte | Bomb count |
| Link X pos | $0022 | $7E0022 | 2 bytes | X coordinate |
| Link Y pos | $0020 | $7E0020 | 2 bytes | Y coordinate |

**Note**: WRAM offsets are relative to $7E0000. To get CPU address: `CPU_ADDR = $7E0000 + WRAM_OFFSET`

## 🎯 Example: Find the Magic Meter Value

```bash
#!/bin/bash
# Extract and display magic meter

# Magic meter is at WRAM offset $F36E (decimal: 62318)
repos/bsnes-plus/bsnes/cli-headless/bsnes-cli zelda3.smc \
  --run-frames 180 \
  --dump-wram 62318:2:magic.bin

# Display as hex
echo -n "Magic meter value: 0x"
hexdump -v -e '2/1 "%02X"' magic.bin
echo
```

## 🔗 Integration with MCP Servers

After finding a memory location, use MCP servers to find the code:

```javascript
// Search zelda3-disasm for code that writes to magic meter
mcp__zelda3_disasm__search_code({
  query: "STA.*F36E|STZ.*F36E",
  file_type: "asm"
})

// Search zelda3 C source for magic variables
mcp__zelda3__search_code({
  query: "link_magic",
  file_type: "c"
})
```

## 📚 Available Scripts

| Script | Purpose | Speed |
|--------|---------|-------|
| `zelda3-memory-analysis.sh` | Memory dumps + comparison | ~2 seconds |
| `zelda3-trace-demo.sh` | CPU trace demonstration | ~3 seconds |

## 🎓 Learning Path

1. **Start here**: Run `zelda3-memory-analysis.sh` to see memory dumps
2. **Explore**: Use hexdump to view WRAM data
3. **Compare**: Find changes between different game states
4. **Discover**: Use known addresses to validate your technique
5. **Search**: Use MCP servers to find code for addresses
6. **Modify**: Create mods with snes-modder
7. **Validate**: Test with bsnes runtime tests

## 💡 Tips

### Hex to Decimal Conversion

```bash
# Convert WRAM offset $F36E to decimal
echo $((0xF36E))  # Output: 62318

# Convert decimal 62318 to hex
printf "0x%X\n" 62318  # Output: 0xF36E
```

### View WRAM Sections

```bash
# View save data area ($F000-$F4FF)
repos/bsnes-plus/bsnes/cli-headless/bsnes-cli zelda3.smc \
  --run-frames 180 \
  --dump-wram 61440:1280:save_area.bin

hexdump -C save_area.bin | less
```

### Batch Analysis

```bash
# Capture at multiple time points
for frames in 60 120 180 240 300; do
  repos/bsnes-plus/bsnes/cli-headless/bsnes-cli zelda3.smc \
    --run-frames $frames \
    --dump-wram 0:131072:wram_${frames}.bin
done

# Compare all
for i in 60 120 180 240 300; do
  echo "Frame $i differences from startup:"
  cmp -l wram_60.bin wram_${i}.bin | wc -l
done
```

## 🐛 Troubleshooting

### "ROM not found"
```bash
# Check if symlink is correct
ls -la zelda3.smc
readlink zelda3.smc

# Recreate if broken
rm zelda3.smc
ln -s repos/snes-modder/.rom-backups/zelda3-original.smc zelda3.smc
```

### Empty/Zero byte dumps
- Ensure ROM is valid (not compressed)
- Check that offset is within WRAM bounds (0-131071)
- Verify bsnes-cli is built correctly

### Performance
The headless emulator runs at 600+ fps (10x real-time):
- 60 frames (1 second) = ~0.1 seconds real time
- 300 frames (5 seconds) = ~0.5 seconds real time
- 1800 frames (30 seconds) = ~3 seconds real time

## 📖 Next Steps

- **Full Guide**: Read `zelda3-headless-workflow.md` for comprehensive documentation
- **MCP Integration**: Learn how to search source code for discovered addresses
- **Mod Creation**: Use snes-modder to implement modifications
- **Advanced**: Explore differential analysis and pattern recognition

---

**You're now ready to reverse engineer Zelda 3!** Start with memory dumps, find patterns, use MCP servers to locate code, and create mods. 🎮🔍
