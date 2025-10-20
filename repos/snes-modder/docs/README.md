# SNES Modder - TypeScript Discovery Database

A unified, type-safe SNES ROM reverse engineering toolkit featuring a complete discovery database for tracking ROM structures, items, sprites, and game logic with full TypeScript type safety and MCP server integration.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run discovery database examples
npx tsx src/examples/discovery-usage.ts

# Build TypeScript
npm run build

# Run tests
npm test

# Type checking
npm run typecheck
```

### Discovery Database Example

```typescript
import { DiscoveryDatabase, ROMOffset, DiscoveryMethod } from './src/lib/DiscoveryDatabase';

// Create type-safe discovery database
const db = new DiscoveryDatabase('./discoveries');

// Add a ROM discovery with strict validation
const discovery = new DiscoveryBuilder('item')
  .offset(ROMOffset(0x274F2))
  .size(ByteSize(2))
  .confidence(ConfidenceLevel.VERIFIED)
  .metadata({
    source: 'bsnes-plus debugger',
    method: DiscoveryMethod.TRACE_ANALYSIS,
    tags: new Set(['equipment', 'save_init'])
  })
  .build();

db.add(discovery);

// Type-safe queries
const items = db.findByType('item');
const verified = db.getVerified();
```

## 📁 Project Structure

```
snes-modder/
├── src/
│   ├── lib/
│   │   └── DiscoveryDatabase.ts       # Core discovery database
│   ├── discovery/                     # Sam's TypeScript patterns
│   │   ├── types/                     # Type guards and core types
│   │   ├── errors/                    # Error boundaries and handling
│   │   ├── __tests__/                 # Vitest test patterns
│   │   └── index.ts                   # Clean barrel exports
│   ├── types/
│   │   └── rom-discovery.ts           # ROM-specific types
│   ├── examples/
│   │   └── discovery-usage.ts         # Usage examples
│   └── mods/                          # ROM modification implementations
├── docs/                              # Organized documentation
│   ├── ARCHITECTURE.md               # System design
│   ├── DISCOVERY_FRAMEWORK.md        # ROM analysis framework
│   ├── SNES_65816_ASSEMBLY_LANGUAGE.md # 65816 reference
│   └── *.md                          # Other technical docs
├── CLAUDE.md                         # Development guidance
├── README.md                         # This file
└── package.json                      # TypeScript configuration
```

## 🛠️ Technology Stack

- **TypeScript 5.3** - Type-safe development with strict mode
- **Vite** - Lightning fast build tool
- **Vitest** - Unit testing framework with comprehensive coverage
- **ESLint/Prettier** - Code quality enforcement
- **Node.js 18+** - Runtime environment with ESM modules

## 🎮 Available Mods

### Master Sword Mod
Start Zelda 3 with the Master Sword:

```typescript
import { MasterSwordMod } from 'snes-modder';

const mod = new MasterSwordMod('zelda3.sfc');
mod.apply();
mod.save('zelda3_mastersword.sfc');
```

## 🔧 Development

### Architecture Patterns
- **Type-safe ROM operations** with branded types preventing address mixing
- **Error boundaries** with retry logic and graceful failure handling
- **Discovery tracking** with immutable data structures and versioning
- **MCP server integration** for all ROM data sourcing

### Testing Framework
```bash
# Run tests with coverage
npm test

# Test UI for debugging
npm run test:ui

# Coverage thresholds enforced
npm run test:coverage
```

### Code Quality Standards
```bash
# Strict TypeScript checking
npm run typecheck

# ESLint with discovery-specific rules
npm run lint

# Prettier formatting
npm run format
```

## 📚 Documentation Structure

### Core Documentation
- **[CLAUDE.md](./CLAUDE.md)** - Development guidance for AI agents
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - System design and patterns
- **[docs/DISCOVERY_FRAMEWORK.md](./docs/DISCOVERY_FRAMEWORK.md)** - ROM analysis methodology

### Technical References
- **[docs/SNES_65816_ASSEMBLY_LANGUAGE.md](./docs/SNES_65816_ASSEMBLY_LANGUAGE.md)** - Complete 65816 reference
- **[docs/VERIFIED_ITEM_MAPPINGS.md](./docs/VERIFIED_ITEM_MAPPINGS.md)** - Known ROM structures
- **[docs/SYSTEM_ARCHITECTURE.md](./docs/SYSTEM_ARCHITECTURE.md)** - Technical architecture

### Research Documentation
- **[docs/DISCOVERY_SYSTEM_COMPLETE.md](./docs/DISCOVERY_SYSTEM_COMPLETE.md)** - Research methodologies
- **[docs/ROM_MODIFICATION_OPPORTUNITIES.md](./docs/ROM_MODIFICATION_OPPORTUNITIES.md)** - Modding guides

## 🎯 TypeScript Patterns (Sam's Framework)

### Type Safety
```typescript
// Branded types prevent mixing ROM offsets
import { ROMAddress, toROMAddress } from './src/discovery/types';
const address = toROMAddress(0x123456); // Throws if invalid

// Type guards at runtime boundaries
import { isDiscovery, assertValidated } from './src/discovery/types';
if (isDiscovery(data)) {
  assertValidated(data); // Type-safe validation
}
```

### Error Boundaries
```typescript
// Safe operations with retry logic
import { withRetry, tryCatch } from './src/discovery/errors';
const result = await withRetry(() => readROMData(address));

// Result types for error handling
import type { Result } from './src/discovery/types';
const operation: Result<Discovery> = tryCatch(() => parseROMData(bytes));
```

### Testing Patterns
```typescript
// Comprehensive test utilities
import { DiscoveryFactory, TestUtils } from './src/discovery/test-setup';
const mockDiscovery = DiscoveryFactory.createItem({ validated: true });
```

## 🤝 Development Team

**Unified TypeScript implementation** by our AI team:
- **Alex** - Architecture and type system design ✅ ALIGNED
- **Morgan** - Rapid implementation and shipping ✅ ALIGNED  
- **Sam** - Code quality and technical debt ✅ ALIGNED

**Current Status**: All agents aligned on TypeScript-only development with comprehensive patterns for maintainability.

## 📄 License

MIT