# Type System and Interfaces

The SNES Modder uses a comprehensive TypeScript type system to ensure ROM modification safety through compile-time validation and runtime type guards.

## Type Safety Philosophy

### Branded Types

SNES Modder uses branded types to prevent mixing incompatible values:

```typescript
// Branded types prevent address confusion
type ROMOffset = number & { readonly __brand: 'ROMOffset' };
type SNESAddress = string & { readonly __brand: 'SNESAddress' };
type Byte = number & { readonly __brand: 'Byte' };

// This will cause a TypeScript error:
function modifyByte(address: ROMOffset, value: Byte): void {}

const rawAddress = 0x274ED;  // Plain number
const rawValue = 255;        // Plain number

modifyByte(rawAddress, rawValue);  // ❌ TypeScript error!

// Correct usage with branded types:
const address = toROMAddress(0x274ED);  // Validates and brands
const value = toByte(255);              // Validates and brands
modifyByte(address, value);             // ✅ Type safe!
```

### Type Guards

Runtime type validation with TypeScript type narrowing:

```typescript
// Type guard function
function isDiscovery(value: unknown): value is Discovery {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'category' in value &&
    'confidence' in value
  );
}

// Usage with type narrowing
function processUnknownData(data: unknown) {
  if (isDiscovery(data)) {
    // TypeScript knows `data` is Discovery here
    console.log(`Processing discovery: ${data.name}`);
    console.log(`Category: ${data.category}`);
  } else {
    throw new Error('Invalid discovery data');
  }
}
```

## Core Type Definitions

### Discovery Types

#### Base Discovery Interface

```typescript
/**
 * Base discovery interface - immutable by default
 */
interface Discovery {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly category: DiscoveryCategory;
  readonly confidence: ConfidenceLevel;
  readonly discoveredAt: Date;
  readonly discoveredBy: string;
  readonly validated: boolean;
  readonly version: SemanticVersion;
  readonly tags?: readonly string[];
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/**
 * Semantic version structure
 */
interface SemanticVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}
```

#### Discovery Categories

```typescript
/**
 * Discovery category enumeration
 */
export const enum DiscoveryCategory {
  Item = 'item',
  Sprite = 'sprite',
  Memory = 'memory',
  Routine = 'routine',
  Table = 'table',
  Text = 'text',
  Audio = 'audio',
  Graphics = 'graphics'
}

/**
 * Confidence level enumeration
 */
export const enum ConfidenceLevel {
  Verified = 'verified',    // Confirmed through multiple sources
  High = 'high',           // Strong evidence
  Medium = 'medium',       // Reasonable evidence
  Low = 'low',            // Weak evidence
  Experimental = 'experimental'  // Unverified hypothesis
}
```

#### Specialized Discovery Types

```typescript
/**
 * Item discovery - for inventory items
 */
interface ItemDiscovery extends Discovery {
  readonly category: DiscoveryCategory.Item;
  readonly itemId: number;
  readonly address: {
    readonly rom: ROMOffset;
    readonly snes?: SNESAddress;
  };
  readonly properties?: {
    readonly stackable?: boolean;
    readonly maxQuantity?: number;
    readonly value?: number;
    readonly description?: string;
  };
}

/**
 * Sprite discovery - for game sprites
 */
interface SpriteDiscovery extends Discovery {
  readonly category: DiscoveryCategory.Sprite;
  readonly spriteId: number;
  readonly dimensions: {
    readonly width: number;
    readonly height: number;
  };
  readonly palette?: readonly number[];
  readonly animations?: readonly string[];
}

/**
 * Memory discovery - for memory addresses
 */
interface MemoryDiscovery extends Discovery {
  readonly category: DiscoveryCategory.Memory;
  readonly address: {
    readonly bank?: number;
    readonly offset: number;
  };
  readonly size: number;
  readonly dataType: DataType;
  readonly access: AccessType;
}

/**
 * Routine discovery - for code routines
 */
interface RoutineDiscovery extends Discovery {
  readonly category: DiscoveryCategory.Routine;
  readonly address: {
    readonly start: number;
    readonly end: number;
  };
  readonly signature: string;
  readonly parameters?: readonly Parameter[];
  readonly returnType?: DataType;
}
```

### ROM Types

#### Address Types

```typescript
/**
 * ROM offset (physical ROM address)
 */
type ROMOffset = number & { readonly __brand: 'ROMOffset' };

/**
 * SNES memory address (logical address)
 */
type SNESAddress = string & { readonly __brand: 'SNESAddress' };

/**
 * Address conversion utilities
 */
function toROMAddress(value: number): ROMOffset {
  if (value < 0 || value > 0x3FFFFF) {
    throw new RangeError(`Invalid ROM address: 0x${value.toString(16)}`);
  }
  return value as ROMOffset;
}

function toSNESAddress(value: string): SNESAddress {
  const pattern = /^\$[0-9A-Fa-f]{2}:[0-9A-Fa-f]{4}$/;
  if (!pattern.test(value)) {
    throw new Error(`Invalid SNES address format: ${value}`);
  }
  return value as SNESAddress;
}
```

#### Data Types

```typescript
/**
 * Byte value (0-255)
 */
type Byte = number & { readonly __brand: 'Byte' };

/**
 * Byte size specification
 */
type ByteSize = number & { readonly __brand: 'ByteSize' };

/**
 * Data type enumeration
 */
export const enum DataType {
  Byte = 'byte',
  Word = 'word',
  LongWord = 'longword',
  String = 'string',
  Pointer = 'pointer',
  Address = 'address',
  Bitfield = 'bitfield'
}

/**
 * Access type enumeration
 */
export const enum AccessType {
  Read = 'read',
  Write = 'write',
  ReadWrite = 'read-write',
  Execute = 'execute'
}

/**
 * Safe byte creation
 */
function toByte(value: number): Byte {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new RangeError(`Invalid byte value: ${value}`);
  }
  return value as Byte;
}

/**
 * Safe size specification
 */
function toByteSize(value: number): ByteSize {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`Invalid byte size: ${value}`);
  }
  return value as ByteSize;
}
```

### Engine Types

#### ROM Engine Interfaces

```typescript
/**
 * ROM header structure
 */
interface SNESROMHeader {
  readonly title: string;
  readonly mapMode: number;
  readonly cartridgeType: number;
  readonly romSize: number;
  readonly ramSize: number;
  readonly destinationCode: number;
  readonly checksum: number;
  readonly complement: number;
}

/**
 * ROM modification result
 */
interface ROMModificationResult {
  readonly success: boolean;
  readonly address: ROMOffset;
  readonly originalValue: Byte;
  readonly newValue: Byte;
  readonly timestamp: Date;
  readonly error?: string;
}

/**
 * ROM backup information
 */
interface ROMBackup {
  readonly id: string;
  readonly data: Buffer;
  readonly timestamp: Date;
  readonly description: string;
  readonly size: number;
}

/**
 * Memory region definition
 */
interface ROMMemoryRegion {
  readonly name: string;
  readonly startAddress: ROMOffset;
  readonly endAddress: ROMOffset;
  readonly access: AccessType;
  readonly description: string;
  readonly isWritable: boolean;
}
```

#### Transaction Types

```typescript
/**
 * ROM transaction interface
 */
interface ROMTransaction {
  readonly id: string;
  readonly startTime: Date;
  readonly operations: readonly ROMOperation[];
  readonly isActive: boolean;
  readonly canRollback: boolean;
  
  modifyByte(address: ROMOffset, value: Byte): Promise<void>;
  modifyBytes(address: ROMOffset, data: Buffer): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * ROM operation record
 */
interface ROMOperation {
  readonly type: OperationType;
  readonly address: ROMOffset;
  readonly originalValue?: Byte;
  readonly newValue?: Byte;
  readonly timestamp: Date;
}

/**
 * Operation type enumeration
 */
export const enum OperationType {
  Read = 'read',
  Write = 'write',
  Backup = 'backup',
  Restore = 'restore'
}
```

## Type Guards and Validation

### Discovery Type Guards

```typescript
/**
 * Base discovery type guard
 */
export function isDiscovery(value: unknown): value is Discovery {
  if (!isObject(value)) return false;
  
  const obj = value as Record<string, unknown>;
  
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.category === 'string' &&
    typeof obj.confidence === 'string' &&
    isValidDate(obj.discoveredAt) &&
    typeof obj.discoveredBy === 'string' &&
    typeof obj.validated === 'boolean'
  );
}

/**
 * Item discovery type guard
 */
export function isItemDiscovery(discovery: Discovery): discovery is ItemDiscovery {
  return (
    discovery.category === DiscoveryCategory.Item &&
    'itemId' in discovery &&
    typeof (discovery as any).itemId === 'number'
  );
}

/**
 * Sprite discovery type guard
 */
export function isSpriteDiscovery(discovery: Discovery): discovery is SpriteDiscovery {
  return (
    discovery.category === DiscoveryCategory.Sprite &&
    'spriteId' in discovery &&
    typeof (discovery as any).spriteId === 'number'
  );
}

/**
 * Memory discovery type guard
 */
export function isMemoryDiscovery(discovery: Discovery): discovery is MemoryDiscovery {
  return (
    discovery.category === DiscoveryCategory.Memory &&
    'address' in discovery &&
    'size' in discovery &&
    'dataType' in discovery
  );
}

/**
 * Routine discovery type guard
 */
export function isRoutineDiscovery(discovery: Discovery): discovery is RoutineDiscovery {
  return (
    discovery.category === DiscoveryCategory.Routine &&
    'signature' in discovery
  );
}
```

### Assertion Guards

```typescript
/**
 * Assert value is a discovery (throws if not)
 */
export function assertDiscovery(value: unknown): asserts value is Discovery {
  if (!isDiscovery(value)) {
    throw new TypeError('Value is not a valid Discovery object');
  }
}

/**
 * Assert discovery is validated
 */
export function assertValidated(discovery: Discovery): asserts discovery is Discovery & { validated: true } {
  if (!discovery.validated) {
    throw new Error(`Discovery ${discovery.id} is not validated`);
  }
}

/**
 * Assert address is valid ROM address
 */
export function assertValidROMAddress(address: number): asserts address is ROMOffset {
  if (address < 0 || address > 0x3FFFFF) {
    throw new RangeError(`Invalid ROM address: 0x${address.toString(16)}`);
  }
}

/**
 * Assert value is valid byte
 */
export function assertValidByte(value: number): asserts value is Byte {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new RangeError(`Invalid byte value: ${value}`);
  }
}
```

### Utility Type Guards

```typescript
/**
 * Check if value is a plain object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if value is a valid Date
 */
function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * Check if value is a valid UUID
 */
export function isUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}
```

## Filtering and Narrowing Functions

### Array Filtering with Type Narrowing

```typescript
/**
 * Filter to only validated discoveries
 */
export function onlyValidated<T extends Discovery>(discoveries: T[]): Array<T & { validated: true }> {
  return discoveries.filter((d): d is T & { validated: true } => d.validated === true);
}

/**
 * Filter by category with type narrowing
 */
export function filterByCategory<T extends Discovery>(
  discoveries: Discovery[],
  category: T['category']
): T[] {
  return discoveries.filter((d): d is T => d.category === category);
}

/**
 * Extract specific discovery types
 */
export function extractItems(discoveries: Discovery[]): ItemDiscovery[] {
  return discoveries.filter(isItemDiscovery);
}

export function extractSprites(discoveries: Discovery[]): SpriteDiscovery[] {
  return discoveries.filter(isSpriteDiscovery);
}

export function extractMemory(discoveries: Discovery[]): MemoryDiscovery[] {
  return discoveries.filter(isMemoryDiscovery);
}

export function extractRoutines(discoveries: Discovery[]): RoutineDiscovery[] {
  return discoveries.filter(isRoutineDiscovery);
}
```

### Safe Property Access

```typescript
/**
 * Type-safe property check
 */
export function hasProperty<K extends PropertyKey>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj;
}

/**
 * Safe property getter with default
 */
export function getProperty<T>(
  obj: Record<string, unknown>,
  key: string,
  defaultValue: T
): T {
  const value = obj[key];
  return value !== undefined ? (value as T) : defaultValue;
}
```

## Builder Pattern Types

### Discovery Builder

```typescript
/**
 * Discovery builder for type-safe construction
 */
export class DiscoveryBuilder<T extends DiscoveryCategory> {
  private data: Partial<Discovery> = {};
  
  constructor(private category: T) {
    this.data.category = category;
  }
  
  id(id: string): this {
    this.data.id = id;
    return this;
  }
  
  name(name: string): this {
    this.data.name = name;
    return this;
  }
  
  description(description: string): this {
    this.data.description = description;
    return this;
  }
  
  confidence(confidence: ConfidenceLevel): this {
    this.data.confidence = confidence;
    return this;
  }
  
  tags(tags: string[]): this {
    this.data.tags = new Set(tags);
    return this;
  }
  
  metadata(metadata: Record<string, unknown>): this {
    this.data.metadata = { ...metadata };
    return this;
  }
  
  build(): Discovery {
    // Validate required fields
    if (!this.data.id) throw new Error('Discovery ID is required');
    if (!this.data.name) throw new Error('Discovery name is required');
    if (!this.data.description) throw new Error('Discovery description is required');
    if (!this.data.confidence) throw new Error('Discovery confidence is required');
    
    // Add default values
    const discovery: Discovery = {
      id: this.data.id,
      name: this.data.name,
      description: this.data.description,
      category: this.category,
      confidence: this.data.confidence,
      discoveredAt: new Date(),
      discoveredBy: 'system',
      validated: false,
      version: { major: 1, minor: 0, patch: 0 },
      tags: this.data.tags,
      metadata: this.data.metadata
    };
    
    // Validate the constructed discovery
    assertDiscovery(discovery);
    
    return discovery;
  }
}
```

## Result Types for Error Handling

### Result Pattern

```typescript
/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * Create successful result
 */
export function success<T>(value: T): Result<T> {
  return { success: true, value };
}

/**
 * Create error result
 */
export function failure<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Try-catch wrapper that returns Result
 */
export function tryCatch<T>(fn: () => T): Result<T> {
  try {
    return success(fn());
  } catch (error) {
    return failure(error as Error);
  }
}

/**
 * Async try-catch wrapper
 */
export async function tryAsync<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    const value = await fn();
    return success(value);
  } catch (error) {
    return failure(error as Error);
  }
}
```

## Utility Types

### Conditional Types

```typescript
/**
 * Make specific properties optional
 */
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required
 */
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

/**
 * Extract discovery type by category
 */
type DiscoveryByCategory<T extends DiscoveryCategory> =
  T extends DiscoveryCategory.Item ? ItemDiscovery :
  T extends DiscoveryCategory.Sprite ? SpriteDiscovery :
  T extends DiscoveryCategory.Memory ? MemoryDiscovery :
  T extends DiscoveryCategory.Routine ? RoutineDiscovery :
  Discovery;

/**
 * Deep readonly type
 */
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
```

### Template Literal Types

```typescript
/**
 * SNES address pattern
 */
type SNESAddressPattern = `$${string}:${string}`;

/**
 * Discovery ID pattern
 */
type DiscoveryIdPattern = `${string}_${string}`;

/**
 * Hex string pattern
 */
type HexString = `0x${string}`;
```

## Type Usage Examples

### Safe Discovery Processing

```typescript
async function processDiscoveries(discoveries: unknown[]): Promise<void> {
  for (const unknown of discoveries) {
    // Type guard validation
    if (!isDiscovery(unknown)) {
      console.warn('Skipping invalid discovery');
      continue;
    }
    
    // Assert validation status
    try {
      assertValidated(unknown);
    } catch (error) {
      console.warn(`Skipping unvalidated discovery: ${unknown.id}`);
      continue;
    }
    
    // Type-safe processing based on category
    if (isItemDiscovery(unknown)) {
      await processItemDiscovery(unknown);
    } else if (isSpriteDiscovery(unknown)) {
      await processSpriteDiscovery(unknown);
    } else if (isMemoryDiscovery(unknown)) {
      await processMemoryDiscovery(unknown);
    }
  }
}

async function processItemDiscovery(discovery: ItemDiscovery): Promise<void> {
  // TypeScript knows this is an ItemDiscovery
  console.log(`Processing item ${discovery.itemId}: ${discovery.name}`);
  
  if (discovery.properties?.stackable) {
    console.log(`  Stackable item, max: ${discovery.properties.maxQuantity}`);
  }
}
```

### Builder Pattern Usage

```typescript
// Type-safe discovery creation
const healthDiscovery = new DiscoveryBuilder(DiscoveryCategory.Memory)
  .id('link_health')
  .name('Link Health Value')
  .description('Current health points for Link')
  .confidence(ConfidenceLevel.Verified)
  .tags(['health', 'player', 'save_data'])
  .metadata({
    dataType: DataType.Byte,
    validRange: { min: 0, max: 255 },
    address: { rom: toROMAddress(0x274ED) }
  })
  .build();

// The builder ensures all required fields are present
// and creates a properly typed Discovery object
```

### Result Pattern Usage

```typescript
async function safeModifyByte(
  engine: BinaryROMEngine,
  address: number,
  value: number
): Promise<Result<ROMModificationResult>> {
  return tryAsync(async () => {
    const romAddress = toROMAddress(address);  // May throw
    const byteValue = toByte(value);           // May throw
    
    return await engine.modifyByte(romAddress, byteValue);
  });
}

// Usage with pattern matching
const result = await safeModifyByte(engine, 0x274ED, 255);

if (result.success) {
  console.log(`Modified: ${result.value.originalValue} → ${result.value.newValue}`);
} else {
  console.error(`Modification failed: ${result.error.message}`);
}
```

## Best Practices

### 1. Always Use Type Guards at Boundaries

```typescript
// Good: Validate external data
function processExternalData(data: unknown) {
  if (isDiscovery(data)) {
    // Now TypeScript knows data is Discovery
    processDiscovery(data);
  }
}

// Bad: Type assertion without validation
function processExternalDataBad(data: unknown) {
  const discovery = data as Discovery;  // Dangerous!
  processDiscovery(discovery);
}
```

### 2. Use Branded Types for Domain Values

```typescript
// Good: Prevents mixing incompatible values
function modifyHealth(address: ROMOffset, health: Byte) {
  // Type-safe modification
}

// Bad: Plain numbers can be mixed up
function modifyHealthBad(address: number, health: number) {
  // Could accidentally swap parameters
}
```

### 3. Leverage Type Narrowing

```typescript
// Good: Use type narrowing for conditional logic
function processDiscovery(discovery: Discovery) {
  if (isItemDiscovery(discovery)) {
    // TypeScript knows this is ItemDiscovery
    console.log(`Item ID: ${discovery.itemId}`);
  }
}

// Bad: Manual type casting
function processDiscoveryBad(discovery: Discovery) {
  if (discovery.category === 'item') {
    const item = discovery as ItemDiscovery;  // Manual cast
    console.log(`Item ID: ${item.itemId}`);
  }
}
```

### 4. Use Result Types for Fallible Operations

```typescript
// Good: Explicit error handling
const result = await tryAsync(() => engine.modifyByte(address, value));
if (result.success) {
  // Handle success
} else {
  // Handle error
}

// Bad: Throws can be forgotten
try {
  await engine.modifyByte(address, value);
} catch (error) {
  // Easy to forget error handling
}
```

The type system ensures compile-time safety while runtime validation provides defense against invalid data. Use both together for maximum safety!