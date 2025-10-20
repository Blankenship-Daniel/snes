# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

This is a SNES ROM reverse engineering project focused on The Legend of Zelda: A Link to the Past. The project features a unified TypeScript discovery database for tracking ROM discoveries with complete type safety and MCP server integration.

## Development Commands

```bash
# TypeScript build and test
npm run build    # Build TypeScript project
npm run test     # Run Vitest tests
npm run lint     # Run ESLint and type checking
npm run dev      # Development mode with hot reload

# Discovery database operations
npx tsx src/examples/discovery-usage.ts  # Run discovery examples
npm run typecheck  # TypeScript type checking only

# Install dependencies  
npm install      # Install all dependencies
```

## MCP Server Architecture

This project relies heavily on MCP (Model Context Protocol) servers for proper ROM analysis and modification. **Never use hardcoded offsets** - always query the appropriate MCP server.

### Available MCP Servers

1. **bsnes** - Advanced SNES emulator with comprehensive debugging tools ⭐ ACTIVE
   - Complete debugger with breakpoints, stepping, and tracing
   - Memory editor with real-time code/data highlighting  
   - Graphics viewers (tilemap, sprite/OAM, palette/CGRAM)
   - Full 65816 disassembler with all addressing modes
   - Memory mapping analysis (LoROM/HiROM detection)
   - **Currently integrated** for Zelda ROM reverse engineering

2. **zelda3** - Reverse engineered Zelda 3 written in C
   - Complete C implementation of A Link to the Past
   - Use for understanding game logic and structures
   - Source of truth for game mechanics

3. **zelda3-disasm** - Full disassembled Zelda 3 with semantic insights
   - Complete 65816 assembly with annotations
   - Contains semantic understanding of assembly code
   - Use for finding specific assembly routines and offsets
   - Primary source for ROM modification offsets

4. **snes-mcp-server** - SNES architecture and 65816 assembly documentation
   - Complete SNES hardware documentation
   - 65816 instruction set reference
   - Memory maps and register documentation
   - Use for hardware-level understanding

5. **snes9x** - Full SNES emulator implementation
   - Complete emulator source code
   - Use for understanding how SNES hardware actually works
   - Testing ground for ROM modifications

## Architecture Principles

### TypeScript-First Development
- **Complete TypeScript migration** - Zero Python files allowed
- **Type safety enforced** - Branded types prevent ROM offset mixing
- **Strict validation** - All discovery data validated with error throwing
- **MCP server integration** - All ROM data sourced from MCP servers

### Discovery Database System
The core of the project is a unified TypeScript discovery database:

```typescript
import { DiscoveryDatabase, ROMOffset, DiscoveryMethod } from './src/lib/DiscoveryDatabase';

// Type-safe discovery tracking
const db = new DiscoveryDatabase('./discoveries');
const discovery = new DiscoveryBuilder('item')
  .offset(ROMOffset(0x274F2))
  .size(ByteSize(2))
  .confidence(ConfidenceLevel.VERIFIED)
  .metadata({
    source: 'bsnes-plus debugger',
    method: DiscoveryMethod.TRACE_ANALYSIS,
    tags: new Set(['equipment'])
  })
  .build();
```

### Three-Agent Development Team (Unified)
- **Alex** (Architecture) - Type safety and proper patterns ✅ ALIGNED
- **Morgan** (Pragmatic) - Working features and performance ✅ ALIGNED  
- **Sam** (Maintainability) - Code quality and technical debt ✅ ALIGNED

### Code Standards
1. **TypeScript-only** - No Python code allowed
2. **Type-safe discovery tracking** - Use discovery database for all ROM data
3. **MCP server queries** - Never hardcode offsets
4. **Strict validation** - Metadata required, errors thrown on invalid data
5. **Test coverage** - Vitest for all new functionality

## Project Structure

TypeScript-first organization with comprehensive patterns for maintainability:

```
src/
├── lib/
│   └── DiscoveryDatabase.ts       # Core discovery database implementation
├── discovery/                     # Sam's TypeScript patterns framework
│   ├── types/
│   │   ├── core.types.ts          # Immutable interfaces with versioning
│   │   ├── guards.ts              # Runtime type safety and assertions
│   │   └── index.ts               # Clean barrel exports
│   ├── errors/
│   │   ├── boundaries.ts          # Error handling with retry/fallback
│   │   └── index.ts               # Error utilities and patterns
│   ├── __tests__/
│   │   ├── guards.test.ts         # Comprehensive type guard tests
│   │   ├── boundaries.test.ts     # Error boundary test patterns
│   │   └── test-setup.ts          # Test factories and utilities
│   ├── .eslintrc.js              # Strict ESLint rules for discovery code
│   ├── vitest.config.ts          # Test configuration with coverage
│   └── index.ts                   # Main barrel export
├── types/
│   └── rom-discovery.ts           # ROM-specific branded types
├── examples/
│   └── discovery-usage.ts         # Comprehensive usage examples
└── mods/                          # ROM modification implementations

Key Files:
├── docs/                          # Organized documentation
│   ├── ARCHITECTURE.md           # System design and patterns
│   ├── DISCOVERY_FRAMEWORK.md    # ROM analysis methodology
│   ├── SNES_65816_ASSEMBLY_LANGUAGE.md # Complete 65816 reference
│   └── *.md                      # Research and technical documentation
├── package.json                  # TypeScript/Node.js configuration
├── tsconfig.json                 # TypeScript strict mode settings
├── vite.config.ts                # Build and test configuration
├── CLAUDE.md                     # This file - development guidance
└── README.md                     # Project overview with pattern examples
```

## Critical Implementation Notes

### Discovery Workflow with TypeScript Database
1. **Query MCP servers** for ROM structures and offsets
2. **Store discoveries** in type-safe database with metadata
3. **Build relationships** between related discoveries
4. **Validate data integrity** with strict type checking
5. **Track modification attempts** with success/failure metadata

### TypeScript Patterns (Sam's Framework)

**Type Safety with Guards:**
```typescript
// ALWAYS: Use type guards at boundaries
import { isDiscovery, assertValidated, toROMAddress } from '@discovery/types';

// Safe input validation
if (isDiscovery(unknownData)) {
  assertValidated(unknownData); // Throws if not validated
  processDiscovery(unknownData); // TypeScript knows this is valid
}

// Branded types prevent address mixing
const address = toROMAddress(0x274F2); // Throws if invalid range
```

**Error Boundaries:**
```typescript
// ALWAYS: Use error boundaries for fallible operations
import { withRetry, tryCatch, Result } from '@discovery/errors';

// Safe operations with retry
const result = await withRetry(() => readROMData(address), {
  maxAttempts: 3,
  shouldRetry: (error) => !isValidationError(error)
});

// Result types for error handling
const operation: Result<Discovery> = tryCatch(() => parseROMData(bytes));
if (operation.success) {
  processDiscovery(operation.value);
} else {
  handleError(operation.error);
}
```

**Discovery Database Integration:**
```typescript
// ALWAYS: Use discovery database with proper validation
import { DiscoveryDatabase, ROMOffset, DiscoveryMethod } from '@lib/DiscoveryDatabase';
import { validateInput, createValidationError } from '@discovery/errors';

const db = new DiscoveryDatabase('./discoveries');

// Validate before adding
const discovery = new DiscoveryBuilder('item')
  .offset(ROMOffset(0x274F2))  // Branded type prevents mixing
  .metadata({
    source: 'zelda3-disasm MCP server',
    method: DiscoveryMethod.PATTERN_SCAN,
    tags: new Set(['equipment', 'save_init'])
  })
  .build();

// Type-safe validation
validateInput(discovery, isDiscovery, 'Invalid discovery object');
db.add(discovery);
```

**Testing Patterns:**
```typescript
// ALWAYS: Use test factories and utilities
import { DiscoveryFactory, TestUtils, expectTypeGuard } from '@discovery/test-setup';

// Create test data
const mockItem = DiscoveryFactory.createItem({ validated: true });
const mockSprites = DiscoveryFactory.createMixed(5);

// Test type guards
expectTypeGuard(isItemDiscovery, mockItem, mockSprites[0]);

// Test error scenarios
const flakeyFunction = TestUtils.createFlakeFunction(2, 'success');
const result = await withRetry(flakeyFunction);
```

## Testing Philosophy

- **TypeScript + Vitest** for all testing
- **Type safety** provides compile-time validation
- **Discovery database tests** in `src/examples/discovery-usage.ts`
- **Integration tests** with MCP servers for ROM analysis
- **No feature complete without tests** and type validation

## What NOT to Do

1. **Never write Python code** - TypeScript-only project with strict mode
2. **Never use `any` types** - All types must be explicit and branded
3. **Never use hardcoded offsets** - Query MCP servers and validate through discovery database
4. **Never skip metadata validation** - Source, method, tags required with error throwing
5. **Never create files with version suffixes** (`_v2`, `_final`, `_fixed`) - Use proper versioning
6. **Never bypass discovery database** - All ROM data goes through type-safe storage with validation
7. **Never commit ROM files** to the repository
8. **Never use type assertions (`as`)** - Use type guards and validation instead
9. **Never ignore error boundaries** - Use `tryCatch`, `withRetry`, and `Result` types
10. **Never skip tests** - All new functionality requires Vitest coverage

## Current State

The project has successfully completed its TypeScript migration with comprehensive patterns for maintainability and is actively working on bsnes MCP server integration for Zelda ROM reverse engineering.

### Progress Tracking System

**📋 CURRENT_STATUS.md** - This project uses a comprehensive status tracking system to maintain continuity across development sessions:

- **Purpose**: Provides detailed, real-time progress tracking with timestamps and checkboxes
- **Session Continuity**: Enables picking up exactly where work left off in future sessions  
- **Team Coordination**: Tracks individual agent contributions and current assignments
- **Phase Management**: Organizes work into clear phases with completion criteria
- **Integration Checkpoints**: Documents coordination points between team members

**When to Use**: Always check `CURRENT_STATUS.md` for the most up-to-date project state, current phase progress, immediate next actions, and session pickup points.

**Technical debt eliminated. Ready for ROM reverse engineering and modification work with bulletproof maintainability patterns.**

## Key Documentation Files

- **ZELDA_3.md** - Complete technical documentation of Zelda 3 game mechanics, ROM structure, and known glitches
- **ARCHITECTURE.md** - System design and architectural decisions
- **README.md** - Project overview and quick start guide

## Working with MCP Servers

### Example MCP Server Queries

```python
# Using zelda3-disasm to find functions
mcp__zelda3_disasm__find_functions(function_name="Link_ReceiveItem")

# Searching for memory addresses
mcp__snes_mcp_server__memory_map(address="$7E0000")

# Getting instruction documentation
mcp__snes_mcp_server__lookup_instruction(mnemonic="LDA")

# Analyzing game components
mcp__zelda3_disasm__analyze_game_components(component="sprite")
```

## 🔥 CRITICAL KNOWLEDGE: Three Essential ROM Discoveries

### THE BREAKTHROUGH TRILOGY (Never Forget These!)

Our team (Alex, Morgan, Sam) has successfully identified and documented three critical ROM modification points that enable reliable, safe modding of Zelda 3. These discoveries are the foundation of all our successful mods.

#### Discovery #1: Save Template Structure (ROM Offset 0x274C6)
**What:** The master template that defines what Link starts with in new games
**Location:** ROM offset `0x274C6` (without header)
**Size:** ~1280 bytes (0x500)
**Discovery Method:** CPU trace analysis during save creation + disassembly cross-reference

**Key Item Offsets** (from template base):
- `0x00`: Bow (0=none, 1=normal, 2=silver)
- `0x03`: Bombs (0-99)
- `0x16`: Flippers (0=no, 1=yes)
- `0x19`: Sword (0=none, 1=fighter, 2=master, 3=tempered, 4=gold)
- `0x1A`: Shield (0=none, 1=fighter, 2=fire, 3=mirror)
- `0x22-23`: Rupees (little-endian, e.g., 0xE7 0x03 = 999)
- `0x2C`: Health Current (hearts * 8, e.g., 0x50 = 10 hearts)
- `0x2D`: Health Maximum (hearts * 8)
- `0x37`: Arrows (0-99)

**Why This Works:** Game copies from ROM template to RAM during new game initialization. Modifying the template changes every new game permanently.

#### Discovery #2: Speed Table Structure (ROM Offset 0x3E228)
**What:** Table of 27 speed values controlling all movement states
**Location:** ROM offset `0x3E228` (without header)
**Size:** 27 bytes (one per movement state)
**Discovery Method:** Memory watching during different movement states

**Movement States:**
- Index 0: Normal walking (default: 0x08)
- Index 1: Pegasus boots running (default: 0x10)
- Index 2: Swimming (default: 0x06)
- Indices 3-26: Various other movement states

**Safe Modifications:**
- 2x multiplier: Proven safe for all states
- Values up to 0x20: Generally safe
- Values over 0x80: Risk of glitches

#### Discovery #3: Magic Cost System (ROM Offset 0x07B0AB)
**What:** LinkCheckMagicCost function that validates magic consumption
**Location:** ROM offset `0x07B0AB` (without header)
**Size:** 2-byte patch (SEC + RTL)
**Discovery Method:** CPU trace analysis during magic item usage

**Original Assembly:**
```assembly
LinkCheckMagicCost:
  LDA $7EF36E        ; Load current magic
  CMP.w $05EC        ; Compare with required magic
  BCC .insufficient  ; Branch if insufficient
  ; ... deduction logic ...
  SEC                ; Set carry (success)
  RTL                ; Return
```

**Infinite Magic Patch:**
```assembly
LinkCheckMagicCost_Infinite:
  SEC                ; Always set carry (success) - 0x38
  RTL                ; Return immediately - 0x6B
  ; Pad remaining bytes with NOP (0xEA)
```

### Universal Offset Calculation
```typescript
import { OffsetCalculator } from '../src/lib/ROMOffsets';

// Always use this pattern for any ROM modification
const hasHeader = OffsetCalculator.hasHeader(romSize);

// For save template modifications
const itemOffset = OffsetCalculator.getSaveTemplateItemOffset(0x2C, hasHeader); // Health

// For speed modifications  
const speedOffset = OffsetCalculator.getSpeedTableOffset(0, hasHeader); // Walking speed

// For magic modifications
const magicOffset = OffsetCalculator.getMagicCostOffset(hasHeader);
```

### Complete Documentation References
- **Architecture:** `docs/ROM_STRUCTURE_COMPLETE.md` - Alex's architectural analysis
- **Implementation:** `docs/MODDING_PATTERNS.md` - Morgan's practical patterns
- **Type Safety:** `src/lib/ROMOffsets.ts` - Sam's maintainable constants
- **Discovery Process:** `docs/OFFSET_DISCOVERY_LOG.md` - Complete methodology
- **Address Database:** `docs/VERIFIED_ADDRESSES.md` - Authoritative mapping

See individual documents for complete technical details and implementation examples.

## Important Context from Previous Work

The codebase previously contained numerous duplicate implementations attempting to modify ROM data. Common patterns that failed:
- Multiple "showcase" variants trying different approaches
- "Emergency fix" files attempting to patch previous attempts
- Hardcoded offsets leading to ROM corruption

This cleanup removed ~1500 Python files and 31 test ROM files to start fresh with proper architecture.