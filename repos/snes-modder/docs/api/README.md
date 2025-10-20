# SNES Modder API Documentation

Welcome to the comprehensive API documentation for the SNES Modder project. This documentation provides everything developers need to safely modify SNES ROMs using our TypeScript-based system.

## Table of Contents

- [Getting Started](#getting-started)
- [Core APIs](#core-apis)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)

## Getting Started

### Installation

```bash
npm install
npm run build
```

### Basic ROM Modification

```typescript
import { BinaryROMEngine } from '@/lib/BinaryROMEngine';
import { DiscoveryDatabase } from '@/lib/DiscoveryDatabase';

// Initialize the ROM engine
const engine = new BinaryROMEngine('./zelda3.smc');
await engine.initialize();

// Load existing discoveries
const db = new DiscoveryDatabase('./discoveries');
const healthDiscoveries = db.findByType('memory').filter(d => 
  d.tags?.has('health')
);

// Apply modification
const result = await engine.modifyByte(
  healthDiscoveries[0].address.rom,
  0xFF  // Max health
);
```

## Core APIs

### [BinaryROMEngine](./BinaryROMEngine.md)
Promise-based ROM modification system with transaction safety.

### [DiscoveryDatabase](./DiscoveryDatabase.md)
Type-safe discovery tracking and relationship management.

### [Type System](./TypeSystem.md)
Branded types and validation patterns for ROM safety.

### [Error Handling](./ErrorHandling.md)
Comprehensive error boundaries and retry mechanisms.

### [MCP Integration](./MCPIntegration.md)
Integration with Model Context Protocol servers for ROM analysis.

## Quick Reference

### Essential Types

```typescript
// ROM offsets and addresses
type ROMOffset = number & { readonly __brand: 'ROMOffset' };
type SNESAddress = string & { readonly __brand: 'SNESAddress' };

// Discovery categories
enum DiscoveryCategory {
  Item = 'item',
  Sprite = 'sprite',
  Memory = 'memory',
  Routine = 'routine'
}

// Confidence levels
enum ConfidenceLevel {
  Verified = 'verified',
  High = 'high',
  Medium = 'medium',
  Low = 'low'
}
```

### Common Operations

```typescript
// Read ROM data
const data = await engine.readBytes(address, size);

// Modify with transaction safety
const transaction = await engine.beginTransaction();
try {
  await transaction.modifyByte(address, newValue);
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}

// Query discoveries
const items = db.findByCategory(DiscoveryCategory.Item);
const healthData = db.findByTags(['health', 'player']);
```

## Safety Guidelines

1. **Always validate addresses** before modification
2. **Use transactions** for multi-byte modifications
3. **Create backups** before making changes
4. **Query MCP servers** for offset validation
5. **Test modifications** in emulator first

## Next Steps

- Read the [Development Guide](../guides/development.md)
- Explore [Code Examples](../examples/)
- Check [Troubleshooting Guide](../guides/troubleshooting.md)
- Review [Performance Tips](../guides/performance.md)