# SNES ROM Reverse Engineering Best Practices

Comprehensive guide compiled from community research, established patterns, and expert workflows.

**Date**: October 2025
**Sources**: RetroReversing, SNESdev Wiki, ROM Hacking.net, SMWCentral, TASVideos

---

## Table of Contents

- [Essential Tools](#essential-tools)
- [Core Methodologies](#core-methodologies)
- [Disassembly Workflows](#disassembly-workflows)
- [Memory Analysis Patterns](#memory-analysis-patterns)
- [Debugging Techniques](#debugging-techniques)
- [Technical Patterns](#technical-patterns)
- [Community Resources](#community-resources)
- [Development Timeline](#development-timeline)

---

## Essential Tools

### Emulators with Debugging Features

**bsnes-plus** (Recommended for serious reverse engineering)
- **Features**: CPU/SMP/SA-1 debugger, memory editor, breakpoints, trace logging
- **Strengths**: Most accurate emulation, comprehensive debugging tools
- **Use Cases**: Hardware-accurate debugging, timing analysis, coprocessor debugging
- **Profiles**: Accuracy, Compatibility, Performance

**Snes9x with Debugger (Geiger's build)**
- **Features**: Basic debugging, memory search, cheat codes
- **Strengths**: Lightweight, faster than bsnes-plus
- **Use Cases**: Quick testing, memory watching, initial exploration

**ZMZ** (Zero Music Zero)
- **Features**: Memory viewer, save state inspection
- **Strengths**: Simple interface for palette/tile viewing
- **Use Cases**: Graphics analysis, quick memory inspection

### Disassemblers & Analysis Tools

**DiztinGUIsh**
- **Purpose**: SNES ROM disassembler with GUI
- **Features**: Automatic code/data separation, label generation
- **Workflow**: Visual disassembly, export to assembly projects

**ca65/ld65**
- **Purpose**: Industry-standard 65816 assembler/linker
- **Strengths**: Powerful linking scripts, multi-bank support
- **Use Cases**: Building disassembled projects, new development

**WLA DX**
- **Purpose**: Alternative 65816 assembler
- **Strengths**: Wide community support, good documentation
- **Use Cases**: Reassembling disassembled ROMs

**snes2asm (Python)**
- **Purpose**: Python-based disassembler with asset extraction
- **Features**: Graphics/audio/text extraction, YAML-driven configuration
- **Workflow**: Automated disassembly + asset export

### Memory & Analysis Tools

**YY-CHR**
- **Purpose**: Graphics tile viewer/editor
- **Features**: 1/2/4bpp SNES support, palette editing
- **Workflow**: Load ROM → adjust pattern → fix palette → edit/export

**Monkey-Moore**
- **Purpose**: TBL (table file) creator for text editing
- **Features**: Relative search, automatic character mapping
- **Workflow**: Search text → generate TBL → use with hex editor

**HxD (Hex Editor)**
- **Purpose**: Low-level ROM inspection and editing
- **Features**: Search/replace, pattern finding, binary diff
- **Workflow**: Direct binary editing, text string replacement

**Ghidra**
- **Purpose**: NSA's reverse engineering suite (supports 65816 with plugins)
- **Features**: Decompilation, cross-references, function analysis
- **Use Cases**: Complex code analysis, algorithm understanding

---

## Core Methodologies

### The Iterative Discovery Process

**Phase 1: Initial Exploration (Hours 1-10)**
1. Play the game while taking notes
2. Identify interesting mechanics/values to investigate
3. Use RAM search to find value addresses
4. Document findings in organized notes

**Phase 2: Memory Mapping (Hours 10-50)**
1. Use emulator memory search to find variables
2. Create RAM map documenting known addresses
3. Test hypotheses by modifying values
4. Build understanding of game state structure

**Phase 3: Code Analysis (Hours 50-200)**
1. Set breakpoints on interesting memory addresses
2. Step through code execution
3. Trace subroutine calls and returns
4. Document function purposes and calling conventions

**Phase 4: Disassembly (Hours 200+)**
1. Use automated disassembler for initial pass
2. Manually label routines based on analysis
3. Add comments explaining code behavior
4. Organize into logical modules/banks

### The "Breakpoint-First" Approach

**Recommended Workflow**:
```
1. Identify target behavior (e.g., "taking damage")
2. Find related RAM addresses (e.g., player HP)
3. Set write breakpoint on address
4. Trigger behavior in game
5. Examine call stack when breakpoint hits
6. Trace backwards to find root cause
7. Document the code path
```

**Example**:
```
Target: Find magic consumption code in Zelda 3
→ RAM search finds magic at $7EF36E
→ Set write breakpoint on $7EF36E
→ Use magic spell in game
→ Breakpoint hits at ROM address $8D85C3
→ Trace back through JSR calls
→ Document entire magic system
```

### The "Comparison Method"

**Used for**: Finding code differences, understanding patches

**Workflow**:
1. Create two save states (before/after target event)
2. Dump WRAM from both states
3. Use binary diff tool (cmp, diff, fc)
4. Identify changed addresses
5. Set breakpoints on changed addresses
6. Analyze code that modifies them

---

## Disassembly Workflows

### Automated vs. Manual Disassembly

**Automated Approach** (Tools: DiztinGUIsh, snes2asm)

**Pros**:
- Fast initial disassembly
- Handles bank switching automatically
- Exports buildable projects

**Cons**:
- Requires manual cleanup
- May misidentify code vs. data
- Labels are generic (e.g., LABEL_808000)

**Manual Approach** (Tools: hex editor + reference docs)

**Pros**:
- Deep understanding of every instruction
- Perfect code/data separation
- Meaningful labels from the start

**Cons**:
- Extremely time-consuming
- Easy to make mistakes
- Requires expert-level knowledge

**Community Best Practice**: Use automated tools for initial pass, then manually refine and label based on analysis.

### Handling LoROM vs. HiROM

**LoROM** (Low ROM - Most common)
- ROM appears in banks $80-$FF at addresses $8000-$FFFF
- Mirrored in $00-$7F
- Max ROM size: 4MB
- SNES→ROM formula: `offset = ((addr & 0x7F0000) >> 1) | (addr & 0x7FFF)`

**HiROM** (High ROM)
- ROM appears in banks $C0-$FF at addresses $0000-$FFFF
- Also in $40-$7D
- Max ROM size: 4MB
- SNES→ROM formula: `offset = addr & 0x3FFFFF`

**ExHiROM** (Extended HiROM)
- ROM up to 8MB
- Uses additional banks

**Detection Method**:
```
Read ROM header at offset 0x7FC0 (LoROM) or 0xFFC0 (HiROM)
Check for valid title, checksum, ROM size
```

### Best Practices for Disassembly Projects

**Directory Structure**:
```
project/
├── src/
│   ├── main.asm          # Entry point, vectors
│   ├── bank00.asm        # Code by bank
│   ├── bank01.asm
│   └── ...
├── data/
│   ├── graphics/         # Extracted tiles
│   ├── audio/            # SPC/BRR data
│   └── tables/           # Data tables
├── docs/
│   ├── memory_map.md     # RAM addresses
│   └── functions.md      # Function documentation
├── Makefile
└── linker.cfg            # ld65 linker script
```

**Commenting Standards** (from SMWDisC project):
```asm
; Function: PlayerTakeDamage
; Purpose: Reduces player HP when hit by enemy
; Inputs: A = damage amount
; Outputs: $7EF36D = updated HP
; Modifies: A, X, Y
; Called by: CollisionHandler ($80A5C2)
PlayerTakeDamage:
    STA $00                ; Store damage amount to scratch RAM
    LDA $7EF36D            ; Load current HP
    SEC                    ; Set carry for subtraction
    SBC $00                ; Subtract damage
    BCS .StoreHP           ; If no underflow, store new HP
    LDA #$00               ; Otherwise, clamp to zero
.StoreHP:
    STA $7EF36D            ; Save updated HP
    RTS
```

---

## Memory Analysis Patterns

### SNES Memory Map Overview

**WRAM (128KB)**
- Banks $7E-$7F: Full 128KB of work RAM
- Banks $00-$3F, $80-$BF at $0000-$1FFF: LowRAM mirror (8KB)
- **Usage**: Game state, variables, stack, temporary data

**Hardware Registers**
- Banks $00-$3F, $80-$BF at $2000-$5FFF
- **$2100-$21FF**: PPU registers (graphics)
- **$4200-$44FF**: CPU/DMA/IRQ registers
- **Examples**:
  - $2100 INIDISP: Screen brightness, forced blank
  - $2105 BGMODE: Background mode selection
  - $4200 NMITIMEN: NMI/IRQ enable

**VRAM (64KB)**
- Accessed indirectly through $2118-$2119 (VMDATAL/VMDATAH)
- Stores: Tiles, tilemaps, backgrounds

**ROM Access**
- LoROM: Banks $80-$FF at $8000-$FFFF
- HiROM: Banks $C0-$FF at $0000-$FFFF

### Common Memory Patterns

**Save Data Pattern** (e.g., Zelda 3 SRAM)
```
$7EF000-$7EF4FF: Save slot 1
$7EF500-$7EF9FF: Save slot 2
$7EFA00-$7EFEFF: Save slot 3

Within each save:
+$000: Link's name (6 bytes)
+$010: Hearts (1 byte)
+$020: Items array
+$36D: Current HP
+$36E: Current magic
+$374: Rupees (2 bytes)
```

**Sprite Data Pattern** (OAM structure)
```
128 sprites × 4 bytes = 512 bytes
Each sprite:
  Byte 0: X position (low 8 bits)
  Byte 1: Y position
  Byte 2: Tile number
  Byte 3: Attributes (priority, palette, flip, X high bit)

Additional 32 bytes for extended attributes
```

**State Machine Pattern**
```
Common game state variables:
$10: Game mode (0=title, 1=gameplay, 2=pause, etc.)
$11: Submode/phase within current mode
$12: Frame counter for mode
$13-$1F: Mode-specific scratch variables
```

**RNG (Random Number Generator) Pattern**
```
Linear Congruential Generator (common):
  RNG_state = (RNG_state * multiplier + increment) & 0xFFFF
  Return high byte or low byte as random value

Example addresses:
  $1A: RNG state (2 bytes)
  Reload from interrupt or user input for entropy
```

---

## Debugging Techniques

### Breakpoint Strategies

**Read Breakpoints**
- **When**: Finding code that checks a value
- **Example**: "Where does the game check if I have the Master Sword?"
- **Action**: Set read breakpoint on sword flag address

**Write Breakpoints**
- **When**: Finding code that modifies a value
- **Example**: "What code reduces my HP?"
- **Action**: Set write breakpoint on HP address

**Execute Breakpoints**
- **When**: Analyzing specific routines
- **Example**: "I know subroutine X is buggy, break when it runs"
- **Action**: Set execute breakpoint on routine entry

**Conditional Breakpoints**
- **When**: Event only happens under specific conditions
- **Example**: "Break when HP drops below 3"
- **Syntax**: `$7EF36D < 3`

### Trace Logging Best Practices

**When to Use**:
- Understanding execution flow
- Measuring performance (cycle counting)
- Detecting infinite loops
- Analyzing interrupt handlers

**bsnes-plus Trace Log Format**:
```
Frame:PC:Opcode:A:X:Y:S:P:DB
0:808000:LDA #$00:00:0000:0000:01FD:30:80
0:808002:STA $2100:00:0000:0000:01FD:30:80
```

**Analysis Workflow**:
1. Enable trace logging for target section
2. Limit trace duration (performance impact)
3. Export to text file
4. Use grep/sed/awk to filter patterns
5. Generate statistics (instruction frequency, hot paths)

**Example Analysis**:
```bash
# Find all JSR calls in trace
grep "JSR" trace.log

# Count instruction types
awk '{print $3}' trace.log | sort | uniq -c | sort -rn

# Find loops (same PC appearing frequently)
awk '{print $2}' trace.log | sort | uniq -c | sort -rn
```

### RAM Search Workflow

**Finding Unknown Values**:
1. Start with "Unknown Initial Value" search
2. Trigger change in game (e.g., take damage)
3. Search for "Changed" values
4. Repeat until only a few addresses remain
5. Test each address to confirm

**Finding Known Values**:
1. Observe value in game (e.g., HP = 12)
2. Search for exact value
3. Change value in game
4. Search for new value
5. Repeat until address found

**Data Type Considerations**:
- **8-bit**: Most common (HP, items, flags)
- **16-bit**: Larger values (rupees, experience)
- **BCD**: Some counters (time, score)
- **Bit flags**: Multiple states in one byte

---

## Technical Patterns

### 65816 Assembly Patterns

**Subroutine Call Patterns**:
```asm
; Short call (same bank)
JSR $A5C2              ; Jump to subroutine
                       ; Return address pushed to stack

; Long call (different bank)
JSL $82A5C2            ; Long jump to subroutine
                       ; Bank + return address pushed

; Return patterns
RTS                    ; Return from subroutine (JSR)
RTL                    ; Return from long subroutine (JSL)
```

**Register Size Switching**:
```asm
REP #$20               ; Set A to 16-bit (accumulator)
REP #$10               ; Set X/Y to 16-bit (index)
REP #$30               ; Set both to 16-bit

SEP #$20               ; Set A to 8-bit
SEP #$10               ; Set X/Y to 8-bit
SEP #$30               ; Set both to 8-bit
```

**Direct Page Optimization**:
```asm
; Slow: Absolute addressing (3 bytes, 4 cycles)
LDA $7E0010

; Fast: Direct page (2 bytes, 3 cycles)
LDA $10                ; Assumes DP = $7E0000

; Setup direct page
LDA #$0000
TCD                    ; Transfer A to DP register
```

**Table Lookups**:
```asm
; Index-based lookup
LDA Table,X            ; A = Table[X]
STA $00                ; Store result

; Indirect lookup
LDA ($10),Y            ; A = [address at $10] + Y
```

### DMA Transfer Patterns

**VRAM DMA Pattern**:
```asm
REP #$20               ; 16-bit A
LDA #VRAM_DEST
STA $2116              ; Set VRAM address
SEP #$20               ; 8-bit A

LDA #$01
STA $4300              ; DMA mode: word, increment
LDA #$18
STA $4301              ; Destination: $2118 (VMDATAL)
LDA #<SOURCE_DATA
STA $4302              ; Source address low
LDA #>SOURCE_DATA
STA $4303              ; Source address high
LDA #^SOURCE_DATA
STA $4304              ; Source bank
LDA #<DATA_SIZE
STA $4305              ; Size low
LDA #>DATA_SIZE
STA $4306              ; Size high

LDA #$01
STA $420B              ; Trigger DMA channel 0
```

### Compression Schemes

**Common SNES Compression**:
- **RLE (Run-Length Encoding)**: Simple, fast decompression
- **LZ77 variants**: Better ratio, slower
- **Huffman**: Rare on SNES (CPU overhead)

**Detection Method**:
1. Find graphics in ROM (use tile viewer)
2. If tiles appear garbled, likely compressed
3. Set read breakpoint on compressed data
4. Observe decompression routine
5. Reverse engineer algorithm
6. Write decompressor/compressor

---

## Community Resources

### Essential Documentation

**SNESdev Wiki** (snes.nesdev.org)
- Memory map reference
- Hardware register documentation
- 65C816 instruction set
- Timing diagrams

**RetroReversing** (retroreversing.com)
- Game-specific reverse engineering guides
- Tool tutorials
- Development history

**ROM Hacking.net** (romhacking.net)
- Document library
- Utilities database
- Translation/hacking projects

**SMWCentral** (smwcentral.net)
- Super Mario World modding community
- ASM tutorials
- SMWDisC disassembly project

### Key Disassembly Projects

**SMWDisC** (Super Mario World Disassembly & Commentary)
- Fully commented SMW source code
- Labels, documentation, explanations
- Example of best practices

**Zelda 3 Disassembly** (zelda3-disasm)
- Complete 65816 assembly source
- Organized by ROM banks
- Buildable with WLA DX

**Various Pokémon Disassemblies**
- Shows pattern for handling large projects
- Asset extraction workflows
- Build system examples

### Community Best Practices

**From TASVideos Community**:
- Document RAM addresses in wikis
- Share Lua scripts for automation
- Collaborate on RNG understanding
- Build tool-assisted speedruns (TAS)

**From SMWCentral Community**:
- Use version control (git) for disassemblies
- Write comprehensive comments
- Test modifications on real hardware
- Share knowledge in tutorials

**From ROM Hacking.net Community**:
- Start small (palette swaps, text edits)
- Progress to complex (ASM hacks)
- Use existing tools before writing new ones
- Give back: document findings, release tools

---

## Development Timeline

### Typical SNES Game Development (1990-1995)

**Small Games** (6-7 months):
- Team: 4 programmers, 2 musicians, 6 artists
- Example: Spider-Man & X-Men in Arcade's Revenge

**Medium Games** (12-18 months):
- Team: 6-10 programmers, 3-4 musicians, 10-15 artists
- Example: Most first-party Nintendo titles

**Large Games** (24+ months):
- Team: 15+ programmers, multiple musicians, 20+ artists
- Example: Final Fantasy VI, Chrono Trigger

### Reverse Engineering Timeline Estimates

**Simple Palette/Graphics Hack**: 2-10 hours
- Identify graphics location
- Extract/edit with YY-CHR
- Test and release

**Text Translation**: 50-200 hours
- Create TBL file
- Extract all text
- Translate
- Reinsert (may require compression/table expansion)

**Gameplay Modification**: 100-500 hours
- Find relevant code via RAM search
- Understand mechanics
- Write ASM modifications
- Extensive testing

**Full Disassembly**: 500-2000+ hours
- Automated disassembly: 10 hours
- Manual cleanup: 100-200 hours
- Documentation: 400-1800 hours
- Often a multi-year community effort

---

## Advanced Topics

### Coprocessor Analysis

**SA-1 (Super Accelerator)**
- Additional 65816 CPU at 10MHz
- 2KB IRAM for fast code execution
- Pattern: Offload heavy calculations to SA-1

**SuperFX (GSU)**
- 16-bit RISC processor for 3D graphics
- Pattern: Polygon rendering, sprite scaling
- Requires specialized debugging

**DSP Chips (DSP-1, DSP-2, etc.)**
- Math coprocessor for rotation/scaling
- Pattern: Mode 7 enhancements
- Analysis: Set breakpoints on $3000-$3FFF

### Graphics Format Analysis

**Tile Formats**:
- **2bpp**: 4 colors per tile (16 bytes per 8×8 tile)
- **4bpp**: 16 colors per tile (32 bytes per 8×8 tile)
- **8bpp**: 256 colors per tile (64 bytes per 8×8 tile)

**Palette Format**:
- 15-bit BGR (5 bits per channel)
- Format: `0bbbbbgg gggrrrrr`
- CGRAM: 256 colors × 2 bytes = 512 bytes

**Tile Arrangement**:
- **Linear**: Tiles stored sequentially
- **Chunked**: 2×2 or 4×4 tile blocks
- **Interleaved**: Bitplanes separated

---

## Workflow Examples

### Example 1: Finding a Hidden Item

**Goal**: Locate code that gives you the hookshot in Zelda 3

**Steps**:
1. Use RAM search to find hookshot flag address (result: $7EF342 bit 0)
2. Set write breakpoint on $7EF342
3. Get hookshot in game
4. Breakpoint hits at $829A54
5. Analyze code:
   ```asm
   LDA $7EF342
   ORA #$01        ; Set bit 0 (hookshot obtained)
   STA $7EF342
   ```
6. Trace back through JSR calls to find event trigger
7. Document: "Event flag $AB triggers hookshot acquisition routine"

### Example 2: Understanding RNG

**Goal**: Reverse engineer Zelda 3 random number generator

**Steps**:
1. Observe random events (enemy spawn, drop rates)
2. Search for changing WRAM values during events
3. Find suspicious address $7E1A (changes every frame)
4. Set read/write breakpoints
5. Discover routine at $80D3B4:
   ```asm
   LDA $1A
   ASL A
   ASL A
   ASL A
   CLC
   ADC $1A
   INC A
   STA $1A
   ```
6. Reverse engineer: RNG = (RNG × 5 + 1) & 0xFF
7. Write Lua script to predict RNG
8. Use for TAS optimization

### Example 3: Complete Disassembly Workflow

**Goal**: Create buildable disassembly of Gradius III

**Steps**:
1. Use DiztinGUIsh for initial automated disassembly (10 hours)
2. Export to ASM files organized by bank
3. Use bsnes-plus debugger to identify routines:
   - Set breakpoints on game events
   - Label discovered routines
   - Add comments explaining behavior
4. Extract assets with snes2asm:
   - Graphics → data/graphics/
   - Audio → data/audio/
   - Text → data/text/
5. Create linker script (ld65) matching original ROM layout
6. Iteratively test build output:
   - Compare checksum with original
   - Play test for accuracy
   - Fix misidentified code/data
7. Document in README:
   - Build instructions
   - Memory map
   - Known issues/TODOs
8. Release on GitHub for community contribution

---

## Conclusion

SNES ROM reverse engineering combines:
- **Technical skills**: 65816 assembly, memory analysis, debugging
- **Tool proficiency**: Emulators, disassemblers, hex editors
- **Methodical approach**: Breakpoint-first, iterative discovery
- **Documentation**: RAM maps, function comments, project organization
- **Community collaboration**: Shared knowledge, open-source projects

**Remember**: Curiosity leads to knowledge. Every SNES game is a puzzle waiting to be understood.

---

## References

1. **RetroReversing**: https://www.retroreversing.com/snes/
2. **SNESdev Wiki**: https://snes.nesdev.org/wiki/Main_Page
3. **ROM Hacking.net**: https://www.romhacking.net/documents/
4. **SMWCentral**: https://www.smwcentral.net/
5. **TASVideos**: http://tasvideos.org/ReverseEngineering
6. **bsnes-plus Documentation**: https://bsnes.revenant1.net/documentation.html
7. **65816 Programming Manual**: Programming the 65816 (Western Design Center)
8. **SMWDisC Project**: All.log++ documentation
9. **Copetti's SNES Architecture**: https://www.copetti.org/writings/consoles/super-nintendo/

**Tools Referenced**:
- bsnes-plus, Snes9x, ZMZ (emulators)
- DiztinGUIsh, ca65/ld65, WLA DX, snes2asm (disassemblers)
- YY-CHR, Monkey-Moore, HxD, Ghidra (analysis tools)

---

**Last Updated**: October 2025
**Compiled by**: Claude Code research with community sources
**License**: Knowledge compilation for educational purposes
