# Testing Guide for ROM Modifications

This comprehensive guide covers testing strategies, patterns, and best practices for ensuring reliable ROM modifications in the SNES Modder system.

## Testing Philosophy

### Test Pyramid for ROM Modifications

```
    E2E Tests (Few)
   ╱─────────────────╲
  ╱  Emulator Testing  ╲
 ╱─────────────────────╲
╱   Integration Tests    ╲
─────────────────────────
     Unit Tests (Many)
```

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test ROM engine and database interactions
3. **E2E Tests** - Test complete modification workflows in emulators

### Safety-First Testing

- **Never test on original ROMs** - Always use copies
- **Backup before every test** - Automated backup creation
- **Validate modifications** - Verify changes are correct
- **Test error scenarios** - Ensure proper error handling
- **Performance testing** - Measure operation times

## Unit Testing

### Basic Test Setup

```typescript
// test-setup.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BinaryROMEngine } from '../src/lib/BinaryROMEngine';
import { DiscoveryDatabase } from '../src/lib/DiscoveryDatabase';
import { copyFileSync, unlinkSync, existsSync } from 'fs';

export class TestEnvironment {
  private backups: string[] = [];
  private engines: BinaryROMEngine[] = [];
  
  async createTestROM(sourcePath: string = './zelda3.smc'): Promise<string> {
    const testROMPath = `./test-roms/test-${Date.now()}.smc`;
    copyFileSync(sourcePath, testROMPath);
    return testROMPath;
  }
  
  async createEngine(romPath?: string): Promise<BinaryROMEngine> {
    const actualPath = romPath || await this.createTestROM();
    const engine = new BinaryROMEngine(actualPath);
    await engine.initialize();
    
    this.engines.push(engine);
    return engine;
  }
  
  async cleanup(): Promise<void> {
    // Close all engines
    await Promise.all(this.engines.map(e => e.close()));
    this.engines = [];
    
    // Clean up test ROMs
    for (const backup of this.backups) {
      if (existsSync(backup)) {
        unlinkSync(backup);
      }
    }
    this.backups = [];
  }
}

// Global test environment
let testEnv: TestEnvironment;

beforeEach(() => {
  testEnv = new TestEnvironment();
});

afterEach(async () => {
  await testEnv.cleanup();
});
```

### ROM Engine Unit Tests

```typescript
// BinaryROMEngine.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BinaryROMEngine, BinaryROMError } from '../src/lib/BinaryROMEngine';
import { TestEnvironment } from './test-setup';

describe('BinaryROMEngine', () => {
  let testEnv: TestEnvironment;
  let engine: BinaryROMEngine;
  
  beforeEach(async () => {
    testEnv = new TestEnvironment();
    engine = await testEnv.createEngine();
  });
  
  afterEach(async () => {
    await testEnv.cleanup();
  });
  
  describe('initialization', () => {
    it('should initialize with valid ROM file', async () => {
      const header = await engine.readHeader();
      expect(header.title).toBeDefined();
      expect(header.title.length).toBeGreaterThan(0);
    });
    
    it('should throw error for invalid ROM file', async () => {
      const invalidEngine = new BinaryROMEngine('./non-existent.smc');
      await expect(invalidEngine.initialize()).rejects.toThrow(BinaryROMError);
    });
  });
  
  describe('reading operations', () => {
    it('should read single byte correctly', async () => {
      const value = await engine.readByte(0x274ED);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(255);
    });
    
    it('should read multiple bytes correctly', async () => {
      const bytes = await engine.readBytes(0x274C0, 16);
      expect(bytes).toBeInstanceOf(Buffer);
      expect(bytes.length).toBe(16);
    });
    
    it('should throw error for invalid address', async () => {
      await expect(engine.readByte(0x999999)).rejects.toThrow(BinaryROMError);
    });
    
    it('should throw error for out of bounds read', async () => {
      await expect(engine.readBytes(0x3FFFF0, 32)).rejects.toThrow(BinaryROMError);
    });
  });
  
  describe('writing operations', () => {
    it('should modify single byte correctly', async () => {
      const originalValue = await engine.readByte(0x274ED);
      const newValue = originalValue === 255 ? 254 : 255;
      
      const result = await engine.modifyByte(0x274ED, newValue);
      
      expect(result.success).toBe(true);
      expect(result.originalValue).toBe(originalValue);
      expect(result.newValue).toBe(newValue);
      
      const verifyValue = await engine.readByte(0x274ED);
      expect(verifyValue).toBe(newValue);
    });
    
    it('should reject invalid byte values', async () => {
      await expect(engine.modifyByte(0x274ED, -1)).rejects.toThrow();
      await expect(engine.modifyByte(0x274ED, 256)).rejects.toThrow();
      await expect(engine.modifyByte(0x274ED, 1.5)).rejects.toThrow();
    });
    
    it('should reject writes to invalid addresses', async () => {
      await expect(engine.modifyByte(0x999999, 255)).rejects.toThrow(BinaryROMError);
    });
  });
  
  describe('backup operations', () => {
    it('should create backup successfully', async () => {
      const backup = await engine.createBackup('Test backup');
      
      expect(backup.id).toBeDefined();
      expect(backup.description).toBe('Test backup');
      expect(backup.size).toBeGreaterThan(0);
      expect(backup.timestamp).toBeInstanceOf(Date);
    });
    
    it('should restore from backup correctly', async () => {
      const originalValue = await engine.readByte(0x274ED);
      const backup = await engine.createBackup('Before modification');
      
      // Modify the ROM
      await engine.modifyByte(0x274ED, originalValue === 255 ? 254 : 255);
      const modifiedValue = await engine.readByte(0x274ED);
      expect(modifiedValue).not.toBe(originalValue);
      
      // Restore from backup
      await engine.restoreBackup(backup.id);
      const restoredValue = await engine.readByte(0x274ED);
      expect(restoredValue).toBe(originalValue);
    });
  });
  
  describe('transaction operations', () => {
    it('should commit transaction successfully', async () => {
      const transaction = await engine.beginTransaction();
      
      const originalHealth = await engine.readByte(0x274ED);
      const originalMagic = await engine.readByte(0x274EE);
      
      await transaction.modifyByte(0x274ED, 255);
      await transaction.modifyByte(0x274EE, 128);
      await transaction.commit();
      
      expect(await engine.readByte(0x274ED)).toBe(255);
      expect(await engine.readByte(0x274EE)).toBe(128);
    });
    
    it('should rollback transaction on error', async () => {
      const originalHealth = await engine.readByte(0x274ED);
      const originalMagic = await engine.readByte(0x274EE);
      
      const transaction = await engine.beginTransaction();
      
      try {
        await transaction.modifyByte(0x274ED, 255);
        await transaction.modifyByte(0x999999, 128); // Invalid address
        await transaction.commit();
        expect.fail('Should have thrown error');
      } catch (error) {
        await transaction.rollback();
      }
      
      // Values should be unchanged
      expect(await engine.readByte(0x274ED)).toBe(originalHealth);
      expect(await engine.readByte(0x274EE)).toBe(originalMagic);
    });
  });
  
  describe('validation', () => {
    it('should validate addresses correctly', () => {
      expect(engine.validateAddress(0x274ED)).toBe(true);
      expect(engine.validateAddress(0x000000)).toBe(true);
      expect(engine.validateAddress(0x3FFFFF)).toBe(true);
      expect(engine.validateAddress(-1)).toBe(false);
      expect(engine.validateAddress(0x400000)).toBe(false);
    });
    
    it('should return memory region information', () => {
      const region = engine.getMemoryRegion(0x274ED);
      expect(region).toBeDefined();
      expect(region?.name).toBeDefined();
      expect(region?.isWritable).toBeDefined();
    });
  });
});
```

### Discovery Database Tests

```typescript
// DiscoveryDatabase.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { DiscoveryDatabase, DiscoveryBuilder } from '../src/lib/DiscoveryDatabase';
import { DiscoveryCategory, ConfidenceLevel } from '../src/discovery/types/core.types';
import { toROMAddress } from '../src/discovery/types/guards';
import { unlinkSync, existsSync } from 'fs';

describe('DiscoveryDatabase', () => {
  let db: DiscoveryDatabase;
  const testDBPath = './test-discoveries.json';
  
  beforeEach(() => {
    // Clean up any existing test database
    if (existsSync(testDBPath)) {
      unlinkSync(testDBPath);
    }
    
    db = new DiscoveryDatabase(testDBPath);
  });
  
  afterEach(() => {
    if (existsSync(testDBPath)) {
      unlinkSync(testDBPath);
    }
  });
  
  describe('adding discoveries', () => {
    it('should add valid discovery', () => {
      const discovery = new DiscoveryBuilder(DiscoveryCategory.Memory)
        .id('test_health')
        .name('Test Health')
        .description('Test health value')
        .confidence(ConfidenceLevel.High)
        .build();
      
      db.add(discovery);
      
      const retrieved = db.get('test_health');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Health');
    });
    
    it('should reject duplicate IDs', () => {
      const discovery1 = new DiscoveryBuilder(DiscoveryCategory.Memory)
        .id('duplicate_id')
        .name('First Discovery')
        .description('First')
        .confidence(ConfidenceLevel.High)
        .build();
      
      const discovery2 = new DiscoveryBuilder(DiscoveryCategory.Memory)
        .id('duplicate_id')
        .name('Second Discovery')
        .description('Second')
        .confidence(ConfidenceLevel.High)
        .build();
      
      db.add(discovery1);
      expect(() => db.add(discovery2)).toThrow();
    });
  });
  
  describe('querying discoveries', () => {
    beforeEach(() => {
      // Add test data
      const discoveries = [
        new DiscoveryBuilder(DiscoveryCategory.Memory)
          .id('health_max')
          .name('Max Health')
          .description('Maximum health capacity')
          .confidence(ConfidenceLevel.Verified)
          .tags(['health', 'player'])
          .build(),
        
        new DiscoveryBuilder(DiscoveryCategory.Memory)
          .id('health_current')
          .name('Current Health')
          .description('Current health value')
          .confidence(ConfidenceLevel.Verified)
          .tags(['health', 'player'])
          .build(),
        
        new DiscoveryBuilder(DiscoveryCategory.Item)
          .id('sword_level')
          .name('Sword Level')
          .description('Current sword upgrade level')
          .confidence(ConfidenceLevel.High)
          .tags(['equipment', 'sword'])
          .build()
      ];
      
      discoveries.forEach(d => db.add(d));
    });
    
    it('should find by category', () => {
      const memoryDiscoveries = db.findByCategory(DiscoveryCategory.Memory);
      expect(memoryDiscoveries).toHaveLength(2);
      
      const itemDiscoveries = db.findByCategory(DiscoveryCategory.Item);
      expect(itemDiscoveries).toHaveLength(1);
    });
    
    it('should find by tags', () => {
      const healthDiscoveries = db.findByTags(['health']);
      expect(healthDiscoveries).toHaveLength(2);
      
      const playerDiscoveries = db.findByTags(['player']);
      expect(playerDiscoveries).toHaveLength(2);
      
      const equipmentDiscoveries = db.findByTags(['equipment']);
      expect(equipmentDiscoveries).toHaveLength(1);
    });
    
    it('should find by multiple tags (intersection)', () => {
      const healthPlayerDiscoveries = db.findByTags(['health', 'player']);
      expect(healthPlayerDiscoveries).toHaveLength(2);
      
      const healthEquipmentDiscoveries = db.findByTags(['health', 'equipment']);
      expect(healthEquipmentDiscoveries).toHaveLength(0);
    });
    
    it('should search by text', () => {
      const healthSearchResults = db.search('health');
      expect(healthSearchResults.length).toBeGreaterThanOrEqual(2);
      
      const swordSearchResults = db.search('sword');
      expect(swordSearchResults).toHaveLength(1);
    });
  });
  
  describe('persistence', () => {
    it('should persist and load discoveries', () => {
      const discovery = new DiscoveryBuilder(DiscoveryCategory.Memory)
        .id('persistent_test')
        .name('Persistent Test')
        .description('Test persistence')
        .confidence(ConfidenceLevel.Medium)
        .build();
      
      db.add(discovery);
      
      // Create new database instance (simulates restart)
      const db2 = new DiscoveryDatabase(testDBPath);
      
      const loaded = db2.get('persistent_test');
      expect(loaded).toBeDefined();
      expect(loaded?.name).toBe('Persistent Test');
    });
  });
});
```

## Integration Testing

### ROM Engine + Discovery Database Integration

```typescript
// integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BinaryROMEngine } from '../src/lib/BinaryROMEngine';
import { DiscoveryDatabase, DiscoveryBuilder } from '../src/lib/DiscoveryDatabase';
import { DiscoveryCategory, ConfidenceLevel } from '../src/discovery/types/core.types';
import { TestEnvironment } from './test-setup';

describe('ROM Engine + Discovery Database Integration', () => {
  let testEnv: TestEnvironment;
  let engine: BinaryROMEngine;
  let db: DiscoveryDatabase;
  
  beforeEach(async () => {
    testEnv = new TestEnvironment();
    engine = await testEnv.createEngine();
    db = new DiscoveryDatabase('./test-integration-discoveries.json');
  });
  
  afterEach(async () => {
    await testEnv.cleanup();
  });
  
  it('should use discoveries for safe ROM modification', async () => {
    // Add a known discovery
    const healthDiscovery = new DiscoveryBuilder(DiscoveryCategory.Memory)
      .id('link_health')
      .name('Link Health')
      .description('Current health value for Link')
      .confidence(ConfidenceLevel.Verified)
      .tags(['health', 'player'])
      .metadata({
        address: { rom: 0x274ED },
        dataType: 'uint8',
        validRange: { min: 0, max: 255 }
      })
      .build();
    
    db.add(healthDiscovery);
    
    // Use discovery for modification
    const discoveries = db.findByTags(['health']);
    expect(discoveries).toHaveLength(1);
    
    const discovery = discoveries[0];
    const romAddress = discovery.metadata?.address?.rom as number;
    
    // Verify address is valid
    expect(engine.validateAddress(romAddress)).toBe(true);
    
    // Read original value
    const originalValue = await engine.readByte(romAddress);
    
    // Modify using discovery
    const newValue = 255;
    const result = await engine.modifyByte(romAddress, newValue);
    
    expect(result.success).toBe(true);
    expect(result.originalValue).toBe(originalValue);
    expect(result.newValue).toBe(newValue);
    
    // Verify modification
    const verifyValue = await engine.readByte(romAddress);
    expect(verifyValue).toBe(newValue);
  });
  
  it('should validate discoveries against ROM structure', async () => {
    const discoveries = [
      {
        id: 'valid_address',
        address: 0x274ED,
        description: 'Valid health address'
      },
      {
        id: 'invalid_address',
        address: 0x999999,
        description: 'Invalid out-of-bounds address'
      }
    ];
    
    for (const disc of discoveries) {
      const isValid = engine.validateAddress(disc.address);
      
      if (disc.id === 'valid_address') {
        expect(isValid).toBe(true);
      } else {
        expect(isValid).toBe(false);
      }
    }
  });
  
  it('should handle discovery-driven batch modifications', async () => {
    // Add multiple related discoveries
    const playerDiscoveries = [
      {
        id: 'max_health',
        address: 0x274EC,
        value: 0x140, // 20 hearts
        description: 'Maximum health'
      },
      {
        id: 'current_health', 
        address: 0x274ED,
        value: 0x140,
        description: 'Current health'
      },
      {
        id: 'magic_power',
        address: 0x274EE,
        value: 0x80,
        description: 'Magic power'
      }
    ];
    
    // Store as discoveries
    for (const disc of playerDiscoveries) {
      const discovery = new DiscoveryBuilder(DiscoveryCategory.Memory)
        .id(disc.id)
        .name(disc.description)
        .description(disc.description)
        .confidence(ConfidenceLevel.High)
        .tags(['player', 'stats'])
        .metadata({ address: { rom: disc.address }, targetValue: disc.value })
        .build();
      
      db.add(discovery);
    }
    
    // Apply batch modifications using transaction
    const discoveries = db.findByTags(['player', 'stats']);
    expect(discoveries).toHaveLength(3);
    
    const backup = await engine.createBackup('Batch modification test');
    const transaction = await engine.beginTransaction();
    
    try {
      for (const discovery of discoveries) {
        const address = discovery.metadata?.address?.rom as number;
        const value = discovery.metadata?.targetValue as number;
        
        await transaction.modifyByte(address, value);
      }
      
      await transaction.commit();
      
      // Verify all modifications
      for (const disc of playerDiscoveries) {
        const currentValue = await engine.readByte(disc.address);
        expect(currentValue).toBe(disc.value);
      }
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  });
});
```

## Performance Testing

### Benchmark Suite

```typescript
// performance.test.ts
import { describe, it, expect } from 'vitest';
import { BinaryROMEngine } from '../src/lib/BinaryROMEngine';
import { TestEnvironment } from './test-setup';

interface PerformanceMetrics {
  operation: string;
  iterations: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
}

class PerformanceTester {
  private metrics: PerformanceMetrics[] = [];
  
  async measureOperation<T>(
    name: string,
    operation: () => Promise<T>,
    iterations: number = 100
  ): Promise<PerformanceMetrics> {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await operation();
      const end = performance.now();
      times.push(end - start);
    }
    
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    const averageTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    const metrics: PerformanceMetrics = {
      operation: name,
      iterations,
      totalTime,
      averageTime,
      minTime,
      maxTime
    };
    
    this.metrics.push(metrics);
    return metrics;
  }
  
  getReport(): string {
    const lines = ['Performance Test Report', '='.repeat(50)];
    
    for (const metric of this.metrics) {
      lines.push(
        `\n${metric.operation}:`,
        `  Iterations: ${metric.iterations}`,
        `  Average: ${metric.averageTime.toFixed(2)}ms`,
        `  Min: ${metric.minTime.toFixed(2)}ms`,
        `  Max: ${metric.maxTime.toFixed(2)}ms`,
        `  Total: ${metric.totalTime.toFixed(2)}ms`
      );
    }
    
    return lines.join('\n');
  }
}

describe('Performance Tests', () => {
  let testEnv: TestEnvironment;
  let engine: BinaryROMEngine;
  let perfTester: PerformanceTester;
  
  beforeEach(async () => {
    testEnv = new TestEnvironment();
    engine = await testEnv.createEngine();
    perfTester = new PerformanceTester();
  });
  
  afterEach(async () => {
    console.log(perfTester.getReport());
    await testEnv.cleanup();
  });
  
  it('should benchmark read operations', async () => {
    const readMetrics = await perfTester.measureOperation(
      'Single Byte Read',
      () => engine.readByte(0x274ED),
      1000
    );
    
    expect(readMetrics.averageTime).toBeLessThan(1); // Should be < 1ms on average
  });
  
  it('should benchmark write operations', async () => {
    const backup = await engine.createBackup('Performance test');
    
    try {
      const writeMetrics = await perfTester.measureOperation(
        'Single Byte Write',
        () => engine.modifyByte(0x274ED, 255),
        100
      );
      
      expect(writeMetrics.averageTime).toBeLessThan(10); // Should be < 10ms on average
    } finally {
      await engine.restoreBackup(backup.id);
    }
  });
  
  it('should benchmark transaction operations', async () => {
    const backup = await engine.createBackup('Transaction performance test');
    
    try {
      const transactionMetrics = await perfTester.measureOperation(
        'Small Transaction (2 operations)',
        async () => {
          const transaction = await engine.beginTransaction();
          await transaction.modifyByte(0x274ED, 255);
          await transaction.modifyByte(0x274EE, 128);
          await transaction.commit();
        },
        50
      );
      
      expect(transactionMetrics.averageTime).toBeLessThan(50); // Should be < 50ms on average
    } finally {
      await engine.restoreBackup(backup.id);
    }
  });
});
```

## Mock Testing

### Mock ROM Engine for Unit Tests

```typescript
// mocks/MockROMEngine.ts
export class MockROMEngine {
  private memory = new Map<number, number>();
  private backups = new Map<string, Map<number, number>>();
  private nextBackupId = 1;
  
  constructor() {
    // Initialize with some default values
    this.memory.set(0x274ED, 24); // Default health
    this.memory.set(0x274EE, 0);  // Default magic
  }
  
  async initialize(): Promise<void> {
    // Mock initialization
  }
  
  async close(): Promise<void> {
    // Mock cleanup
  }
  
  async readByte(address: number): Promise<number> {
    if (address < 0 || address > 0x3FFFFF) {
      throw new Error(`Invalid address: 0x${address.toString(16)}`);
    }
    
    return this.memory.get(address) ?? 0;
  }
  
  async readBytes(address: number, size: number): Promise<Buffer> {
    const buffer = Buffer.alloc(size);
    for (let i = 0; i < size; i++) {
      buffer[i] = await this.readByte(address + i);
    }
    return buffer;
  }
  
  async modifyByte(address: number, value: number): Promise<any> {
    if (address < 0 || address > 0x3FFFFF) {
      throw new Error(`Invalid address: 0x${address.toString(16)}`);
    }
    
    if (value < 0 || value > 255) {
      throw new Error(`Invalid byte value: ${value}`);
    }
    
    const originalValue = this.memory.get(address) ?? 0;
    this.memory.set(address, value);
    
    return {
      success: true,
      address,
      originalValue,
      newValue: value,
      timestamp: new Date()
    };
  }
  
  async createBackup(description: string = 'Mock backup'): Promise<any> {
    const id = `mock-backup-${this.nextBackupId++}`;
    this.backups.set(id, new Map(this.memory));
    
    return {
      id,
      description,
      timestamp: new Date(),
      size: this.memory.size
    };
  }
  
  async restoreBackup(backupId: string): Promise<void> {
    const backup = this.backups.get(backupId);
    if (!backup) {
      throw new Error(`Backup not found: ${backupId}`);
    }
    
    this.memory = new Map(backup);
  }
  
  validateAddress(address: number): boolean {
    return address >= 0 && address <= 0x3FFFFF;
  }
}
```

### Using Mocks in Tests

```typescript
// tests-with-mocks.test.ts
import { describe, it, expect } from 'vitest';
import { MockROMEngine } from './mocks/MockROMEngine';

describe('ROM Modification Logic (with mocks)', () => {
  it('should handle health modification correctly', async () => {
    const engine = new MockROMEngine();
    await engine.initialize();
    
    // Test the modification logic without actual ROM file
    const originalHealth = await engine.readByte(0x274ED);
    expect(originalHealth).toBe(24); // Mock default
    
    const result = await engine.modifyByte(0x274ED, 255);
    expect(result.success).toBe(true);
    expect(result.originalValue).toBe(24);
    expect(result.newValue).toBe(255);
    
    const newHealth = await engine.readByte(0x274ED);
    expect(newHealth).toBe(255);
  });
  
  it('should handle backup and restore correctly', async () => {
    const engine = new MockROMEngine();
    await engine.initialize();
    
    const originalHealth = await engine.readByte(0x274ED);
    const backup = await engine.createBackup('Test backup');
    
    // Modify the value
    await engine.modifyByte(0x274ED, 100);
    const modifiedHealth = await engine.readByte(0x274ED);
    expect(modifiedHealth).toBe(100);
    
    // Restore from backup
    await engine.restoreBackup(backup.id);
    const restoredHealth = await engine.readByte(0x274ED);
    expect(restoredHealth).toBe(originalHealth);
  });
});
```

## Error Testing

### Error Scenario Testing

```typescript
// error-scenarios.test.ts
import { describe, it, expect } from 'vitest';
import { BinaryROMEngine, BinaryROMError } from '../src/lib/BinaryROMEngine';
import { TestEnvironment } from './test-setup';

describe('Error Scenarios', () => {
  let testEnv: TestEnvironment;
  let engine: BinaryROMEngine;
  
  beforeEach(async () => {
    testEnv = new TestEnvironment();
    engine = await testEnv.createEngine();
  });
  
  afterEach(async () => {
    await testEnv.cleanup();
  });
  
  describe('file system errors', () => {
    it('should handle missing ROM file', async () => {
      const badEngine = new BinaryROMEngine('./non-existent.smc');
      await expect(badEngine.initialize()).rejects.toThrow();
    });
    
    it('should handle corrupted ROM file', async () => {
      // Create a corrupted ROM file for testing
      const corruptedPath = await testEnv.createTestROM();
      const fs = require('fs');
      fs.writeFileSync(corruptedPath, Buffer.alloc(100)); // Too small
      
      const corruptedEngine = new BinaryROMEngine(corruptedPath);
      await expect(corruptedEngine.initialize()).rejects.toThrow();
    });
  });
  
  describe('address validation errors', () => {
    it('should reject negative addresses', async () => {
      await expect(engine.readByte(-1)).rejects.toThrow(BinaryROMError);
      await expect(engine.modifyByte(-1, 255)).rejects.toThrow(BinaryROMError);
    });
    
    it('should reject out-of-bounds addresses', async () => {
      await expect(engine.readByte(0x400000)).rejects.toThrow(BinaryROMError);
      await expect(engine.modifyByte(0x400000, 255)).rejects.toThrow(BinaryROMError);
    });
  });
  
  describe('value validation errors', () => {
    it('should reject invalid byte values', async () => {
      await expect(engine.modifyByte(0x274ED, -1)).rejects.toThrow();
      await expect(engine.modifyByte(0x274ED, 256)).rejects.toThrow();
      await expect(engine.modifyByte(0x274ED, 1.5)).rejects.toThrow();
    });
  });
  
  describe('transaction errors', () => {
    it('should handle transaction rollback on error', async () => {
      const originalValue = await engine.readByte(0x274ED);
      const transaction = await engine.beginTransaction();
      
      try {
        await transaction.modifyByte(0x274ED, 255);
        await transaction.modifyByte(0x999999, 128); // Invalid address
        await transaction.commit();
        
        expect.fail('Should have thrown error');
      } catch (error) {
        await transaction.rollback();
        
        // Original value should be preserved
        const currentValue = await engine.readByte(0x274ED);
        expect(currentValue).toBe(originalValue);
      }
    });
  });
  
  describe('concurrent access errors', () => {
    it('should handle multiple simultaneous operations safely', async () => {
      const promises = [];
      
      // Start multiple concurrent read operations
      for (let i = 0; i < 10; i++) {
        promises.push(engine.readByte(0x274ED + (i % 4)));
      }
      
      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      
      // All results should be valid bytes
      results.forEach(result => {
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(255);
      });
    });
  });
});
```

## Test Utilities

### Custom Matchers

```typescript
// test-utils/matchers.ts
import { expect } from 'vitest';

expect.extend({
  toBeValidByte(received: number) {
    const pass = Number.isInteger(received) && received >= 0 && received <= 255;
    
    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a valid byte`
        : `Expected ${received} to be a valid byte (0-255 integer)`
    };
  },
  
  toBeValidROMAddress(received: number) {
    const pass = Number.isInteger(received) && received >= 0 && received <= 0x3FFFFF;
    
    return {
      pass,
      message: () => pass
        ? `Expected ${received} not to be a valid ROM address`
        : `Expected ${received} to be a valid ROM address (0x000000-0x3FFFFF)`
    };
  },
  
  toHaveBackupCreated(engine: any, backupId: string) {
    // Custom matcher to verify backup was created
    const pass = engine.hasBackup && engine.hasBackup(backupId);
    
    return {
      pass,
      message: () => pass
        ? `Expected backup ${backupId} not to exist`
        : `Expected backup ${backupId} to exist`
    };
  }
});

// Type declarations for custom matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidByte(): T;
    toBeValidROMAddress(): T;
    toHaveBackupCreated(backupId: string): T;
  }
  
  interface AsymmetricMatchersContaining {
    toBeValidByte(): any;
    toBeValidROMAddress(): any;
    toHaveBackupCreated(backupId: string): any;
  }
}
```

### Test Data Factories

```typescript
// test-utils/factories.ts
import { DiscoveryBuilder } from '../src/lib/DiscoveryDatabase';
import { DiscoveryCategory, ConfidenceLevel } from '../src/discovery/types/core.types';

export class TestDataFactory {
  private counter = 0;
  
  createHealthDiscovery(overrides: any = {}) {
    return new DiscoveryBuilder(DiscoveryCategory.Memory)
      .id(overrides.id || `health_${this.counter++}`)
      .name(overrides.name || 'Health Value')
      .description(overrides.description || 'Player health value')
      .confidence(overrides.confidence || ConfidenceLevel.High)
      .tags(overrides.tags || ['health', 'player'])
      .metadata(overrides.metadata || {
        address: { rom: 0x274ED },
        dataType: 'uint8'
      })
      .build();
  }
  
  createItemDiscovery(overrides: any = {}) {
    return new DiscoveryBuilder(DiscoveryCategory.Item)
      .id(overrides.id || `item_${this.counter++}`)
      .name(overrides.name || 'Test Item')
      .description(overrides.description || 'Test inventory item')
      .confidence(overrides.confidence || ConfidenceLevel.Medium)
      .tags(overrides.tags || ['item', 'inventory'])
      .metadata(overrides.metadata || {
        itemId: 42,
        address: { rom: 0x27300 }
      })
      .build();
  }
  
  createMultipleDiscoveries(count: number, type: DiscoveryCategory = DiscoveryCategory.Memory) {
    const discoveries = [];
    
    for (let i = 0; i < count; i++) {
      if (type === DiscoveryCategory.Memory) {
        discoveries.push(this.createHealthDiscovery({ 
          id: `test_memory_${i}`,
          name: `Memory Discovery ${i}`
        }));
      } else if (type === DiscoveryCategory.Item) {
        discoveries.push(this.createItemDiscovery({ 
          id: `test_item_${i}`,
          name: `Item Discovery ${i}`
        }));
      }
    }
    
    return discoveries;
  }
}
```

## Test Configuration

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Global test setup
    globalSetup: './test-utils/global-setup.ts',
    setupFiles: ['./test-utils/setup.ts'],
    
    // Test environment
    environment: 'node',
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/test-utils/**',
        'src/mocks/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Test timeout
    testTimeout: 30000,
    
    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    }
  }
});
```

### Test Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "test:integration": "vitest --run integration",
    "test:performance": "vitest --run performance",
    "test:unit": "vitest --run --exclude=\"**/*.integration.test.ts\" --exclude=\"**/*.performance.test.ts\""
  }
}
```

## Best Practices

### 1. Test Organization

```
tests/
├── unit/
│   ├── BinaryROMEngine.test.ts
│   ├── DiscoveryDatabase.test.ts
│   └── type-guards.test.ts
├── integration/
│   ├── rom-discovery-integration.test.ts
│   └── modification-workflows.test.ts
├── performance/
│   └── benchmark.test.ts
├── mocks/
│   ├── MockROMEngine.ts
│   └── MockDiscoveryDatabase.ts
└── utils/
    ├── factories.ts
    ├── matchers.ts
    └── setup.ts
```

### 2. Testing Checklist

- [ ] Unit tests for all public methods
- [ ] Integration tests for component interactions
- [ ] Error scenario testing
- [ ] Performance benchmarks
- [ ] Mock testing for isolation
- [ ] Edge case validation
- [ ] Concurrent operation testing
- [ ] Backup and recovery testing

### 3. Safety Guidelines

- **Never test on original ROMs** - Always use copies
- **Clean up after tests** - Remove test files and backups
- **Validate test data** - Ensure test ROMs are valid
- **Test error paths** - Verify proper error handling
- **Use realistic data** - Test with actual ROM patterns

### 4. Continuous Integration

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run unit tests
      run: npm run test:unit
      
    - name: Run integration tests
      run: npm run test:integration
      
    - name: Run performance tests
      run: npm run test:performance
      
    - name: Generate coverage report
      run: npm run test:coverage
      
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
```

Remember: **Good tests are the foundation of reliable ROM modifications.** Test thoroughly, test often, and always verify your modifications work correctly!