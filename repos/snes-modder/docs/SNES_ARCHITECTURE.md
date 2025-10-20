# SNES Architecture Reference

## Table of Contents
1. [System Overview](#system-overview)
2. [CPU Architecture](#cpu-architecture)
3. [Memory Architecture](#memory-architecture)
4. [Graphics System (PPU)](#graphics-system-ppu)
5. [Audio System (APU)](#audio-system-apu)
6. [DMA System](#dma-system)
7. [Programming Reference](#programming-reference)

---

## System Overview

The Super Nintendo Entertainment System (SNES) is a 16-bit game console featuring:
- **CPU**: Ricoh 5A22 (65c816-based) @ 3.58 MHz (FastROM) or 2.68 MHz (SlowROM)
- **PPU**: Dual-chip S-PPU for graphics processing
- **APU**: Sony SPC700 + DSP for audio
- **RAM**: 128KB WRAM, 64KB VRAM, 64KB ARAM
- **Resolution**: 256×224 (NTSC) / 256×240 (PAL), up to 512×448 (interlaced)

### System Architecture
```
┌─────────────┐     24-bit A-Bus      ┌──────────┐
│  65816 CPU  ├──────────────────────►│ Cartridge│
│   (5A22)    │                        │  ROM/RAM │
└──────┬──────┘                        └──────────┘
       │                                     │
    8-bit B-Bus                              │
       │                                     │
┌──────▼──────┐  ┌────────┐  ┌────────┐    │
│     PPU     │  │  WRAM  │  │  DMA   │◄───┘
│  (Graphics) │  │ (128KB)│  │ Control│
└─────────────┘  └────────┘  └────────┘
       │
┌──────▼──────┐
│  APU/SPC700 │
│   (Audio)   │
└─────────────┘
```

---

## CPU Architecture

### Ricoh 5A22 (65c816-based)
- **Architecture**: 16-bit with 8-bit compatibility mode
- **Registers**:
  - A: 16-bit Accumulator (or 8-bit in emulation mode)
  - X, Y: 16-bit Index registers
  - S: 16-bit Stack pointer
  - PC: 16-bit Program counter
  - P: 8-bit Processor status
  - DBR: 8-bit Data bank register
  - PBR: 8-bit Program bank register
  - D: 16-bit Direct page register

### CPU Speed
- **SlowROM**: 2.68 MHz (default)
- **FastROM**: 3.58 MHz (enabled via $420D)
- **WRAM Access**: Always 2.58 MHz regardless of ROM speed

### Key CPU Features
- 24-bit address space (16MB total)
- Native and emulation modes
- Block move instructions (MVN/MVP)
- Hardware multiplication/division ($4202-$4206)

---

## Memory Architecture

### Memory Map

#### Banks $00-$3F, $80-$BF: System Area
```
$0000-$1FFF  RAM (8KB mirror)
  $0000-$00FF  Direct Page (256 bytes)
  $0100-$01FF  Stack (256 bytes)
  $0200-$1FFF  General RAM (7.5KB)

$2000-$20FF  Unused
$2100-$213F  PPU Registers
$2140-$217F  APU Registers
$2180-$2183  WRAM Access Registers
$2184-$21FF  Unused PPU Area
$2200-$3FFF  Unused
$4000-$41FF  Controller Registers
$4200-$421F  CPU Registers
$4300-$437F  DMA Registers
$4380-$5FFF  Unused
$6000-$7FFF  Expansion (usually unused)
$8000-$FFFF  ROM (varies by mapping)
```

#### Bank $7E-$7F: WRAM
```
$7E0000-$7FFFFF  Work RAM (128KB)
  First 8KB mirrors to $0000-$1FFF in all banks
```

#### Banks $40-$7D: ROM Space
Used for extended ROM in HiROM games

#### Banks $C0-$FF: ROM Space
Primary ROM area for both LoROM and HiROM

### ROM Mapping Types

#### LoROM (Mode $20)
- ROM at $8000-$FFFF of banks $00-$7D
- Supports up to 4MB without special chips
- Most common for smaller games

#### HiROM (Mode $21)
- ROM at $0000-$FFFF of banks $C0-$FF
- ROM at $0000-$7FFF of banks $40-$7D
- Supports up to 6MB standard

---

## Graphics System (PPU)

### PPU Components
- **PPU1**: Renders tiles and sprites
- **PPU2**: Applies effects (windowing, color math, mosaic)
- **VRAM**: 64KB (32K×16-bit) for tiles and tilemaps
- **OAM**: 544 bytes for sprite attributes
- **CGRAM**: 512 bytes for palette (256 colors)

### Display Capabilities
- **Resolution**: 256×224 (NTSC) / 256×240 (PAL)
- **High-res modes**: 512×224/240, 512×448/480 (interlaced)
- **Colors**: 256 colors from 32,768 (15-bit RGB)
- **Sprites**: Up to 128 sprites, max 32 per scanline
- **Backgrounds**: Up to 4 background layers

### Background Modes
| Mode | BG1 | BG2 | BG3 | BG4 | Features |
|------|-----|-----|-----|-----|----------|
| 0 | 4 colors | 4 colors | 4 colors | 4 colors | 4 layers |
| 1 | 16 colors | 16 colors | 4 colors | - | Most common |
| 2 | 16 colors | 16 colors | OPT | - | Offset-per-tile |
| 3 | 256 colors | 16 colors | - | - | Direct color |
| 4 | 256 colors | 4 colors | OPT | - | Offset-per-tile |
| 5 | 16 colors | 4 colors | - | - | Hi-res |
| 6 | 16 colors | - | OPT | - | Hi-res + OPT |
| 7 | - | - | - | - | Mode 7 (rotation/scaling) |

### PPU Registers ($2100-$213F)
Key registers for ROM modding:
- `$2100`: Display control (brightness, forced blank)
- `$2105`: Background mode selection
- `$2115`: VRAM increment mode
- `$2116-17`: VRAM address
- `$2118-19`: VRAM data write
- `$2121`: CGRAM address
- `$2122`: CGRAM data write
- `$212C`: Main screen designation
- `$2131`: Color math control

### Sprite System (OAM)
- **Low Table**: 512 bytes (128 sprites × 4 bytes)
  - X position (8 bits)
  - Y position (8 bits)
  - Tile number (8 bits)
  - Attributes (8 bits)
- **High Table**: 32 bytes (2 bits per sprite)
  - X position MSB
  - Size toggle

---

## Audio System (APU)

### SPC700 Architecture
- **CPU**: 8-bit SPC700 @ 2.048 MHz
- **RAM**: 64KB dedicated Audio RAM
- **DSP**: 8 voice channels
- **Sample Format**: 16-bit BRR compressed
- **Output**: Stereo, 32 kHz

### APU Communication
CPU communicates with APU via I/O ports:
- `$2140-$2143`: Bidirectional data ports
- Standard protocol for uploading samples and music

### DSP Features
- 8 simultaneous voices
- ADSR envelope per voice
- Echo/reverb effects
- Noise generation
- Pitch modulation

---

## DMA System

### General DMA
- **8 channels** (0-7)
- **Transfer modes**:
  - Mode 0: 1 byte, 1 register
  - Mode 1: 2 bytes, 2 registers (word)
  - Mode 2-4: Special patterns
- **Control**: `$420B` triggers transfer
- **Speed**: ~2.68 MB/s

### HDMA (H-Blank DMA)
- Uses same 8 channels
- Transfers during H-Blank (between scanlines)
- Used for:
  - Gradient effects
  - Per-scanline scrolling
  - Dynamic color changes
- **Control**: `$420C` enables channels

### DMA Registers (Per Channel)
- `$43x0`: Control (direction, mode)
- `$43x1`: B-Bus address (PPU register)
- `$43x2-4`: A-Bus address (source)
- `$43x5-6`: Transfer size

---

## Programming Reference

### Common ROM Modifications

#### Health/Stats (Save Game Init)
Most games initialize save data from a table in ROM:
```
Common patterns:
$00-$0F: Game flags
$10-$1F: Player stats (health, magic, etc.)
$20-$2F: Inventory
$30-$3F: Equipment
```

#### 65816 Assembly Basics
```asm
; 8-bit mode
SEP #$20    ; Set 8-bit A
LDA #$20    ; Load value
STA $2100   ; Store to PPU

; 16-bit mode
REP #$20    ; Set 16-bit A
LDA #$1234  ; Load 16-bit value
STA $7E0000 ; Store to WRAM
```

#### DMA Transfer Example
```asm
; Transfer graphics to VRAM
LDA #$80
STA $2115     ; VRAM increment mode
LDX #$0000
STX $2116     ; VRAM address = $0000

LDA #$01
STA $4300     ; DMA mode (word)
LDA #$18
STA $4301     ; Target $2118 (VRAM data)
LDX #Source
STX $4302     ; Source address
LDA #^Source
STA $4304     ; Source bank
LDX #Size
STX $4305     ; Transfer size

LDA #$01
STA $420B     ; Start DMA channel 0
```

### ROM Header ($FFC0-$FFFF)
Important locations:
- `$FFD5`: ROM mapping mode
- `$FFD6`: ROM type
- `$FFD7`: ROM size
- `$FFD8`: SRAM size
- `$FFDC`: Checksum complement
- `$FFDE`: Checksum
- `$FFEA-$FFFF`: Interrupt vectors

### Interrupt Vectors
- `$FFEA`: Native COP
- `$FFEC`: Native BRK
- `$FFEE`: Native ABORT
- `$FFF0`: Native NMI (V-Blank)
- `$FFF4`: Native IRQ
- `$FFFA`: Emulation NMI
- `$FFFC`: Emulation RESET
- `$FFFE`: Emulation IRQ/BRK

---

## Quick Reference Tables

### CPU Flags (P Register)
| Bit | Flag | Description |
|-----|------|-------------|
| 7 | N | Negative |
| 6 | V | Overflow |
| 5 | M | Memory width (0=16-bit, 1=8-bit) |
| 4 | X | Index width (0=16-bit, 1=8-bit) |
| 3 | D | Decimal mode |
| 2 | I | IRQ disable |
| 1 | Z | Zero |
| 0 | C | Carry |

### Common PPU Effects
- **Forced Blank**: `LDA #$80 : STA $2100`
- **Full Brightness**: `LDA #$0F : STA $2100`
- **Enable BG1**: `LDA #$01 : STA $212C`
- **Mode 1**: `LDA #$01 : STA $2105`

### ROM Sizes
| Value | Size |
|-------|------|
| $08 | 256KB |
| $09 | 512KB |
| $0A | 1MB |
| $0B | 2MB |
| $0C | 4MB |
| $0D | 8MB |

---

## Additional Resources

### MCP Servers Available
- **snes-mcp-server**: Hardware documentation and instruction reference
- **zelda3-disasm**: Zelda 3 specific disassembly
- **snes9x**: Emulator integration for testing

### Key Memory Locations for Modding
- Save initialization tables (varies by game)
- Text/dialogue pointers
- Sprite/graphics data
- Music/sound pointers
- Game logic routines

### Testing Modifications
1. Always backup original ROM
2. Test in emulator first (SNES9x, bsnes)
3. Verify checksums if needed
4. Use save states for quick testing

---

*This document compiled from SNES hardware documentation, development manuals, and community research.*