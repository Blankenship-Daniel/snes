# ROM Modification Engine - Testing Contract

**Version:** 1.0  
**Date:** August 14, 2025  
**Author:** Alex (Senior Engineer)  
**For:** Sam (Code Custodian) - Testing Infrastructure

## Overview

This document defines the interface contract for the ROM Modification Engine. Sam should build comprehensive test coverage based on these contracts to ensure transaction safety, data integrity, and error handling.

## Core Interface Contracts

### 1. Error Types (CRITICAL TESTING)

```typescript
// Sam: Test all error scenarios with proper error context
export class ROMEngineError extends Error {
  operation: string;
  address?: number;
  cause?: Error;
}

export class ROMTransactionError extends ROMEngineError {
  transactionId: string;
}

export class ROMValidationError extends ROMEngineError {
  address?: number;
}
```

**Testing Requirements:**
- All errors must include operation context
- Address-related errors must include the problematic address
- Error chaining must preserve original cause
- Error messages must be descriptive and actionable

### 2. Transaction Management (ATOMICITY CRITICAL)

```typescript
// Sam: Test complete transaction lifecycle
interface ROMTransaction {
  readonly id: string;           // Must be unique
  readonly startTime: Date;      // Must be accurate
  readonly operations: ROMOperation[];  // Must record all ops
  readonly isActive: boolean;    // State management
  readonly canRollback: boolean; // Rollback capability
}

// Required Methods to Test:
beginTransaction(): string;           // Must return unique ID
commitTransaction(id: string): void;  // Must make changes permanent
rollbackTransaction(id: string): void; // Must revert ALL changes
```

**Critical Test Scenarios:**
1. **Transaction Isolation**: Multiple concurrent transactions
2. **Rollback Completeness**: All operations properly reversed
3. **State Consistency**: Transaction state always accurate
4. **Operation Recording**: Every modification captured
5. **Error Recovery**: Failed operations don't corrupt state

### 3. Backup System (DATA SAFETY CRITICAL)

```typescript
// Sam: Test backup reliability and integrity
interface ROMBackup {
  readonly id: string;
  readonly originalPath: string;
  readonly backupPath: string;
  readonly checksum: string;    // Must validate integrity
  readonly createdAt: Date;
  readonly size: number;
}

// Required Methods to Test:
createBackup(description?: string): string;  // Must create valid backup
restoreFromBackup(backupId: string): void;   // Must restore perfectly
```

**Critical Test Scenarios:**
1. **Backup Integrity**: Checksum validation works
2. **Restoration Accuracy**: Restored data matches original exactly
3. **File System Errors**: Proper handling of disk issues
4. **Concurrent Backups**: Multiple backups don't interfere
5. **Backup Cleanup**: Old backups managed properly

### 4. Address Validation (SAFETY CRITICAL)

```typescript
// Sam: Test all validation rules and edge cases
interface AddressValidationConfig {
  allowedRanges: Array<{ start: number; end: number; description: string }>;
  protectedRanges: Array<{ start: number; end: number; reason: string }>;
  requireConfirmation: Array<{ start: number; end: number; warning: string }>;
}

// Required Method to Test:
validateAddress(address: number, operation: 'read' | 'write', size: number): void;
```

**Critical Test Scenarios:**
1. **Boundary Conditions**: Address ranges at limits
2. **Protected Area Enforcement**: Cannot write to protected ranges
3. **Size Validation**: Address + size doesn't exceed bounds
4. **Invalid Addresses**: Negative, too large, misaligned
5. **Operation Type Validation**: Read vs write permissions

### 5. Safe Operations (CORE FUNCTIONALITY)

```typescript
// Sam: Test all operation variants and error conditions
writeByte(address: number, value: Byte, transactionId?: string): void;
writeBytes(address: number, values: Byte[], transactionId?: string): void;
readByte(address: number): Byte;
readBytes(address: number, length: number): Byte[];
```

**Critical Test Scenarios:**
1. **Data Integrity**: Written data matches read data
2. **Transaction Recording**: Operations properly logged
3. **Validation Enforcement**: Invalid operations rejected
4. **Boundary Safety**: No buffer overflows/underflows
5. **Value Validation**: Only valid byte values accepted

### 6. Pattern System (COMPLEX OPERATIONS)

```typescript
// Sam: Test pattern application and conflict detection
interface ModificationPattern {
  readonly name: string;
  readonly description: string;
  readonly operations: ROMModification[];
  readonly prerequisites: Array<{ address: number; expectedValue: Byte | Byte[] }>;
  readonly conflicts: string[];
  readonly reversible: boolean;
}

// Required Methods to Test:
registerPattern(pattern: ModificationPattern): void;
applyPattern(patternName: string, transactionId?: string): void;
```

**Critical Test Scenarios:**
1. **Prerequisite Validation**: Pattern only applies when conditions met
2. **Conflict Detection**: Conflicting patterns rejected
3. **Atomic Application**: All operations succeed or all fail
4. **Pattern Reversal**: Reversible patterns can be undone
5. **Complex Patterns**: Multi-step modifications work correctly

## Required Test Categories

### 1. Unit Tests (Sam Priority: HIGH)

```typescript
describe('ROMModificationEngine', () => {
  describe('Transaction Management', () => {
    it('should create unique transaction IDs');
    it('should record all operations');
    it('should rollback all changes in reverse order');
    it('should handle nested transactions');
    it('should prevent operations on inactive transactions');
  });

  describe('Address Validation', () => {
    it('should reject negative addresses');
    it('should reject addresses beyond ROM size');
    it('should enforce protected ranges');
    it('should validate operation permissions');
    it('should handle boundary conditions');
  });

  describe('Backup System', () => {
    it('should create valid backups');
    it('should validate backup checksums');
    it('should restore data perfectly');
    it('should handle file system errors');
    it('should manage backup storage');
  });
});
```

### 2. Integration Tests (Sam Priority: HIGH)

```typescript
describe('ROM Modification Integration', () => {
  it('should handle complete modification workflow');
  it('should integrate with existing ROMHandler');
  it('should work with bsnes MCP integration');
  it('should maintain data integrity across operations');
  it('should handle error recovery scenarios');
});
```

### 3. Performance Tests (Sam Priority: MEDIUM)

```typescript
describe('ROM Modification Performance', () => {
  it('should handle large ROM files efficiently');
  it('should perform bulk operations within time limits');
  it('should manage memory usage during large operations');
  it('should scale with transaction size');
});
```

### 4. Safety Tests (Sam Priority: CRITICAL)

```typescript
describe('ROM Modification Safety', () => {
  it('should never corrupt ROM data');
  it('should detect and prevent invalid modifications');
  it('should maintain transaction atomicity under all conditions');
  it('should recover from unexpected errors');
  it('should validate all inputs rigorously');
});
```

## Test Data Requirements

### Sample ROM Data
Sam should create test ROM files with:
- Valid SNES headers
- Known data patterns for validation
- Protected regions for testing access control
- Various sizes for performance testing

### Validation Scenarios
```typescript
const testScenarios = {
  validAddresses: [0x008000, 0x00FFFF, 0x7E0000],
  invalidAddresses: [-1, 0x1000000, 0xFFFFFFFF],
  protectedAddresses: [0x007FC0, 0x00FFE0],
  largeOperations: [1000, 10000, 100000], // byte counts
  edgeCases: [0x000000, 0xFFFFFF, boundary conditions]
};
```

## Success Criteria

Sam's test suite must validate:

1. **100% Error Handling Coverage**: All error paths tested
2. **Transaction Atomicity**: No partial failures possible
3. **Data Integrity**: No corruption under any conditions
4. **Performance Baselines**: Operations complete within limits
5. **Safety Enforcement**: Protected areas remain protected
6. **Backup Reliability**: Perfect restoration guaranteed

## Integration Points

The ROM Modification Engine must integrate with:
- **Existing ROMHandler**: Backward compatibility maintained
- **bsnes MCP Integration**: Memory reading for validation
- **Discovery System**: Pattern application based on discoveries
- **Testing Infrastructure**: Sam's mock providers and validation

## API Stability Promise

These interfaces are **STABLE** and will not change without:
1. Advance coordination with Sam
2. Deprecation warnings
3. Migration path provided
4. Comprehensive impact analysis

This contract ensures Sam can build reliable test coverage while I continue implementation work in parallel.