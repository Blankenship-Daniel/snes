# ROM Modification Troubleshooting Guide

This comprehensive guide helps you diagnose and fix common issues when working with the SNES Modder system.

## Quick Diagnosis

### Symptoms Checklist

**ROM Loading Issues:**
- [ ] ROM file exists and is readable
- [ ] ROM file is valid SNES format (.smc/.sfc)
- [ ] ROM file size is correct (512KB - 4MB)
- [ ] ROM header is not corrupted

**Modification Failures:**
- [ ] Address is within ROM bounds
- [ ] Address is in writable region  
- [ ] Value is valid byte (0-255)
- [ ] No file system permissions issues

**Transaction Problems:**
- [ ] Transaction was properly initialized
- [ ] All operations within transaction scope
- [ ] No concurrent access to ROM file
- [ ] Sufficient disk space for operations

## Common Error Categories

### 1. ROM File Errors

#### Error: "Invalid ROM file format"

```typescript
BinaryROMError: Invalid ROM file format
  operation: "initialize"
  address: undefined
```

**Causes:**
- File is not a valid SNES ROM
- File is corrupted or truncated
- File has incorrect header structure

**Solutions:**

```typescript
// Verify ROM file integrity
import { readFileSync } from 'fs';

function verifyROMFile(romPath: string): boolean {
  try {
    const stats = require('fs').statSync(romPath);
    const validSizes = [512 * 1024, 1024 * 1024, 2048 * 1024, 4096 * 1024];
    
    if (!validSizes.includes(stats.size)) {
      console.log(`❌ Invalid ROM size: ${stats.size} bytes`);
      return false;
    }
    
    // Check for common ROM file signatures
    const buffer = readFileSync(romPath);
    const headerOffset = 0x7FC0; // LoROM header location
    const title = buffer.slice(headerOffset, headerOffset + 21).toString('ascii');
    
    if (title.length === 0 || title.includes('\0'.repeat(10))) {
      console.log(`❌ Invalid or empty ROM title`);
      return false;
    }
    
    console.log(`✅ ROM appears valid: "${title.trim()}"`);
    return true;
    
  } catch (error) {
    console.log(`❌ Error reading ROM file: ${error}`);
    return false;
  }
}

// Use before initializing engine
if (verifyROMFile('./zelda3.smc')) {
  const engine = new BinaryROMEngine('./zelda3.smc');
  await engine.initialize();
}
```

#### Error: "ROM file is read-only"

**Causes:**
- File system permissions
- ROM file is on read-only media
- File is currently open in another application

**Solutions:**

```bash
# Check file permissions
ls -la zelda3.smc

# Fix permissions (Unix/Mac)
chmod 644 zelda3.smc

# Windows PowerShell
Get-Acl zelda3.smc
```

```typescript
// Check write permissions before opening
import { access, constants } from 'fs/promises';

async function checkROMWritable(romPath: string): Promise<boolean> {
  try {
    await access(romPath, constants.R_OK | constants.W_OK);
    return true;
  } catch (error) {
    console.log(`❌ ROM file not writable: ${error.message}`);
    return false;
  }
}
```

### 2. Address Validation Errors

#### Error: "Address out of bounds"

```typescript
BinaryROMError: Address out of bounds
  operation: "readByte"
  address: 0x500000
```

**Causes:**
- Address exceeds ROM size
- Address is negative
- Using SNES memory address instead of ROM offset

**Solutions:**

```typescript
// Address validation utility
function validateROMAddress(address: number, romSize: number): boolean {
  if (address < 0) {
    console.log(`❌ Negative address: 0x${address.toString(16)}`);
    return false;
  }
  
  if (address >= romSize) {
    console.log(`❌ Address 0x${address.toString(16)} exceeds ROM size 0x${romSize.toString(16)}`);
    return false;
  }
  
  return true;
}

// Convert SNES address to ROM offset if needed
function snesAddressToROM(snesAddress: string): number {
  // Example: "$00:8000" -> 0x000000 (LoROM)
  const match = snesAddress.match(/\$([0-9A-Fa-f]{2}):([0-9A-Fa-f]{4})/);
  if (!match) {
    throw new Error(`Invalid SNES address format: ${snesAddress}`);
  }
  
  const bank = parseInt(match[1], 16);
  const offset = parseInt(match[2], 16);
  
  // LoROM mapping logic
  if (bank >= 0x00 && bank <= 0x7F && offset >= 0x8000) {
    return (bank * 0x8000) + (offset - 0x8000);
  }
  
  throw new Error(`Unsupported SNES address: ${snesAddress}`);
}
```

#### Error: "Address is not writable"

**Causes:**
- Trying to write to ROM header area
- Writing to computed checksum areas
- Address in read-only memory region

**Solutions:**

```typescript
// Define writable regions for Zelda 3
const WRITABLE_REGIONS = [
  { name: 'Save Data', start: 0x274C0, end: 0x274FB },
  { name: 'Player Stats', start: 0x274EC, end: 0x274F1 },
  { name: 'Inventory', start: 0x27300, end: 0x2737F },
  // Add more regions as discovered
];

function isAddressWritable(address: number): boolean {
  return WRITABLE_REGIONS.some(region => 
    address >= region.start && address <= region.end
  );
}

function getAddressRegion(address: number): string {
  const region = WRITABLE_REGIONS.find(r => 
    address >= r.start && address <= r.end
  );
  return region ? region.name : 'Unknown/Read-only';
}
```

### 3. Transaction Errors

#### Error: "Transaction already active"

**Causes:**
- Starting a new transaction before committing/rolling back the previous one
- Concurrent transaction attempts

**Solutions:**

```typescript
class SafeTransactionManager {
  private activeTransaction: any = null;
  
  async beginTransaction(engine: BinaryROMEngine) {
    if (this.activeTransaction) {
      console.log('⚠️  Rolling back previous transaction...');
      await this.activeTransaction.rollback();
    }
    
    this.activeTransaction = await engine.beginTransaction();
    return this.activeTransaction;
  }
  
  async commit() {
    if (!this.activeTransaction) {
      throw new Error('No active transaction to commit');
    }
    
    await this.activeTransaction.commit();
    this.activeTransaction = null;
  }
  
  async rollback() {
    if (!this.activeTransaction) {
      return; // Already rolled back or committed
    }
    
    await this.activeTransaction.rollback();
    this.activeTransaction = null;
  }
}
```

#### Error: "Transaction timeout"

**Causes:**
- Long-running operations
- Deadlock situations
- Resource contention

**Solutions:**

```typescript
// Implement transaction timeout
async function executeWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Transaction timeout')), timeoutMs)
    )
  ]);
}

// Usage
try {
  await executeWithTimeout(async () => {
    const transaction = await engine.beginTransaction();
    await transaction.modifyByte(0x274ED, 0xFF);
    await transaction.commit();
  }, 10000); // 10 second timeout
} catch (error) {
  if (error.message === 'Transaction timeout') {
    console.log('❌ Transaction timed out, check for deadlocks');
  }
}
```

### 4. Discovery Database Errors

#### Error: "Discovery not found"

**Causes:**
- Discovery was removed or never created
- Incorrect discovery ID
- Database corruption

**Solutions:**

```typescript
// Safe discovery retrieval
function safeGetDiscovery(db: DiscoveryDatabase, id: string): Discovery | null {
  try {
    const discovery = db.get(id);
    if (!discovery) {
      console.log(`⚠️  Discovery not found: ${id}`);
      
      // Search for similar discoveries
      const similar = db.getAll().filter(d => 
        d.name.toLowerCase().includes(id.toLowerCase()) ||
        d.id.includes(id)
      );
      
      if (similar.length > 0) {
        console.log('🔍 Similar discoveries found:');
        similar.forEach(d => console.log(`  - ${d.id}: ${d.name}`));
      }
      
      return null;
    }
    return discovery;
  } catch (error) {
    console.log(`❌ Error retrieving discovery: ${error}`);
    return null;
  }
}

// Discovery validation
function validateDiscovery(discovery: Discovery): boolean {
  const required = ['id', 'name', 'category', 'confidence'];
  const missing = required.filter(field => !discovery[field]);
  
  if (missing.length > 0) {
    console.log(`❌ Discovery missing required fields: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}
```

### 5. Value Range Errors

#### Error: "Invalid byte value"

**Causes:**
- Value outside 0-255 range
- Floating point numbers
- Undefined/null values

**Solutions:**

```typescript
// Safe byte value validation
function validateByteValue(value: any): number {
  if (typeof value !== 'number') {
    throw new Error(`Invalid value type: ${typeof value}, expected number`);
  }
  
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid value: ${value}, must be integer`);
  }
  
  if (value < 0 || value > 255) {
    throw new Error(`Invalid byte value: ${value}, must be 0-255`);
  }
  
  return value;
}

// Safe modification with validation
async function safeModifyByte(
  engine: BinaryROMEngine, 
  address: number, 
  value: any
): Promise<boolean> {
  try {
    const validValue = validateByteValue(value);
    const result = await engine.modifyByte(address, validValue);
    return result.success;
  } catch (error) {
    console.log(`❌ Safe modification failed: ${error.message}`);
    return false;
  }
}
```

## Diagnostic Tools

### ROM Health Check

```typescript
async function performROMHealthCheck(romPath: string): Promise<void> {
  console.log('🏥 ROM Health Check');
  console.log('===================\n');
  
  // File system checks
  console.log('📁 File System Checks:');
  await checkFileSystem(romPath);
  
  // ROM structure checks  
  console.log('\n🔍 ROM Structure Checks:');
  await checkROMStructure(romPath);
  
  // Known offset validation
  console.log('\n📊 Known Offset Validation:');
  await validateKnownOffsets(romPath);
  
  console.log('\n✅ Health check complete');
}

async function checkFileSystem(romPath: string): Promise<void> {
  try {
    const stats = require('fs').statSync(romPath);
    console.log(`  ✅ File exists: ${stats.size} bytes`);
    
    await access(romPath, constants.R_OK | constants.W_OK);
    console.log(`  ✅ File permissions: Read/Write OK`);
    
  } catch (error) {
    console.log(`  ❌ File system error: ${error.message}`);
  }
}

async function checkROMStructure(romPath: string): Promise<void> {
  try {
    const engine = new BinaryROMEngine(romPath);
    await engine.initialize();
    
    const header = await engine.readHeader();
    console.log(`  ✅ ROM Header: "${header.title}"`);
    console.log(`  ✅ Map Mode: 0x${header.mapMode.toString(16)}`);
    console.log(`  ✅ ROM Size: 0x${header.romSize.toString(16)}`);
    
    await engine.close();
  } catch (error) {
    console.log(`  ❌ ROM structure error: ${error.message}`);
  }
}

async function validateKnownOffsets(romPath: string): Promise<void> {
  const knownOffsets = [
    { name: 'Link Health', address: 0x274ED, expected: [0x18, 0x140] },
    { name: 'Save Checksum', address: 0x274FC, expected: null },
  ];
  
  try {
    const engine = new BinaryROMEngine(romPath);
    await engine.initialize();
    
    for (const offset of knownOffsets) {
      try {
        const value = await engine.readByte(offset.address);
        const status = offset.expected ? 
          (value >= offset.expected[0] && value <= offset.expected[1] ? '✅' : '⚠️ ') :
          '✅';
          
        console.log(`  ${status} ${offset.name}: 0x${value.toString(16)}`);
      } catch (error) {
        console.log(`  ❌ ${offset.name}: ${error.message}`);
      }
    }
    
    await engine.close();
  } catch (error) {
    console.log(`  ❌ Offset validation failed: ${error.message}`);
  }
}
```

### Discovery Database Diagnostics

```typescript
async function diagnoseDatabaseIssues(dbPath: string): Promise<void> {
  console.log('🗄️  Discovery Database Diagnostics');
  console.log('===================================\n');
  
  try {
    const db = new DiscoveryDatabase(dbPath);
    const discoveries = db.getAll();
    
    console.log(`📊 Total discoveries: ${discoveries.length}`);
    
    // Check for duplicates
    const duplicates = findDuplicateDiscoveries(discoveries);
    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} duplicate discoveries`);
      duplicates.forEach(dup => {
        console.log(`  - ${dup.name} (${dup.duplicateCount} copies)`);
      });
    }
    
    // Check for orphaned relationships
    const orphaned = findOrphanedRelationships(discoveries);
    if (orphaned.length > 0) {
      console.log(`⚠️  Found ${orphaned.length} orphaned relationships`);
    }
    
    // Confidence distribution
    const confidence = analyzeConfidenceLevels(discoveries);
    console.log('\n📈 Confidence Level Distribution:');
    for (const [level, count] of Object.entries(confidence)) {
      console.log(`  ${level}: ${count}`);
    }
    
  } catch (error) {
    console.log(`❌ Database diagnostic failed: ${error.message}`);
  }
}
```

## Recovery Procedures

### Backup Recovery

```typescript
async function emergencyRecovery(engine: BinaryROMEngine): Promise<void> {
  console.log('🚨 Emergency Recovery Procedure');
  console.log('===============================\n');
  
  try {
    // List available backups
    const backups = await engine.getBackups();
    console.log(`📦 Available backups: ${backups.length}`);
    
    if (backups.length === 0) {
      console.log('❌ No backups available for recovery');
      return;
    }
    
    // Find most recent valid backup
    const latestBackup = backups
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
      
    console.log(`🔄 Restoring from backup: ${latestBackup.description}`);
    console.log(`📅 Created: ${latestBackup.timestamp.toISOString()}`);
    
    await engine.restoreBackup(latestBackup.id);
    console.log('✅ Recovery complete');
    
  } catch (error) {
    console.log(`❌ Emergency recovery failed: ${error.message}`);
    console.log('💡 Manual file restoration may be required');
  }
}
```

### File System Recovery

```bash
# Create ROM backup before any operations
cp zelda3.smc zelda3.smc.backup

# Restore from backup if needed
cp zelda3.smc.backup zelda3.smc

# Verify file integrity
md5sum zelda3.smc > zelda3.smc.md5
md5sum -c zelda3.smc.md5
```

## Prevention Best Practices

### 1. Always Validate Before Modify

```typescript
async function safeROMModification(
  engine: BinaryROMEngine,
  address: number,
  value: number
): Promise<boolean> {
  // 1. Validate address
  if (!engine.validateAddress(address)) {
    console.log(`❌ Invalid address: 0x${address.toString(16)}`);
    return false;
  }
  
  // 2. Validate value
  if (value < 0 || value > 255) {
    console.log(`❌ Invalid value: ${value}`);
    return false;
  }
  
  // 3. Check if address is writable
  const region = engine.getMemoryRegion(address);
  if (!region?.isWritable) {
    console.log(`❌ Address not writable: ${region?.name || 'Unknown'}`);
    return false;
  }
  
  // 4. Create backup
  const backup = await engine.createBackup(`Modify 0x${address.toString(16)}`);
  
  try {
    // 5. Apply modification
    const result = await engine.modifyByte(address, value);
    if (result.success) {
      console.log(`✅ Modified 0x${address.toString(16)}: ${result.originalValue} → ${result.newValue}`);
      return true;
    } else {
      console.log(`❌ Modification failed: ${result.error}`);
      return false;
    }
  } catch (error) {
    // 6. Restore on error
    console.log(`❌ Error during modification: ${error.message}`);
    await engine.restoreBackup(backup.id);
    console.log('🔄 Restored from backup');
    return false;
  }
}
```

### 2. Comprehensive Error Handling

```typescript
function createRobustEngine(romPath: string): Promise<BinaryROMEngine> {
  return new Promise(async (resolve, reject) => {
    const engine = new BinaryROMEngine(romPath);
    
    try {
      // Pre-flight checks
      if (!await verifyROMFile(romPath)) {
        throw new Error('ROM file validation failed');
      }
      
      if (!await checkROMWritable(romPath)) {
        throw new Error('ROM file is not writable');
      }
      
      // Initialize with error handling
      await engine.initialize();
      
      // Post-initialization validation
      const header = await engine.readHeader();
      if (!header.title || header.title.trim().length === 0) {
        throw new Error('ROM appears to be corrupted');
      }
      
      console.log(`✅ Engine initialized for: ${header.title}`);
      resolve(engine);
      
    } catch (error) {
      console.log(`❌ Engine initialization failed: ${error.message}`);
      try {
        await engine.close();
      } catch (closeError) {
        // Ignore close errors during initialization failure
      }
      reject(error);
    }
  });
}
```

## Getting Help

### Debug Information Collection

When reporting issues, include this debug information:

```typescript
async function collectDebugInfo(romPath: string): Promise<void> {
  console.log('🐛 Debug Information Collection');
  console.log('===============================\n');
  
  // System info
  console.log('💻 System Information:');
  console.log(`  Node.js: ${process.version}`);
  console.log(`  Platform: ${process.platform}`);
  console.log(`  Architecture: ${process.arch}`);
  console.log(`  Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB\n`);
  
  // File info
  console.log('📁 File Information:');
  try {
    const stats = require('fs').statSync(romPath);
    console.log(`  Path: ${romPath}`);
    console.log(`  Size: ${stats.size} bytes`);
    console.log(`  Modified: ${stats.mtime}\n`);
  } catch (error) {
    console.log(`  Error: ${error.message}\n`);
  }
  
  // ROM info
  console.log('🎮 ROM Information:');
  try {
    const engine = new BinaryROMEngine(romPath);
    await engine.initialize();
    const header = await engine.readHeader();
    
    console.log(`  Title: "${header.title}"`);
    console.log(`  Map Mode: 0x${header.mapMode.toString(16)}`);
    console.log(`  ROM Size: 0x${header.romSize.toString(16)}`);
    console.log(`  Checksum: 0x${header.checksum.toString(16)}`);
    
    await engine.close();
  } catch (error) {
    console.log(`  Error: ${error.message}`);
  }
}
```

### Common Issues Quick Reference

| Error Message | Quick Fix |
|--------------|-----------|
| "Invalid ROM file format" | Check file size and header |
| "Address out of bounds" | Validate address range |
| "ROM file is read-only" | Check file permissions |
| "Transaction already active" | Commit/rollback previous transaction |
| "Discovery not found" | Verify discovery ID and database |
| "Invalid byte value" | Ensure value is 0-255 integer |

### Support Resources

- **Documentation**: `/docs/api/` - Complete API reference
- **Examples**: `/docs/examples/` - Working code samples  
- **GitHub Issues**: Report bugs and request features
- **MCP Servers**: Use for ROM analysis validation

Remember: When in doubt, create a backup first and test in an emulator!