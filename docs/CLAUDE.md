# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a unified SNES development ecosystem with a focused mission: **Create the definitive reverse-engineering and modding platform for The Legend of Zelda: A Link to the Past.** The workspace contains multiple specialized tools that work together to make Zelda 3 ROM modification incredibly simple and accessible.

### Vision: 30-Second ROM Mods
Transform the complex process of SNES ROM hacking into a simple, one-command experience:
```bash
./zelda3-modder-demo.sh infinite-magic
# → Instant: ready-to-play modded ROM
```

## Key Projects and Build Commands

### bsnes-plus (Enhanced SNES Emulator)
Located in: `bsnes-plus/`

```bash
# Standard build (performance profile)
cd bsnes-plus && make

# Build with accuracy profile (slower but more accurate)
cd bsnes-plus && make clean && make profile=accuracy

# Create distributable packages (macOS)
cd bsnes-plus && make dist

# Clean build
cd bsnes-plus && make clean
```

Built with Qt for GUI. Includes debugging tools: memory viewer, disassembler, breakpoints.

### snes-mcp-server (Development Tools Server)
Located in: `snes-mcp-server/`

```bash
# Install dependencies
npm install

# Development with hot reload
npm run dev

# Production build
npm run build

# Type checking
npm run typecheck

# Testing
npm test                    # Run all tests
npm run test:coverage       # With coverage report
npm run test:tools          # Test MCP tools
npm run test:performance    # Performance benchmarks

# ROM Analysis & Extraction
npm run test:rom            # Test ROM disassembly
npm run test:audio          # Test audio extraction
npm run extract:audio       # Extract audio from ROM
npm run extract:graphics    # Extract graphics from ROM
npm run extract:text        # Extract text from ROM

# Manual data processing
npm run parse-manuals       # Parse Nintendo dev manuals

# Production deployment
npm run start:production
```

MCP server exposing 14 tools for SNES development: instruction lookup, memory mapping, code generation, asset extraction, manual search.

### snes-modder (ROM Modification Toolkit)
Located in: `snes-modder/`

```bash
# Install dependencies
npm install

# Development
npm run build               # Full build
npm run dev                 # Watch mode
npm run typecheck           # Type check only

# Testing
npm run test                # Run all tests
npm run test:coverage       # With coverage
npm run test:validation     # Validation tests only

# Code quality
npm run lint                # Check linting
npm run lint:fix            # Fix linting issues
npm run format              # Format code
npm run format:check        # Check formatting

# Validation & reporting
npm run validate-mod        # Validate a mod
npm run generate-report     # Generate validation report
npm run list-verified       # List verified mods
npm run show-validation     # Show validation data
npm run explain-validation  # Explain validation methodology

# Build data
npm run build:validation-data  # Build validation database
```

TypeScript-based toolkit with mathematical validation, 3-layer verification, and 100% test coverage.

### zelda3 (C Reimplementation)
Located in: `zelda3/`

```bash
# Extract assets (required first step)
python3 assets/restool.py --extract-from-rom

# Build (requires zelda3.sfc ROM)
make

# Clean build
make clean all

# Parallel build (faster)
make -j$(nproc)

# Custom compiler
CC=clang make
```

**Requirements:**
- `zelda3.sfc` ROM file (SHA256: `66871d66be19ad2c34c927d6b14cd8eb6fc3181965b6e517cb361f7316009cfb`)
- SDL2 library
- Python 3.8+ with pillow, pyyaml

C reimplementation providing frame-accurate game logic understanding.

### zelda3-disasm (Assembly Disassembly + MCP Server)
Located in: `zelda3-disasm/`

```bash
# Install dependencies
npm install

# Build MCP server
npm run build

# Development mode
npm run dev

# Build the assembly project (requires WLA DX)
make                        # Build ROM from assembly
make graphics              # Build graphics only
make encodings             # Build encodings only
```

Full assembly disassembly with MCP server for code search and analysis.

### SNES_MiSTer (FPGA Implementation)
Located in: `SNES_MiSTer/`

Hardware project for MiSTer FPGA platform - uses Quartus Prime for synthesis. Provides hardware validation testing.

### snes2asm (Python Disassembler)
Located in: `snes2asm/`

```bash
# Install
sudo python setup.py install

# Disassemble ROM
snes2asm -c config.yaml -o output_dir game.smc

# Disassemble specific banks
snes2asm -b 0 1 2 -o output_dir game.smc

# Force ROM type
snes2asm --hirom -o output_dir game.smc
snes2asm --lorom -o output_dir game.smc

# Run tests
python3 -m unittest discover snes2asm.test -v

# Run specific test
python3 -m unittest snes2asm.test.test_cartridge -v

# Build disassembled project (requires WLA DX)
cd output_dir && make
```

Python-based disassembler with asset extraction (graphics, palettes, text), compression support (APLib, RLE, LZ variants), and buildable project generation.

## Unified Zelda 3 Modding Architecture

### The Complete Reverse-Engineering Ecosystem

This workspace implements a **unified approach** where each tool provides specialized capabilities that work together:

**Knowledge Layer** (Understanding the Game):
- **zelda3**: 70-80kLOC C reimplementation with frame-accurate game logic
- **zelda3-disasm**: Full assembly disassembly organized by ROM banks (32 banks) with MCP server
- **snes-mcp-server**: 14 MCP tools + Nintendo dev manual access (450+ pages)

**Analysis Layer** (Discovering Modifications):
- **bsnes-plus**: Qt-based hardware-accurate emulator with real-time debugger
- **snes-modder**: TypeScript toolkit with 3-layer mathematical validation system
- **snes2asm**: Python disassembly with YAML-driven configuration and asset extraction

**Implementation Layer** (Applying Modifications):
- **snes-modder**: Binary patching with 100% validation success rate
- **bsnes-plus**: Save file manipulation and runtime verification
- **SNES_MiSTer**: Hardware FPGA validation platform

### Core Architecture Patterns

#### MCP Protocol Integration

Both `snes-mcp-server` and `zelda3-disasm` implement Model Context Protocol:

**snes-mcp-server** provides:
- 14 specialized tools (instruction lookup, memory mapping, code generation, extraction)
- 10+ resource endpoints for documentation
- Full-text search across Nintendo dev manuals
- Pre-loaded manual data with MiniSearch indexing
- ROM parsing system supporting LoROM/HiROM/ExHiROM

**zelda3-disasm** provides:
- Code search across all assembly files
- Function discovery and analysis
- Component-level analysis (sprites, player, dungeons)
- File listing and reading with line numbers

#### ROM Analysis Workflow

1. **Format Detection**: Auto-detect LoROM/HiROM/ExHiROM with confidence scoring
2. **Header Parsing**: Extract metadata, checksums, ROM size
3. **Bank Analysis**: Identify code vs. data banks
4. **Disassembly**: 65816 instruction decoding with flow analysis
5. **Asset Extraction**: Graphics (2/4/8bpp), audio (BRR), text (custom encodings)
6. **Project Generation**: Create buildable assembly project with Makefile

#### Validation Architecture (snes-modder)

Three-layer validation system:

1. **Binary Verification**: SHA256 checksums, byte-level diff comparison
2. **Structural Validation**: ROM size, header integrity, bank organization
3. **Runtime Validation**: Emulator testing with gameplay verification

Each modification tracked with confidence scores (95.7% average).

#### Asset Extraction Pipeline

Shared across multiple tools (snes-mcp-server, snes2asm):

```
ROM → Format Detection → Decompression (RLE/LZ77/LZSS) → Format Decode → Output
                              ↓
                    2bpp/4bpp/8bpp graphics
                    BRR audio → WAV/FLAC
                    Custom text encoding → UTF-8
                    Level data → Structured format
```

#### Cross-Tool Workflows

**Discovery Workflow**:
1. Use `zelda3-disasm` MCP server to search assembly for patterns
2. Use `bsnes-plus` debugger to trace runtime behavior
3. Use `snes-mcp-server` to lookup hardware register details
4. Cross-reference with `zelda3` C source for game logic understanding
5. Document findings in `snes-modder` discovery database

**Modification Workflow**:
1. Identify ROM addresses via `zelda3-disasm` or `snes2asm`
2. Create binary patches in `snes-modder`
3. Apply 3-layer validation
4. Test in `bsnes-plus` emulator
5. Validate on `SNES_MiSTer` hardware (optional)

#### Testing Strategy

Per-project testing approaches:

- **bsnes-plus**: Game compatibility testing, timing validation, debugger verification
- **snes-mcp-server**: vitest unit/integration tests, ROM fixtures, performance benchmarks
- **snes-modder**: vitest with 100% coverage, validation pipeline testing, binary verification
- **zelda3**: Frame-by-frame comparison with original ROM via snapshot replay
- **snes2asm**: unittest framework with round-trip testing (disassemble → reassemble)

## Practical Workflows

### Quick Mod Creation (Production Ready)
```bash
# Pre-built ROM mods - instant creation
./zelda3-modder-demo.sh infinite-magic
./zelda3-modder-demo.sh 2x-speed
./zelda3-modder-demo.sh max-hearts
./zelda3-modder-demo.sh ultimate

# Validate all mods
./validate-mods.sh

# Runtime validation with emulator
./ultimate-runtime-validation.sh
```

Available mods: `infinite-magic`, `max-hearts`, `2x-speed`, `intro-skip`, `quick-start`, `team-solution`, `ultimate`

### Discovery Workflow (Finding New Modifications)

**Step 1: Search Assembly**
```bash
cd zelda3-disasm
# Use MCP server to search for patterns
# Example: Find magic-related code
npm run build && node dist/index.js
```

**Step 2: Analyze in C Source**
```bash
cd zelda3
# Search C reimplementation for logic understanding
grep -r "magic" src/
```

**Step 3: Debug Runtime Behavior**
```bash
cd bsnes-plus
# Build and run with debugger
make
./bsnes+.app/Contents/MacOS/bsnes+ path/to/zelda3.smc
# Use debugger: memory viewer, breakpoints, disassembler
```

**Step 4: Lookup Hardware Details**
```bash
cd snes-mcp-server
# Use MCP tools for instruction/register info
npm run dev
# Query tools: lookup_instruction, memory_map, register_info
```

**Step 5: Create Modification**
```bash
cd snes-modder
# Implement binary patch based on findings
# Build validation database
npm run build
npm run test:validation
```

### Full Disassembly Workflow

**Using snes2asm (Python)**:
```bash
cd snes2asm
# Create YAML config describing ROM structure
# Disassemble with asset extraction
snes2asm -c config.yaml -o output_dir zelda3.smc

# Build reassembled ROM (requires WLA DX)
cd output_dir && make
```

**Using zelda3-disasm (Assembly)**:
```bash
cd zelda3-disasm
# Already disassembled - just build
make

# Or use MCP server for analysis
npm run build
npm run start
```

### Asset Extraction Workflow

**Extract from ROM using snes-mcp-server**:
```bash
cd snes-mcp-server
npm install

# Extract all assets
npm run extract:graphics
npm run extract:audio
npm run extract:text

# Test extraction
npm run test:rom
npm run test:audio
```

**Extract using snes2asm with YAML config**:
```bash
# Define decoders in YAML config
snes2asm -c zelda3-config.yaml -o output zelda3.smc
# Graphics, palettes, text extracted to output/
```

### Validation and Testing

**Binary validation**:
```bash
# Validate ROM modifications
./validate-mods.sh

# Shows byte-level differences and checksums
```

**Runtime validation**:
```bash
# Test mods in actual emulator
./ultimate-runtime-validation.sh

# Runs bsnes-plus with frame testing
```

**Unit testing**:
```bash
# snes-modder
cd snes-modder && npm test

# snes-mcp-server
cd snes-mcp-server && npm test

# snes2asm
cd snes2asm && python3 -m unittest discover snes2asm.test -v
```

## Key Files and Locations

```
snes/
├── bsnes-plus/          # Enhanced SNES emulator
│   ├── bsnes/           # Core emulator
│   ├── ui-qt/           # Qt interface
│   └── plugins/         # Extension modules
├── snes-mcp-server/     # Development tools server
│   ├── src/             # TypeScript source
│   └── SNESDevManual/   # Nintendo documentation
├── snes-modder/         # ROM modification toolkit
├── zelda3/              # C reimplementation
│   └── src/             # Game source code
├── SNES_MiSTer/         # FPGA implementation
│   └── rtl/             # Hardware description
└── snes2asm/            # Python disassembler
```

## Getting Started

### Prerequisites

**Required for ROM Modding:**
- **Zelda 3 US ROM** (SHA256: `66871d66be19ad2c34c927d6b14cd8eb6fc3181965b6e517cb361f7316009cfb`)
- **Bash shell** (macOS/Linux/WSL on Windows)

**Required for Development:**
- **Node.js 18+**: For TypeScript projects (snes-mcp-server, snes-modder, zelda3-disasm)
- **Python 3.8+**: For snes2asm and zelda3 asset extraction
  - Install: `python3 -m pip install pillow pyyaml`
- **C++ toolchain**: For bsnes-plus and zelda3
  - macOS: Xcode Command Line Tools
  - Linux: `build-essential` package
- **SDL2**: For zelda3 builds
  - macOS: `brew install sdl2`
  - Ubuntu/Debian: `sudo apt install libsdl2-dev`
  - Fedora: `sudo dnf install SDL2-devel`
  - Arch: `sudo pacman -S sdl2`

**Optional Tools:**
- **WLA DX Assembler**: For building disassembled projects (snes2asm, zelda3-disasm)
- **Qt 5**: For bsnes-plus GUI (usually auto-detected by build system)
- **Quartus Prime**: For SNES_MiSTer FPGA synthesis

### Quick Start (Instant ROM Mods)

```bash
# 1. Place your ROM
cp /path/to/zelda3.smc .

# 2. Create a mod instantly
./zelda3-modder-demo.sh infinite-magic

# 3. Play the modded ROM
# Output: zelda3-infinite-magic-YYYYMMDD.smc
```

### Development Setup

**TypeScript Projects (snes-mcp-server, snes-modder, zelda3-disasm):**
```bash
cd <project-dir>
npm install
npm run build
npm test
```

**C Projects (bsnes-plus, zelda3):**
```bash
# zelda3
cd zelda3
python3 -m pip install -r requirements.txt
python3 assets/restool.py --extract-from-rom
make

# bsnes-plus
cd bsnes-plus
make
```

**Python Projects (snes2asm):**
```bash
cd snes2asm
sudo python setup.py install
python3 -m unittest discover snes2asm.test -v
```

### Project Maturity Status

| Project | Status | Description |
|---------|--------|-------------|
| **snes-modder** | 🟢 Production | Pre-built mods work instantly, 100% validation |
| **bsnes-plus** | 🟢 Stable | Mature emulator with debugger |
| **zelda3** | 🟢 Playable | Complete C reimplementation, start to finish |
| **snes-mcp-server** | 🟢 Operational | 14 tools, full manual access |
| **zelda3-disasm** | 🟡 Active Dev | MCP server + buildable assembly |
| **snes2asm** | 🟡 Functional | Core disassembly works, YAML config supported |
| **SNES_MiSTer** | 🔵 Hardware | FPGA platform for hardware validation |

**Production Ready**: Instant ROM mods (infinite magic, 2x speed, max hearts, etc.) with binary validation.

**Active Development**: MCP server orchestration, natural language mod composition, advanced asset extraction.