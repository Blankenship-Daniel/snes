# Complete ROM Structure Documentation
## Alex's Architectural Analysis

*Contributed by Alex (Architecture Specialist)*

## Overview

This document provides a comprehensive architectural view of The Legend of Zelda: A Link to the Past ROM structure, focusing on the critical data sections we've successfully identified and modified.

## ROM Header Detection

```typescript
interface ROMHeader {
  hasHeader: boolean;
  headerSize: number;
  totalSize: number;
}

function detectHeader(romBuffer: Buffer): ROMHeader {
  const size = romBuffer.length;
  const hasHeader = (size % 0x8000) === 0x200;
  return {
    hasHeader,
    headerSize: hasHeader ? 0x200 : 0,
    totalSize: size
  };
}
```

**Critical Discovery:** ROM files may have a 512-byte header that must be accounted for when calculating offsets.

## Memory Architecture Overview

### ROM vs RAM Address Spaces

```
ROM Address Space (LoROM):
┌─────────────────────────────────────────┐
│ 0x000000 - 0x3FFFFF: ROM Banks 00-3F   │
│ 0x400000 - 0x7FFFFF: ROM Banks 40-7F   │  
│ 0x800000 - 0xBFFFFF: ROM Banks 80-BF   │
│ 0xC00000 - 0xFFFFFF: ROM Banks C0-FF   │
└─────────────────────────────────────────┘

SNES RAM Address Space:
┌─────────────────────────────────────────┐
│ 0x7E0000 - 0x7EFFFF: WRAM Bank 7E      │
│ 0x7F0000 - 0x7FFFFF: WRAM Bank 7F      │
└─────────────────────────────────────────┘
```

**Architectural Principle:** ROM offsets define template data that gets copied to RAM at runtime. Modifying ROM templates changes initial game state.

## Critical Data Structures

### 1. Save Template Structure (ROM Offset 0x274C6)

```typescript
interface SaveTemplate {
  baseOffset: 0x274C6;  // Without header
  size: 0x500;          // Approximately 1280 bytes
  
  items: {
    bow: 0x00;           // +0x00 from base
    bombs: 0x03;         // +0x03 from base
    flippers: 0x16;      // +0x16 from base
    sword: 0x19;         // +0x19 from base
    shield: 0x1A;        // +0x1A from base
    arrows: 0x37;        // +0x37 from base
  };
  
  stats: {
    rupees: 0x22;        // +0x22 from base (little-endian 16-bit)
    healthCurrent: 0x2C; // +0x2C from base
    healthMaximum: 0x2D; // +0x2D from base
  };
}
```

**Architectural Significance:** This template is the master blueprint for new save files. Modifying it changes what every new game starts with.

### 2. Speed Table Structure (ROM Offset 0x3E228)

```typescript
interface SpeedTable {
  baseOffset: 0x3E228;  // Without header
  entryCount: 27;       // 27 different movement states
  entrySize: 1;         // Each speed value is 1 byte
  
  states: {
    walking: 0x00;      // Normal walking speed
    running: 0x01;      // Pegasus boots speed
    swimming: 0x02;     // Swimming speed
    // ... 24 more movement states
  };
}
```

**Speed Value Interpretation:**
- Values are relative multipliers
- 0x08 = normal speed
- 0x10 = 2x speed
- 0xFF = maximum speed (dangerous)

### 3. Magic Cost System (ROM Offset 0x07B0AB)

```assembly
; Original LinkCheckMagicCost function
LinkCheckMagicCost:
  LDA $7EF36E        ; Load current magic
  CMP.w $05EC        ; Compare with required magic
  BCC .insufficient  ; Branch if insufficient
  ; ... magic deduction logic
  SEC                ; Set carry (success)
  RTL

; Patched version for infinite magic
LinkCheckMagicCost_Infinite:
  SEC                ; Always set carry (success)
  RTL                ; Return immediately
```

**Architectural Pattern:** The game uses carry flag to indicate success/failure. Patching with SEC+RTL bypasses all magic consumption checks.

## ROM Layout Map

```
Zelda 3 ROM Layout (Without Header):
┌─────────────────────────────────────────┐
│ 0x000000 - 0x007FFF: System/Boot       │
│ 0x008000 - 0x00FFFF: Engine Code       │
│ 0x010000 - 0x017FFF: Game Logic        │
│ 0x018000 - 0x01FFFF: Graphics Data     │
│ 0x020000 - 0x027FFF: Audio Data        │
│ 0x028000 - 0x02FFFF: More Engine       │
│ ...                                     │
│ 0x274C6:            Save Template ⭐   │
│ ...                                     │
│ 0x3E228:            Speed Table ⭐      │
│ ...                                     │
│ 0x7B0AB:            Magic Check ⭐      │
│ ...                                     │
│ 0x200000 - End:     Extended Data      │
└─────────────────────────────────────────┘
```

## Address Translation System

### ROM to RAM Mapping (LoROM)

```typescript
function romToRam(romOffset: number): number | null {
  // LoROM mapping formula
  const bank = Math.floor(romOffset / 0x8000);
  const offset = romOffset % 0x8000;
  
  if (bank < 0x80) {
    return 0x808000 + (bank * 0x10000) + offset;
  } else {
    return 0x008000 + ((bank - 0x80) * 0x10000) + offset;
  }
}

function ramToRom(ramAddress: number): number | null {
  // Reverse mapping for debugging
  if (ramAddress >= 0x808000 && ramAddress < 0xC00000) {
    const bank = Math.floor((ramAddress - 0x808000) / 0x10000);
    const offset = (ramAddress - 0x808000) % 0x10000;
    return bank * 0x8000 + offset;
  }
  return null;
}
```

## Data Integrity Patterns

### Checksum Verification

```typescript
interface ROMChecksums {
  complement: number;   // Offset 0x7FDC
  checksum: number;     // Offset 0x7FDE
  
  validate(): boolean {
    return (this.complement ^ 0xFFFF) === this.checksum;
  }
}
```

**Critical:** Some emulators validate checksums. For production mods, checksums should be recalculated after ROM modifications.

### Safe Modification Zones

```typescript
const SAFE_MODIFICATION_ZONES = {
  saveTemplate: {
    start: 0x274C6,
    end: 0x279C6,
    description: "Save file template - safe to modify items/stats"
  },
  
  speedTable: {
    start: 0x3E228,
    end: 0x3E243,
    description: "Movement speed table - safe to modify values"
  },
  
  magicCheck: {
    start: 0x07B0AB,
    end: 0x07B0AD,
    description: "Magic cost check - safe to patch with SEC+RTL"
  }
} as const;
```

## Architectural Patterns for ROM Modification

### 1. Template Modification Pattern

**Use Case:** Changing initial game state
**Safety Level:** High (no runtime conflicts)
**Implementation:** Direct byte replacement in ROM template

### 2. Table Modification Pattern  

**Use Case:** Adjusting game mechanics (speed, damage, etc.)
**Safety Level:** Medium (affects gameplay balance)
**Implementation:** Systematic value replacement in data tables

### 3. Function Patch Pattern

**Use Case:** Disabling or modifying game logic
**Safety Level:** Low (requires assembly knowledge)
**Implementation:** Targeted instruction replacement

## Memory Map Integration

### Save RAM Layout (0x7EF000+)

```typescript
const SAVE_RAM_MAPPING = {
  items: {
    base: 0x7EF340,
    bow: 0x7EF340,      // Maps to save template +0x00
    bombs: 0x7EF343,    // Maps to save template +0x03
    sword: 0x7EF359,    // Maps to save template +0x19
    shield: 0x7EF35A,   // Maps to save template +0x1A
  },
  
  stats: {
    rupees: 0x7EF360,   // Maps to save template +0x22
    health: 0x7EF36C,   // Maps to save template +0x2C
    arrows: 0x7EF377,   // Maps to save template +0x37
  }
} as const;
```

**Architectural Insight:** The save template in ROM gets copied to specific RAM addresses during new game initialization.

## Future Expansion Areas

### Potential Discovery Zones

```typescript
const RESEARCH_TARGETS = {
  enemyStats: {
    approximateRange: [0x06D000, 0x07A000],
    description: "Enemy HP, damage, and behavior tables"
  },
  
  itemProperties: {
    approximateRange: [0x0B8000, 0x0C0000], 
    description: "Item behavior and interaction logic"
  },
  
  dungeonData: {
    approximateRange: [0x0A0000, 0x0B0000],
    description: "Room layouts and puzzle configurations"
  }
} as const;
```

## Conclusion

This architectural analysis provides the foundation for safe, reliable ROM modifications. The three critical discoveries (save template, speed table, magic check) represent different architectural patterns that can be applied to future modifications.

**Key Architectural Principles:**
1. **Template-based initialization** - Modify ROM templates to change initial state
2. **Table-driven mechanics** - Adjust data tables to modify game behavior  
3. **Function patching** - Replace critical functions for fundamental changes
4. **Address space separation** - Understand ROM vs RAM to avoid conflicts

---

*This document represents the architectural foundation for all ROM modification work. Changes to core data structures should reference these patterns for consistency and safety.*