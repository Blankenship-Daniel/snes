# BinaryROMEngine API Reference

The `BinaryROMEngine` is the core ROM modification system that provides safe, promise-based operations for SNES ROM files.

## Class Overview

```typescript
class BinaryROMEngine {
  constructor(romPath: string);
  
  // Lifecycle
  initialize(): Promise<void>;
  close(): Promise<void>;
  
  // Reading Operations
  readByte(address: number): Promise<Byte>;
  readBytes(address: number, size: number): Promise<Buffer>;
  readHeader(): Promise<SNESROMHeader>;
  
  // Writing Operations  
  modifyByte(address: number, value: Byte): Promise<ROMModificationResult>;
  modifyBytes(address: number, data: Buffer): Promise<ROMModificationResult[]>;
  
  // Transaction Management
  beginTransaction(): Promise<ROMTransaction>;
  
  // Backup Management
  createBackup(description?: string): Promise<ROMBackup>;
  restoreBackup(backupId: string): Promise<void>;
  
  // Validation
  validateAddress(address: number): boolean;
  getMemoryRegion(address: number): ROMMemoryRegion | null;
}
```

## Constructor

### `new BinaryROMEngine(romPath: string)`

Creates a new ROM engine instance for the specified ROM file.

**Parameters:**
- `romPath` - Path to the SNES ROM file (`.smc` or `.sfc`)

**Example:**
```typescript
const engine = new BinaryROMEngine('./zelda3.smc');
```

## Lifecycle Methods

### `initialize(): Promise<void>`

Initializes the ROM engine, parses the header, and sets up memory regions.

**Throws:**
- `BinaryROMError` - If ROM file is invalid or corrupted

**Example:**
```typescript
await engine.initialize();
console.log('ROM engine ready');
```

### `close(): Promise<void>`

Closes the ROM file and cleans up resources.

**Example:**
```typescript
await engine.close();
```

## Reading Operations

### `readByte(address: number): Promise<Byte>`

Reads a single byte from the ROM at the specified address.

**Parameters:**
- `address` - ROM offset (0x000000 - 0x3FFFFF for 4MB ROM)

**Returns:** Promise resolving to the byte value (0-255)

**Throws:**
- `BinaryROMError` - If address is invalid or read fails

**Example:**
```typescript
const healthValue = await engine.readByte(0x274ED);
console.log(`Current health: ${healthValue}`);
```

### `readBytes(address: number, size: number): Promise<Buffer>`

Reads multiple bytes from the ROM starting at the specified address.

**Parameters:**
- `address` - Starting ROM offset
- `size` - Number of bytes to read

**Returns:** Promise resolving to a Buffer containing the data

**Example:**
```typescript
const saveData = await engine.readBytes(0x274C0, 0x3C);
console.log(`Save data: ${saveData.toString('hex')}`);
```

### `readHeader(): Promise<SNESROMHeader>`

Reads and parses the SNES ROM header.

**Returns:** Promise resolving to parsed header information

**Example:**
```typescript
const header = await engine.readHeader();
console.log(`Game: ${header.title}`);
console.log(`ROM Size: ${header.romSize}`);
```

## Writing Operations

### `modifyByte(address: number, value: Byte): Promise<ROMModificationResult>`

Modifies a single byte in the ROM with full transaction safety.

**Parameters:**
- `address` - ROM offset to modify
- `value` - New byte value (0-255)

**Returns:** Promise resolving to modification result

**Throws:**
- `BinaryROMError` - If address is invalid or modification fails

**Example:**
```typescript
// Set Link's health to maximum
const result = await engine.modifyByte(0x274ED, 0xFF);
if (result.success) {
  console.log(`Health modified: ${result.originalValue} → ${result.newValue}`);
}
```

### `modifyBytes(address: number, data: Buffer): Promise<ROMModificationResult[]>`

Modifies multiple bytes in the ROM atomically.

**Parameters:**
- `address` - Starting ROM offset
- `data` - Buffer containing new data

**Returns:** Promise resolving to array of modification results

**Example:**
```typescript
// Modify player stats
const newStats = Buffer.from([0xFF, 0xFF, 0x7F, 0x7F]); // HP, MP, Attack, Defense
const results = await engine.modifyBytes(0x274EC, newStats);
console.log(`Modified ${results.length} bytes`);
```

## Transaction Management

### `beginTransaction(): Promise<ROMTransaction>`

Begins a new transaction for atomic multi-operation modifications.

**Returns:** Promise resolving to a new transaction object

**Example:**
```typescript
const transaction = await engine.beginTransaction();
try {
  await transaction.modifyByte(0x274ED, 0xFF); // Health
  await transaction.modifyByte(0x274EE, 0x7F); // Magic
  await transaction.commit();
  console.log('Transaction committed successfully');
} catch (error) {
  await transaction.rollback();
  console.error('Transaction failed, rolled back');
}
```

## Backup Management

### `createBackup(description?: string): Promise<ROMBackup>`

Creates a backup of the current ROM state.

**Parameters:**
- `description` - Optional description for the backup

**Returns:** Promise resolving to backup information

**Example:**
```typescript
const backup = await engine.createBackup('Before health modification');
console.log(`Backup created: ${backup.id}`);
```

### `restoreBackup(backupId: string): Promise<void>`

Restores the ROM to a previous backup state.

**Parameters:**
- `backupId` - ID of the backup to restore

**Example:**
```typescript
await engine.restoreBackup(backup.id);
console.log('ROM restored to backup state');
```

## Validation Methods

### `validateAddress(address: number): boolean`

Validates if an address is within the ROM bounds and writable.

**Parameters:**
- `address` - ROM offset to validate

**Returns:** `true` if address is valid and writable

**Example:**
```typescript
if (engine.validateAddress(0x274ED)) {
  await engine.modifyByte(0x274ED, 0xFF);
} else {
  console.error('Invalid address');
}
```

### `getMemoryRegion(address: number): ROMMemoryRegion | null`

Gets information about the memory region containing the specified address.

**Parameters:**
- `address` - ROM offset to query

**Returns:** Memory region info or `null` if not found

**Example:**
```typescript
const region = engine.getMemoryRegion(0x274ED);
if (region?.isWritable) {
  console.log(`Address is in ${region.name} region`);
}
```

## Types

### `SNESROMHeader`

```typescript
interface SNESROMHeader {
  readonly title: string;        // Game title (21 chars)
  readonly mapMode: number;      // Memory mapping mode
  readonly cartridgeType: number; // Cartridge type
  readonly romSize: number;      // ROM size code
  readonly ramSize: number;      // RAM size code
  readonly destinationCode: number; // Region code
  readonly checksum: number;     // ROM checksum
  readonly complement: number;   // Checksum complement
}
```

### `ROMModificationResult`

```typescript
interface ROMModificationResult {
  readonly success: boolean;     // Operation success
  readonly address: number;      // Modified address
  readonly originalValue: Byte;  // Original byte value
  readonly newValue: Byte;       // New byte value
  readonly timestamp: Date;      // Modification time
  readonly error?: string;       // Error message if failed
}
```

### `ROMBackup`

```typescript
interface ROMBackup {
  readonly id: string;          // Unique backup ID
  readonly data: Buffer;        // ROM data snapshot
  readonly timestamp: Date;     // Backup creation time
  readonly description: string; // Human-readable description
  readonly size: number;        // Backup size in bytes
}
```

### `ROMMemoryRegion`

```typescript
interface ROMMemoryRegion {
  readonly name: string;         // Region name
  readonly startAddress: number; // Start address
  readonly endAddress: number;   // End address
  readonly access: 'read' | 'write' | 'read/write'; // Access permissions
  readonly description: string;  // Region description
  readonly isWritable: boolean;  // Write permission flag
}
```

## Error Handling

All methods throw `BinaryROMError` for operation failures:

```typescript
class BinaryROMError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly address?: number,
    public readonly cause?: Error
  );
}
```

**Common Error Scenarios:**
- Invalid ROM file format
- Address out of bounds
- Write to read-only region
- File system errors
- Corruption detection

## Best Practices

1. **Always initialize** before performing operations
2. **Validate addresses** before modification
3. **Use transactions** for multi-byte operations
4. **Create backups** before major modifications
5. **Handle errors** appropriately with try/catch
6. **Close engine** when done to free resources

## Performance Considerations

- **Batch operations** when possible using transactions
- **Cache header data** instead of re-reading
- **Validate addresses** once, then trust them
- **Use backups sparingly** for large ROMs
- **Close engines** to prevent memory leaks

## Related APIs

- [DiscoveryDatabase](./DiscoveryDatabase.md) - For tracking ROM discoveries
- [Error Handling](./ErrorHandling.md) - For robust error management
- [Type System](./TypeSystem.md) - For type-safe operations