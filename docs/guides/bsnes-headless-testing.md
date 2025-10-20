# 🎮 bsnes Headless Testing Guide

**Learn how to test SNES ROMs using bsnes command-line interface**

---

## 📋 Overview

This guide documents how to use bsnes headless (CLI) mode for automated ROM testing. Discovered during the Rich Start mod development cycle (2025-10-18).

**What You Can Do:**
- Run ROMs without GUI
- Dump memory (WRAM, VRAM, OAM, CGRAM)
- Inject controller inputs
- Trace CPU/SMP execution
- Automate testing workflows

---

## 🚀 Quick Start

### Basic Usage

```bash
# Run ROM for 60 frames
bsnes zelda3.smc --run-frames 60

# Run until PC reaches specific address
bsnes zelda3.smc --run-until 8000

# Dump WRAM to file
bsnes zelda3.smc --run-frames 180 --dump-wram 0x7EF360:4:rupees.bin
```

### Available Options

```
Basic Options:
  -h, --help                        Show help message
  -v, --version                     Show version
  --run-frames N                    Run for N frames then exit
  --run-until ADDR                  Run until PC reaches address (hex)

Tracing Options:
  --trace-cpu FILE                  Log CPU execution
  --trace-smp FILE                  Log SMP execution

Memory Dump Options:
  --dump-wram ADDR:SIZE:FILE        Dump WRAM region
  --dump-vram ADDR:SIZE:FILE        Dump VRAM region
  --dump-oam FILE                   Dump OAM data
  --dump-cgram FILE                 Dump CGRAM palette data

AI Controller Options:
  --ai-controller                   Enable AI controller
  --input-command CMD               Send controller command
```

---

## 💾 Memory Dumping

### WRAM Dumping

**Format:** `--dump-wram ADDR:SIZE:FILE`

**Example: Dump Rupee Count**
```bash
# Rupee addresses in WRAM (from zelda3/src/variables.h):
# link_rupees_goal:   0x7EF360 (2 bytes)
# link_rupees_actual: 0x7EF362 (2 bytes)

bsnes zelda3-rich-start-999.smc \
  --run-frames 1800 \
  --dump-wram 0x7EF360:4:rupees.bin

# Inspect the dump
xxd rupees.bin
# Output: e7 03 e7 03 (999 in little-endian, twice)
```

### VRAM Dumping

```bash
# Dump first 8KB of VRAM (character data)
bsnes zelda3.smc \
  --run-frames 180 \
  --dump-vram 0:8000:vram.bin
```

### Palette Dumping

```bash
# Dump CGRAM (color palette RAM)
bsnes zelda3.smc \
  --run-frames 60 \
  --dump-cgram palette.bin
```

---

## 🎮 Controller Input Injection

### Input Commands

**Format:** `--input-command p<player>_<action>_<button>`

**Actions:**
- `press` - Press button for 1 frame
- `release` - Release button
- `hold` - Hold button continuously

**Buttons:**
- `A`, `B`, `X`, `Y`
- `L`, `R`
- `Start`, `Select`
- `Up`, `Down`, `Left`, `Right`

**Examples:**
```bash
# Press A button
bsnes zelda3.smc --ai-controller --input-command p1_press_A --run-frames 60

# Hold right + press B
bsnes zelda3.smc --ai-controller \
  --input-command p1_hold_right \
  --input-command p1_press_B \
  --run-frames 120

# Navigate menus (Start button)
bsnes zelda3.smc --ai-controller \
  --input-command p1_press_start \
  --run-frames 300
```

---

## 🔍 CPU/SMP Tracing

### CPU Execution Tracing

```bash
# Trace CPU for 100 frames
bsnes zelda3.smc \
  --trace-cpu cpu_trace.log \
  --run-frames 100

# Example output format:
# 0080A0: LDA $0100,X  [A:0000 X:0010 Y:0000 S:01FF]
# 0080A3: STA $7E2000  [A:0042 X:0010 Y:0000 S:01FF]
```

### SMP (Audio CPU) Tracing

```bash
# Trace SMP execution
bsnes zelda3.smc \
  --trace-smp smp_trace.log \
  --run-frames 100
```

### Combined Tracing

```bash
# Trace both CPUs + memory dumps
bsnes zelda3.smc \
  --trace-cpu cpu.log \
  --trace-smp smp.log \
  --dump-wram 0:8000:wram.bin \
  --run-frames 300
```

---

## 🧪 Testing Workflows

### Workflow 1: ROM Modification Verification

**Goal:** Verify ROM bytes were modified correctly

```bash
#!/bin/bash
# Direct byte verification (no emulator needed)
xxd -s 0x274F4 -l 2 zelda3-rich-start-999.smc
# Expected: e703 (999 in little-endian)
```

**Why this works:**
- ROM modifications happen at file level
- No need to run emulator for static verification
- Instant validation

### Workflow 2: WRAM Runtime Verification

**Goal:** Verify game logic initializes values correctly

```bash
#!/bin/bash
# Run game and dump WRAM
bsnes zelda3-rich-start-999.smc \
  --run-frames 1800 \
  --dump-wram 0x7EF360:4:rupees-runtime.bin

# Parse the dump
od -An -t u2 rupees-runtime.bin
# Expected: 999 999 (if save initialized)
```

**Important Notes:**
- WRAM starts at 0
- Game must initialize save file first
- May need 1800+ frames for new game
- Values copy from ROM → SRAM → WRAM

### Workflow 3: Automated Gameplay Testing

**Goal:** Simulate player actions and verify results

```bash
#!/bin/bash
# Navigate to new game and verify
bsnes zelda3.smc --ai-controller \
  --input-command p1_press_start \  # Title screen
  --run-frames 120 \
  --input-command p1_press_A \       # File select
  --run-frames 60 \
  --dump-wram 0x7EF360:4:after-init.bin
```

---

## 📊 Technical Details

### SNES Address Spaces

**ROM Addresses:**
- PC offset: 0x274F4 (file offset)
- Used in ROM modification
- Static data

**WRAM Addresses:**
- SNES address: $7EF360
- Hex format: 0x7EF360
- Runtime data
- Starts at 0 on boot

**Relationship:**
```
ROM (0x274F4) → SRAM (on new game) → WRAM ($7EF360)
```

### Little-Endian Encoding

**Example: 999 rupees**
```
Decimal: 999
Hex:     0x03E7
Bytes:   E7 03  (low byte first)

Memory layout:
Address   Value
0x274F4   0xE7   (low byte)
0x274F5   0x03   (high byte)
```

**Parsing with shell:**
```bash
# Read little-endian 16-bit value
hex=$(xxd -s 0x274F4 -l 2 -p rom.smc)
low="${hex:0:2}"
high="${hex:2:2}"
decimal=$(( (0x$high << 8) | 0x$low ))
echo "Value: $decimal"
```

---

## 🎯 Use Cases

### 1. ROM Mod Validation

**Binary Level:**
```bash
./scripts/verify-rich-start-rom-bytes.sh
# Verifies: ✅ 999, ✅ 500, ✅ 777
```

**Runtime Level:**
```bash
./scripts/test-rich-start-gameplay.sh
# Runs emulator and checks WRAM
```

### 2. Regression Testing

```bash
#!/bin/bash
# Test that ROM loads without crashing
for rom in repos/snes-modder/*.smc; do
  echo "Testing: $rom"
  bsnes "$rom" --run-frames 60 || echo "FAILED: $rom"
done
```

### 3. Performance Benchmarking

```bash
#!/bin/bash
# Measure frame timing
time bsnes zelda3.smc --run-frames 3600  # 1 minute @ 60fps
```

### 4. Save State Analysis

```bash
# Dump entire WRAM after specific event
bsnes zelda3.smc \
  --run-frames 5000 \
  --dump-wram 0:65536:full-wram.bin

# Analyze save structure
xxd full-wram.bin | grep -A5 "7ef360"
```

---

## 🔧 Integration Examples

### Makefile Integration

```makefile
.PHONY: test-roms
test-roms:
\t@for rom in repos/snes-modder/*.smc; do \\
\t\techo "Testing $$rom..."; \\
\t\tbsnes "$$rom" --run-frames 60 || exit 1; \\
\tdone
\t@echo "All ROMs passed!"

.PHONY: validate-rupees
validate-rupees:
\t@./scripts/verify-rich-start-rom-bytes.sh
```

### CI/CD Integration

```yaml
# .github/workflows/test-roms.yml
name: Test ROMs
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install bsnes
        run: |
          # Build or download bsnes
      - name: Verify ROM modifications
        run: ./scripts/verify-rich-start-rom-bytes.sh
      - name: Test ROM loading
        run: ./scripts/test-rich-start-gameplay.sh
```

---

## ⚠️ Limitations & Caveats

### WRAM Timing Issues

**Problem:** WRAM may be zero early in execution
```bash
# Too early (0 frames) - WRAM not initialized
bsnes rom.smc --run-frames 0 --dump-wram 0x7EF360:4:out.bin
# Result: 00 00 00 00

# Better (1800 frames) - Game has initialized
bsnes rom.smc --run-frames 1800 --dump-wram 0x7EF360:4:out.bin
# Result: e7 03 e7 03 (if save loaded)
```

**Solution:**
- Run enough frames for game initialization
- For Zelda 3: ~1800 frames (30 seconds)
- Or use ROM verification instead

### Save File Dependencies

**Problem:** WRAM values depend on save file state

**Workflow:**
```
1. Game boots → WRAM = 0
2. User selects "New Game"
3. Game copies ROM template (0x274F4) → SRAM
4. Game loads SRAM → WRAM (0x7EF360)
5. Now WRAM contains modified rupees
```

**Implication:**
- Can't test WRAM immediately
- Need to simulate new game flow
- ROM verification is more reliable

### Input Injection Limitations

**What Works:**
- Simple button presses
- Frame-accurate timing
- Deterministic sequences

**What Doesn't:**
- Complex menu navigation (timing sensitive)
- RNG-dependent gameplay
- Real-time reaction to game state

---

## 🎓 Lessons Learned

### From Rich Start Mod Testing

**1. ROM vs WRAM Testing**
- ✅ ROM verification: Instant, reliable
- ⚠️ WRAM verification: Timing dependent
- 💡 Use ROM for static, WRAM for runtime

**2. Address Discovery**
```c
// From zelda3/src/variables.h
#define link_rupees_goal (*(uint16*)(g_ram+0xF360))
// g_ram base is $7E0000, so:
// WRAM address = $7E0000 + 0xF360 = $7EF360
```

**3. Little-Endian Gotchas**
```bash
# xxd shows bytes in file order
xxd output: e7 03
           ↑   ↑
         low high

# NOT high low!
```

**4. Frame Timing**
- Boot: 60 frames minimum
- Title screen: +120 frames
- New game init: +1620 frames
- **Total: ~1800 frames for safe WRAM access**

---

## 📚 Related Resources

**Scripts Created:**
- `./scripts/test-rich-start-gameplay.sh` - WRAM testing
- `./scripts/verify-rich-start-rom-bytes.sh` - ROM testing

**Source References:**
- `zelda3/src/variables.h` - WRAM variable definitions
- `zelda3/src/messaging.c` - Save file loading
- `bsnes/cli-headless/cli_interface.cpp` - CLI implementation

**Documentation:**
- `docs/guides/rich-start-mod-guide.md` - Rich Start mod details
- `docs/reports/phase1-discovery-rupee-mod-2025-10-18.md` - Discovery process

---

## 🔮 Future Enhancements

**Possible Improvements:**
1. **Automated Save State Creation**
   - Create SRAM with new game initialized
   - Skip 1800 frame wait
   - Instant WRAM verification

2. **Scripted Menu Navigation**
   - Pre-recorded input sequences
   - Navigate to specific game states
   - More reliable than frame counting

3. **Memory Watch Points**
   - Track when WRAM addresses change
   - Alert when values updated
   - Better timing detection

4. **Visual Regression Testing**
   - Dump VRAM and compare screenshots
   - Verify visual changes
   - Catch graphical glitches

---

## ✨ Summary

**bsnes headless CLI enables:**
- ✅ Automated ROM testing
- ✅ Memory dumping and analysis
- ✅ CPU/SMP execution tracing
- ✅ Controller input injection
- ✅ Deterministic test scenarios

**Best Practices:**
1. Use ROM verification for static checks
2. Use WRAM verification for runtime checks
3. Allow sufficient frames for initialization
4. Understand ROM → SRAM → WRAM workflow
5. Account for little-endian encoding

**Result:**
Complete automation of SNES ROM testing workflows! 🎮✨

---

**Created:** 2025-10-18
**Tested with:** bsnes-plus CLI (Qt-free build)
**Example ROM:** The Legend of Zelda: A Link to the Past (US)
