# Developer Getting Started Guide

Welcome to SNES Modder development! This guide will get you up and running with safe ROM modifications in minutes.

## Prerequisites

### System Requirements

- **Node.js** 18+ with npm
- **TypeScript** 4.9+ (installed globally)
- **Git** for version control
- **SNES ROM file** (The Legend of Zelda: A Link to the Past recommended)
- **SNES Emulator** for testing (snes9x, zsnes, or bsnes recommended)

### Development Environment

```bash
# Verify Node.js version
node --version  # Should be 18.0.0 or higher

# Verify TypeScript
npx tsc --version  # Should be 4.9.0 or higher

# Install global dependencies (optional but recommended)
npm install -g typescript vitest
```

## Quick Start (5 Minutes)

### 1. Project Setup

```bash
# Clone the repository
git clone <repository-url>
cd snes-modder

# Install dependencies
npm install

# Build the project
npm run build

# Run tests to verify everything works
npm test
```

### 2. Get a ROM File

You'll need a valid SNES ROM file. For this guide, we recommend:
- **The Legend of Zelda: A Link to the Past** (zelda3.smc)
- File size should be 1MB (1,048,576 bytes)
- Place it in the project root directory

⚠️ **Legal Note**: Only use ROM files you legally own.

### 3. Your First Modification

Create a new file `my-first-mod.ts`:

```typescript
import { BinaryROMEngine } from './src/lib/BinaryROMEngine';

async function myFirstMod() {
  console.log('🎮 My First SNES Modification');
  
  // Initialize the ROM engine
  const engine = new BinaryROMEngine('./zelda3.smc');
  await engine.initialize();
  
  // Create a backup (ALWAYS do this first!)
  const backup = await engine.createBackup('My first modification');
  console.log(`💾 Backup created: ${backup.id}`);
  
  // Read Link's current health
  const currentHealth = await engine.readByte(0x274ED);
  console.log(`💖 Current health: ${currentHealth}`);
  
  // Give Link maximum health (255)
  const result = await engine.modifyByte(0x274ED, 255);
  if (result.success) {
    console.log(`✅ Health modified: ${result.originalValue} → ${result.newValue}`);
  }
  
  // Verify the change
  const newHealth = await engine.readByte(0x274ED);
  console.log(`✨ New health: ${newHealth}`);
  
  // Clean up
  await engine.close();
  console.log('🎉 First modification complete!');
}

// Run the modification
myFirstMod().catch(console.error);
```

Run it:

```bash
npx tsx my-first-mod.ts
```

### 4. Test in Emulator

1. Open your modified ROM in an SNES emulator
2. Load a save file or start a new game
3. Check Link's health - it should be at maximum!

🎉 **Congratulations!** You've made your first ROM modification.

## Core Concepts

### 1. The BinaryROMEngine

The `BinaryROMEngine` is your main interface for ROM operations:

```typescript
const engine = new BinaryROMEngine('./path/to/rom.smc');
await engine.initialize();  // Always call this first

// Read operations
const byte = await engine.readByte(address);
const bytes = await engine.readBytes(address, count);

// Write operations  
const result = await engine.modifyByte(address, value);
const results = await engine.modifyBytes(address, buffer);

// Always close when done
await engine.close();
```

### 2. Address Validation

Always validate addresses before modification:

```typescript
// Check if address is valid and writable
if (engine.validateAddress(0x274ED)) {
  await engine.modifyByte(0x274ED, 255);
} else {
  console.log('❌ Invalid address!');
}

// Get memory region information
const region = engine.getMemoryRegion(0x274ED);
console.log(`Region: ${region?.name}, Writable: ${region?.isWritable}`);
```

### 3. Transaction Safety

Use transactions for multi-byte modifications:

```typescript
const transaction = await engine.beginTransaction();

try {
  await transaction.modifyByte(0x274ED, 255);  // Health
  await transaction.modifyByte(0x274EE, 128);  // Magic
  await transaction.commit();
  console.log('✅ All modifications applied');
} catch (error) {
  await transaction.rollback();
  console.log('❌ Modifications rolled back');
}
```

### 4. Backup Management

Always create backups before modifications:

```typescript
// Create a backup
const backup = await engine.createBackup('Before health mod');

// If something goes wrong, restore
await engine.restoreBackup(backup.id);
```

## Discovery Database Integration

The discovery database provides metadata-driven ROM modifications:

### 1. Basic Usage

```typescript
import { DiscoveryDatabase } from './src/lib/DiscoveryDatabase';

const db = new DiscoveryDatabase('./discoveries');

// Find discoveries by category
const healthDiscoveries = db.findByCategory('memory')
  .filter(d => d.tags?.has('health'));

// Use discovery for safe modification
if (healthDiscoveries.length > 0) {
  const healthDiscovery = healthDiscoveries[0];
  await engine.modifyByte(healthDiscovery.address.rom, 255);
}
```

### 2. Creating Discoveries

```typescript
import { DiscoveryBuilder, DiscoveryCategory, ConfidenceLevel } from './src/discovery';

const discovery = new DiscoveryBuilder(DiscoveryCategory.Memory)
  .id('link_health')
  .name('Link Health Value')
  .description('Current health points for Link')
  .address({ rom: 0x274ED })
  .confidence(ConfidenceLevel.Verified)
  .tags(['health', 'player', 'save_data'])
  .metadata({
    dataType: 'uint8',
    validRange: { min: 0, max: 255 }
  })
  .build();

db.add(discovery);
```

## Common Modification Patterns

### 1. Player Stats Modification

```typescript
async function modifyPlayerStats(engine: BinaryROMEngine) {
  const STATS = {
    maxHealth: 0x274EC,
    currentHealth: 0x274ED,
    maxMagic: 0x274EE,
    currentMagic: 0x274EF
  };
  
  const backup = await engine.createBackup('Player stats modification');
  
  const transaction = await engine.beginTransaction();
  try {
    await transaction.modifyByte(STATS.maxHealth, 0x140);    // 20 hearts
    await transaction.modifyByte(STATS.currentHealth, 0x140);
    await transaction.modifyByte(STATS.maxMagic, 0x80);      // Full magic
    await transaction.modifyByte(STATS.currentMagic, 0x80);
    await transaction.commit();
    console.log('✅ Player stats maxed out!');
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Failed to modify stats:', error);
  }
}
```

### 2. Inventory Management

```typescript
async function giveAllItems(engine: BinaryROMEngine) {
  const INVENTORY_BASE = 0x27300;
  const ITEMS = {
    sword: { offset: 0x00, value: 0x04 },    // Golden Sword
    shield: { offset: 0x01, value: 0x03 },   // Mirror Shield
    bow: { offset: 0x02, value: 0x03 },      // Silver Bow
    bombs: { offset: 0x03, value: 0x32 },    // 50 bombs
    arrows: { offset: 0x04, value: 0x46 }    // 70 arrows
  };
  
  const transaction = await engine.beginTransaction();
  try {
    for (const [name, item] of Object.entries(ITEMS)) {
      await transaction.modifyByte(
        INVENTORY_BASE + item.offset,
        item.value
      );
      console.log(`✅ Gave ${name}`);
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

### 3. Safe Modification with Validation

```typescript
async function safeModification(
  engine: BinaryROMEngine,
  address: number,
  value: number,
  description: string
) {
  // Validate inputs
  if (!engine.validateAddress(address)) {
    throw new Error(`Invalid address: 0x${address.toString(16)}`);
  }
  
  if (value < 0 || value > 255) {
    throw new Error(`Invalid value: ${value} (must be 0-255)`);
  }
  
  // Create backup
  const backup = await engine.createBackup(description);
  
  try {
    // Read original value
    const originalValue = await engine.readByte(address);
    
    // Apply modification
    const result = await engine.modifyByte(address, value);
    
    if (result.success) {
      console.log(`✅ ${description}: 0x${originalValue.toString(16)} → 0x${value.toString(16)}`);
      return true;
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    // Restore on error
    await engine.restoreBackup(backup.id);
    console.error(`❌ ${description} failed:`, error);
    return false;
  }
}

// Usage
await safeModification(engine, 0x274ED, 255, 'Max health modification');
```

## Error Handling Best Practices

### 1. Comprehensive Error Handling

```typescript
import { BinaryROMError } from './src/lib/BinaryROMEngine';

async function robustModification() {
  let engine: BinaryROMEngine | null = null;
  
  try {
    engine = new BinaryROMEngine('./zelda3.smc');
    await engine.initialize();
    
    const result = await engine.modifyByte(0x274ED, 255);
    if (!result.success) {
      throw new Error(`Modification failed: ${result.error}`);
    }
    
  } catch (error) {
    if (error instanceof BinaryROMError) {
      console.error('ROM Error:', {
        message: error.message,
        operation: error.operation,
        address: error.address ? `0x${error.address.toString(16)}` : 'N/A',
        cause: error.cause?.message
      });
    } else {
      console.error('Unexpected error:', error);
    }
  } finally {
    // Always clean up
    if (engine) {
      await engine.close();
    }
  }
}
```

### 2. Validation Utilities

```typescript
// Create reusable validation functions
function validateROMFile(path: string): boolean {
  try {
    const stats = require('fs').statSync(path);
    const validSizes = [512 * 1024, 1024 * 1024, 2048 * 1024, 4096 * 1024];
    return validSizes.includes(stats.size);
  } catch {
    return false;
  }
}

function validateByteValue(value: any): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error('Value must be an integer');
  }
  if (value < 0 || value > 255) {
    throw new Error('Value must be between 0 and 255');
  }
  return value;
}

// Use in your modifications
if (!validateROMFile('./zelda3.smc')) {
  throw new Error('Invalid ROM file');
}

const safeValue = validateByteValue(userInput);
```

## Testing Your Modifications

### 1. Unit Testing

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BinaryROMEngine } from '../src/lib/BinaryROMEngine';

describe('Health Modification', () => {
  let engine: BinaryROMEngine;
  let backupId: string;
  
  beforeEach(async () => {
    engine = new BinaryROMEngine('./test-roms/zelda3.smc');
    await engine.initialize();
    
    const backup = await engine.createBackup('Test backup');
    backupId = backup.id;
  });
  
  afterEach(async () => {
    if (backupId) {
      await engine.restoreBackup(backupId);
    }
    await engine.close();
  });
  
  it('should modify health correctly', async () => {
    const originalHealth = await engine.readByte(0x274ED);
    
    const result = await engine.modifyByte(0x274ED, 255);
    expect(result.success).toBe(true);
    
    const newHealth = await engine.readByte(0x274ED);
    expect(newHealth).toBe(255);
  });
});
```

### 2. Integration Testing

```typescript
// Test with real emulator using automated scripts
async function testInEmulator() {
  // This would integrate with emulator APIs
  // to verify modifications work correctly
  console.log('🎮 Testing modifications in emulator...');
  
  // Apply modifications
  await modifyPlayerStats(engine);
  
  // Load in emulator and verify
  // (Implementation depends on emulator API)
  
  console.log('✅ Emulator testing complete');
}
```

## Development Workflow

### 1. Recommended Project Structure

```
my-rom-mod-project/
├── src/
│   ├── modifications/
│   │   ├── health-mod.ts
│   │   ├── inventory-mod.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   └── common.ts
│   └── main.ts
├── test/
│   ├── health-mod.test.ts
│   └── test-setup.ts
├── roms/
│   ├── zelda3.smc
│   └── .gitignore
├── backups/
│   └── .gitignore
└── package.json
```

### 2. Git Workflow

```bash
# Never commit ROM files
echo "*.smc" >> .gitignore
echo "*.sfc" >> .gitignore
echo "backups/*" >> .gitignore
echo "!backups/.gitignore" >> .gitignore

# Commit your modifications
git add src/
git commit -m "Add health modification feature"
```

### 3. Build Script

Add to your `package.json`:

```json
{
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "dev": "tsx --watch src/main.ts",
    "mod:health": "tsx src/modifications/health-mod.ts",
    "mod:inventory": "tsx src/modifications/inventory-mod.ts"
  }
}
```

## Next Steps

### 1. Learn Advanced Patterns

- Read the [Transaction Patterns Guide](../examples/transaction-patterns.ts)
- Study [Discovery Integration](../examples/discovery-integration.ts)
- Explore [Performance Optimization](./performance.md)

### 2. Contribute to Discovery Database

```typescript
// Find new ROM discoveries and contribute them
import { analyzeSaveData } from './src/scripts/analyze-save-data';

// Analyze ROM patterns
await analyzeSaveData('./zelda3.smc');

// Document your findings
const discovery = new DiscoveryBuilder(DiscoveryCategory.Memory)
  .name('New Discovery')
  .description('Description of what you found')
  // ... add details
  .build();
```

### 3. Build Complex Modifications

- **Save Editor**: Complete save game modification
- **Randomizer**: Randomize item locations
- **Difficulty Modifier**: Adjust game balance
- **Cosmetic Changes**: Modify graphics and text

### 4. Join the Community

- Check out the [MCP Server Documentation](../api/MCPIntegration.md)
- Explore [Troubleshooting Guide](./troubleshooting.md)
- Read about [Type System](../api/TypeSystem.md)

## Quick Reference

### Essential Commands

```bash
# Install and build
npm install && npm run build

# Run tests
npm test

# Type checking
npm run typecheck

# Development mode
npm run dev
```

### Key Addresses (Zelda 3)

```typescript
const ZELDA_ADDRESSES = {
  // Player stats
  maxHealth: 0x274EC,
  currentHealth: 0x274ED,
  maxMagic: 0x274EE,
  currentMagic: 0x274EF,
  
  // Equipment
  sword: 0x27359,
  shield: 0x2735A,
  
  // Inventory base
  inventory: 0x27300,
  
  // Save data region
  saveStart: 0x274C0,
  saveEnd: 0x274FB
};
```

### Safety Checklist

- [ ] ROM file is backed up externally
- [ ] Created backup with `createBackup()`
- [ ] Validated addresses with `validateAddress()`
- [ ] Used transactions for multi-byte operations
- [ ] Tested in emulator before real hardware
- [ ] Added proper error handling

🎉 **You're ready to start modifying ROMs safely!**

Need help? Check the [Troubleshooting Guide](./troubleshooting.md) or explore the [API Documentation](../api/).