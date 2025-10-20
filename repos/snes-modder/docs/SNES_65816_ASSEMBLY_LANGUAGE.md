# SNES 65816 Assembly Language - Complete Reference

## Table of Contents
1. [Introduction](#introduction)
2. [Processor Overview](#processor-overview)
3. [Registers](#registers)
4. [Processor Modes](#processor-modes)
5. [Addressing Modes](#addressing-modes)
6. [Instruction Set](#instruction-set)
7. [Memory Map](#memory-map)
8. [DMA and HDMA](#dma-and-hdma)
9. [PPU Integration](#ppu-integration)
10. [Programming Examples](#programming-examples)
11. [Best Practices](#best-practices)

## Introduction

The SNES uses a custom Ricoh 5A22 chip, which is based on the Western Design Center (WDC) 65816 processor. The 65816 is a 16-bit enhancement of the legendary 6502/65C02 processors, offering both 8-bit and 16-bit operation modes, 24-bit addressing (16MB of memory), and powerful new addressing modes.

### Key Features
- **Dual Mode Operation**: Can run in 6502 emulation mode or native 65816 mode
- **Variable Register Sizes**: Accumulator and index registers can be 8-bit or 16-bit
- **24-bit Addressing**: Can address up to 16MB of memory
- **Enhanced Instruction Set**: Superset of 65C02 with new powerful instructions
- **Stack Enhancements**: 16-bit stack pointer and stack-relative addressing
- **Direct Page**: Relocatable zero page anywhere in first 64KB

## Processor Overview

### Technical Specifications
- **Clock Speed**: 2.68 MHz (SlowROM) or 3.58 MHz (FastROM)
- **Data Bus**: 8 bits wide
- **Address Bus**: 24 bits wide (16MB addressable)
- **Instruction Set**: 92 instructions using 256 opcodes
- **Addressing Modes**: 24 different modes

### Architecture
The 65816 maintains backward compatibility with the 6502 while adding:
- 16-bit arithmetic and logic operations
- Block move instructions (MVN, MVP)
- New addressing modes for structured programming
- Enhanced interrupt handling

## Registers

### Primary Registers

#### Accumulator (A/C)
- **8-bit mode**: A (bits 0-7)
- **16-bit mode**: C (bits 0-15)
- Used for arithmetic, logic, and data operations
- Controlled by M flag (0=16-bit, 1=8-bit)

#### Index Registers (X, Y)
- Can be 8-bit or 16-bit
- Used for indexing, counting, and addressing
- Controlled by X flag (0=16-bit, 1=8-bit)
- When switching to 8-bit, high byte is forced to $00

#### Stack Pointer (S/SP)
- Always 16-bit in native mode
- Points to next available stack location
- Stack grows downward (decrements on push)
- Fixed to page 1 ($0100-$01FF) in emulation mode

#### Program Counter (PC)
- 16-bit register
- Points to next instruction to execute
- Combined with Program Bank Register for 24-bit addressing

### Bank Registers

#### Data Bank Register (DBR)
- 8-bit register
- Default bank for data operations
- Forms bits 16-23 of 24-bit address

#### Program Bank Register (PBR/K)
- 8-bit register
- Current code execution bank
- Forms bits 16-23 of program address

#### Direct Page Register (D/DP)
- 16-bit register
- Sets base address for direct page addressing
- Allows direct page to be relocated anywhere in bank $00

### Processor Status Register (P)

The status register contains 9 flags in native mode:

```
Native Mode:  N V M X D I Z C
Emulation:    N V - B D I Z C
```

- **N** (Negative): Set when result bit 7/15 is 1
- **V** (Overflow): Set on signed arithmetic overflow
- **M** (Memory/Accumulator): 0=16-bit A, 1=8-bit A
- **X** (Index): 0=16-bit X/Y, 1=8-bit X/Y
- **D** (Decimal): BCD mode (disabled on SNES)
- **I** (IRQ Disable): 1=IRQs disabled
- **Z** (Zero): Set when result is zero
- **C** (Carry): Set on arithmetic carry/borrow
- **B** (Break): Only in emulation mode
- **E** (Emulation): Hidden flag, not directly accessible

## Processor Modes

### Emulation Mode (6502 Compatible)
- SNES boots in this mode
- Registers limited to 8-bit
- Direct page fixed at $0000-$00FF
- Stack fixed at $0100-$01FF
- No bank registers accessible

#### Switching to Native Mode:
```assembly
CLC        ; Clear carry
XCE        ; Exchange carry with emulation flag
```

### Native Mode (65816 Full Features)
- Full 16-bit operation available
- All addressing modes available
- Bank registers accessible
- Relocatable direct page and stack

#### Switching to Emulation Mode:
```assembly
SEC        ; Set carry
XCE        ; Exchange carry with emulation flag
```

### Register Size Control

#### REP (Reset Processor Status Bits)
Clears (sets to 0) specified flags:
```assembly
REP #$30   ; Clear M and X flags (16-bit A/X/Y)
REP #$20   ; Clear M flag (16-bit A)
REP #$10   ; Clear X flag (16-bit X/Y)
```

#### SEP (Set Processor Status Bits)
Sets (sets to 1) specified flags:
```assembly
SEP #$30   ; Set M and X flags (8-bit A/X/Y)
SEP #$20   ; Set M flag (8-bit A)
SEP #$10   ; Set X flag (8-bit X/Y)
```

## Addressing Modes

### 1. Immediate
Load constant value directly:
```assembly
LDA #$1234    ; Load A with $1234 (16-bit)
LDX #$FF      ; Load X with $FF (8-bit)
```

### 2. Direct Page
Fast access to 256-byte direct page:
```assembly
LDA $10       ; Load from DP + $10
STA $20,X     ; Store to DP + $20 + X
```

### 3. Direct Page Indirect
Use direct page location as pointer:
```assembly
LDA ($10)     ; Load from address at DP + $10
STA ($20),Y   ; Store to address at DP + $20, indexed by Y
```

### 4. Absolute
Access any location in current data bank:
```assembly
LDA $1234     ; Load from DBR:$1234
STA $1234,X   ; Store to DBR:$1234 + X
```

### 5. Absolute Long
24-bit addressing to any bank:
```assembly
LDA $7E1234   ; Load from $7E:1234
STA $7F0000,X ; Store to $7F:0000 + X
```

### 6. Stack Relative
Access data on stack without popping:
```assembly
LDA $03,S     ; Load from stack offset 3
STA $05,S     ; Store to stack offset 5
```

### 7. Stack Relative Indirect Indexed
Powerful for local variables and arrays:
```assembly
LDA ($03,S),Y ; Load from pointer at stack+3, indexed by Y
```

### 8. Block Move
Transfer blocks of memory:
```assembly
MVN $7E,$7F   ; Move negative (decrement)
MVP $7E,$7F   ; Move positive (increment)
```

## Instruction Set

### Data Movement Instructions

#### Load Instructions
- **LDA**: Load Accumulator
- **LDX**: Load X Register
- **LDY**: Load Y Register

#### Store Instructions
- **STA**: Store Accumulator
- **STX**: Store X Register
- **STY**: Store Y Register
- **STZ**: Store Zero (65816 new)

#### Transfer Instructions
- **TAX**: Transfer A to X
- **TAY**: Transfer A to Y
- **TXA**: Transfer X to A
- **TYA**: Transfer Y to A
- **TXY**: Transfer X to Y (65816 new)
- **TYX**: Transfer Y to X (65816 new)
- **TCD**: Transfer C to Direct Page (65816 new)
- **TDC**: Transfer Direct Page to C (65816 new)
- **TCS**: Transfer C to Stack Pointer (65816 new)
- **TSC**: Transfer Stack Pointer to C (65816 new)

#### Stack Operations
- **PHA**: Push Accumulator
- **PHX**: Push X (65816 new)
- **PHY**: Push Y (65816 new)
- **PHB**: Push Data Bank (65816 new)
- **PHD**: Push Direct Page (65816 new)
- **PHK**: Push Program Bank (65816 new)
- **PHP**: Push Processor Status
- **PLA**: Pull Accumulator
- **PLX**: Pull X (65816 new)
- **PLY**: Pull Y (65816 new)
- **PLB**: Pull Data Bank (65816 new)
- **PLD**: Pull Direct Page (65816 new)
- **PLP**: Pull Processor Status

#### Special Push Instructions (65816 new)
- **PEA**: Push Effective Absolute Address
- **PEI**: Push Effective Indirect Address
- **PER**: Push Effective Relative Address

### Arithmetic Instructions

#### Addition/Subtraction
- **ADC**: Add with Carry
- **SBC**: Subtract with Borrow

#### Increment/Decrement
- **INC**: Increment Memory/Accumulator
- **INX**: Increment X
- **INY**: Increment Y
- **DEC**: Decrement Memory/Accumulator
- **DEX**: Decrement X
- **DEY**: Decrement Y

### Logical Instructions
- **AND**: Logical AND
- **ORA**: Logical OR
- **EOR**: Exclusive OR
- **BIT**: Test Bits
- **TRB**: Test and Reset Bits (65816 new)
- **TSB**: Test and Set Bits (65816 new)

### Shift/Rotate Instructions
- **ASL**: Arithmetic Shift Left
- **LSR**: Logical Shift Right
- **ROL**: Rotate Left
- **ROR**: Rotate Right

### Branch Instructions
- **BCC**: Branch if Carry Clear
- **BCS**: Branch if Carry Set
- **BEQ**: Branch if Equal (Zero set)
- **BNE**: Branch if Not Equal (Zero clear)
- **BMI**: Branch if Minus (Negative set)
- **BPL**: Branch if Plus (Negative clear)
- **BVC**: Branch if Overflow Clear
- **BVS**: Branch if Overflow Set
- **BRA**: Branch Always (65816 new)
- **BRL**: Branch Long (65816 new, ±32KB range)

### Jump/Call Instructions
- **JMP**: Jump
- **JML**: Jump Long (65816 new)
- **JSR**: Jump to Subroutine
- **JSL**: Jump to Subroutine Long (65816 new)
- **RTS**: Return from Subroutine
- **RTL**: Return from Subroutine Long (65816 new)
- **RTI**: Return from Interrupt

### Compare Instructions
- **CMP**: Compare Accumulator
- **CPX**: Compare X
- **CPY**: Compare Y

### System Instructions
- **NOP**: No Operation
- **WDM**: Reserved (William D. Mensch signature)
- **STP**: Stop Processor (65816 new)
- **WAI**: Wait for Interrupt (65816 new)
- **XBA**: Exchange B and A (65816 new)
- **XCE**: Exchange Carry and Emulation

### Block Transfer (65816 new)
- **MVN**: Move Block Negative (decrement)
- **MVP**: Move Block Positive (increment)

## Memory Map

### Bank $00-$3F, $80-$BF: System Area

```
$0000-$1FFF: Low RAM (8KB mirror pattern)
  $0000-$00FF: Direct Page (relocatable base)
  $0100-$01FF: Stack (in emulation mode)
  $0200-$1FFF: General RAM

$2000-$20FF: Unused
$2100-$213F: PPU Registers
$2140-$217F: APU Registers
$2180-$2183: WRAM Access Registers
$2184-$21FF: Unused
$2200-$3FFF: Expansion (usually unused)
$4000-$41FF: Controller Registers
$4200-$421F: CPU Registers
$4300-$437F: DMA Registers
$4380-$5FFF: Expansion
$6000-$7FFF: Enhancement Chip Registers (if present)
$8000-$FFFF: ROM (varies by mapping)
```

### Bank $7E-$7F: Work RAM
```
$7E0000-$7E1FFF: Low RAM Mirror
$7E2000-$7FFFFF: Extended RAM
$7F0000-$7FFFFF: Extended RAM (continued)
```

### ROM Mapping Modes

#### LoROM (Mode $20)
- ROM at $8000-$FFFF in banks $00-$7D
- Faster, simpler mapping
- Up to 4MB without special chips

#### HiROM (Mode $21)
- ROM at $0000-$FFFF in banks $C0-$FF
- More contiguous space
- Up to 4MB standard

## DMA and HDMA

### DMA (Direct Memory Access)

DMA allows high-speed data transfer without CPU intervention, essential for updating PPU memory during blanking periods.

#### DMA Registers (Per Channel, $43x0-$43x7)
- **$43x0**: DMA Control
- **$43x1**: DMA Destination
- **$43x2-4**: DMA Source Address
- **$43x5-6**: DMA Size
- **$43x7**: DMA Bank

#### DMA Transfer Modes
- **Mode 0**: 1 byte to fixed PPU register
- **Mode 1**: 2 bytes to 2 PPU registers
- **Mode 2**: 1 byte each to 2 PPU registers
- **Mode 3**: 2 bytes twice to 2 PPU registers
- **Mode 4**: 4 bytes to 1 PPU register
- **Mode 5**: 2 bytes each to 2 PPU registers
- **Mode 6**: 1 byte to fixed PPU register (reverse)
- **Mode 7**: 2 bytes to 2 PPU registers (reverse)

#### Example: DMA Transfer to VRAM
```assembly
LDA #$80
STA $2115      ; VRAM increment mode
LDX #$0000
STX $2116      ; VRAM address

LDX #$1801     ; DMA mode 01, to $2118
STX $4300
LDX #.loword(GraphicsData)
STX $4302
LDA #.bankbyte(GraphicsData)
STA $4304
LDX #$0800     ; Size
STX $4305

LDA #$01
STA $420B      ; Start DMA channel 0
```

### HDMA (Horizontal DMA)

HDMA performs small transfers during each scanline's H-Blank, enabling per-scanline effects.

#### HDMA Table Format
```assembly
HDMATable:
    .byte $10      ; 16 scanlines
    .byte $0F      ; Value for register
    .byte $08      ; 8 scanlines  
    .byte $07      ; Value for register
    .byte $00      ; Terminate
```

#### Common HDMA Effects
- **Color gradients**: Modify background color per scanline
- **Mode 7 effects**: Change rotation/scaling parameters
- **Window effects**: Create shaped windows
- **Scroll effects**: Wavy or perspective scrolling

## PPU Integration

### Key PPU Memory Types

#### VRAM (Video RAM)
- **Size**: 64KB (2 x 32KB chips)
- **Access**: During V-Blank, H-Blank, or Force Blank
- **Contents**: Tiles, tilemaps, sprite data

#### CGRAM (Color Graphics RAM)
- **Size**: 512 bytes (256 colors x 2 bytes)
- **Access**: During blanking periods only
- **Format**: 15-bit BGR (5 bits per channel)

#### OAM (Object Attribute Memory)
- **Size**: 544 bytes (128 sprites + high table)
- **Access**: During blanking periods only
- **Contents**: Sprite positions, tiles, attributes

### Important PPU Registers

#### Display Control
- **$2100**: Display control (brightness, force blank)
- **$2105**: Screen mode (0-7, different tile/color modes)
- **$2106**: Screen pixelation

#### VRAM Access
- **$2115**: VRAM increment mode
- **$2116-7**: VRAM address
- **$2118-9**: VRAM data write
- **$2139-A**: VRAM data read

#### CGRAM Access
- **$2121**: CGRAM address
- **$2122**: CGRAM data write

#### OAM Access
- **$2102-3**: OAM address
- **$2104**: OAM data write
- **$2138**: OAM data read

## Programming Examples

### Basic Initialization
```assembly
.proc InitSNES
    SEI                ; Disable interrupts
    CLC                ; Clear carry
    XCE                ; Native mode
    
    REP #$30           ; 16-bit A/X/Y
    
    LDX #$1FFF         ; Setup stack
    TXS
    
    PHK                ; Set data bank = program bank
    PLB
    
    SEP #$20           ; 8-bit A
    
    LDA #$80           ; Force blank
    STA $2100
    
    STZ $420C          ; Disable HDMA
    STZ $420B          ; Disable DMA
    
    ; Clear all RAM...
    ; Initialize PPU...
    ; Setup interrupts...
    
    CLI                ; Enable interrupts
    RTS
.endproc
```

### 16-bit Math Example
```assembly
; Multiply two 16-bit numbers using hardware multiplier
.proc Multiply16
    REP #$20           ; 16-bit A
    
    LDA Factor1
    STA $4202          ; Set multiplicand
    
    LDA Factor2
    SEP #$20           ; 8-bit A for second write
    STA $4203          ; Set multiplier (low byte)
    XBA
    STA $4203          ; Set multiplier (high byte)
    
    NOP                ; Wait 8 cycles
    NOP
    NOP
    NOP
    
    REP #$20           ; 16-bit A
    LDA $4216          ; Read 16-bit result
    RTS
.endproc
```

### Using Stack-Relative Addressing
```assembly
.proc LocalVariableExample
    PHD                ; Save direct page
    
    TSC                ; Transfer stack to C
    SEC
    SBC #$10           ; Allocate 16 bytes
    TCS                ; Update stack pointer
    TCD                ; Use as direct page
    
    ; Now $00-$0F are local variables
    
    LDA #$1234
    STA $00            ; Local variable 1
    
    LDA #$5678
    STA $02            ; Local variable 2
    
    ; Use variables...
    
    TSC
    CLC
    ADC #$10           ; Deallocate
    TCS
    
    PLD                ; Restore direct page
    RTS
.endproc
```

### DMA Transfer Pattern
```assembly
.proc DMATransfer
    ; Parameters: X = source, Y = dest, A = size
    
    STX $4302          ; Source address (low)
    STY $2116          ; VRAM destination
    STA $4305          ; Transfer size
    
    LDA #$01
    STA $4300          ; DMA mode
    
    LDA #$18
    STA $4301          ; Destination ($2118)
    
    LDA #^SourceData
    STA $4304          ; Source bank
    
    LDA #$01
    STA $420B          ; Execute DMA channel 0
    
    RTS
.endproc
```

## Best Practices

### 1. Mode Management
- Always know your current processor mode
- Use REP/SEP pairs to maintain consistency
- Document register sizes in comments

### 2. Stack Discipline
- Balance all pushes and pulls
- Be careful with 8/16-bit mismatches on stack
- Use stack-relative addressing for local variables

### 3. Interrupt Safety
- Save all modified registers
- Maintain consistent processor state
- Use SEI/CLI carefully around critical sections

### 4. DMA Usage
- Always use DMA for large transfers
- Perform DMA during V-Blank when possible
- Disable HDMA during DMA transfers

### 5. Bank Management
- Keep track of current data and program banks
- Use long addressing when crossing banks
- Be aware of bank boundaries

### 6. Performance Tips
- Use direct page for frequently accessed variables
- Align critical code/data on page boundaries
- Use lookup tables instead of calculations
- Leverage hardware multiplication/division

### 7. Memory Access
- Remember PPU registers need specific timing
- Use force blank for extensive PPU updates
- Buffer OAM/CGRAM updates in WRAM

### 8. Code Organization
```assembly
.segment "CODE"
.proc MainRoutine
    REP #$30       ; Document processor state
    ; A/X/Y = 16-bit
    
    ; Function body...
    
    RTS
.endproc
```

## Common Pitfalls and Solutions

### Register Size Confusion
**Problem**: Forgetting current register size
**Solution**: Always use REP/SEP explicitly, comment current state

### Stack Imbalance
**Problem**: Mismatched push/pull operations
**Solution**: Track stack operations, use structured programming

### Bank Wrapping
**Problem**: Accessing across bank boundaries
**Solution**: Use long addressing or ensure data fits in bank

### DMA Timing
**Problem**: DMA during active display corrupts graphics
**Solution**: Use V-Blank or force blank for DMA operations

### Direct Page Alignment
**Problem**: Slow direct page access when not aligned
**Solution**: Keep DP register at page boundary ($xx00)

## Conclusion

The 65816 assembly language provides a powerful and flexible instruction set for SNES development. Its dual 8/16-bit nature, enhanced addressing modes, and integration with the SNES's custom hardware (PPU, APU, DMA) make it ideal for creating sophisticated games and applications.

Key takeaways:
- Master the mode switching between 8-bit and 16-bit operations
- Leverage DMA/HDMA for efficient graphics updates
- Use the enhanced addressing modes for cleaner code
- Understand the memory map and hardware registers
- Always consider timing constraints when accessing PPU

With practice and understanding of these concepts, you can harness the full power of the SNES hardware through 65816 assembly programming.