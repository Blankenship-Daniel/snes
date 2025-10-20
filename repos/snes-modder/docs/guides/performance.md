# Performance Optimization Guide

This guide provides comprehensive strategies for optimizing ROM modification performance in the SNES Modder system.

## Performance Overview

### Key Performance Metrics

| Operation | Typical Time | Optimization Target |
|-----------|--------------|-------------------|
| ROM Loading | 50-200ms | < 50ms |
| Single Byte Read | 0.1-1ms | < 0.1ms |
| Single Byte Write | 1-5ms | < 1ms |
| Transaction Commit | 10-50ms | < 10ms |
| Backup Creation | 100-500ms | < 100ms |
| Discovery Query | 1-10ms | < 1ms |

### Performance Bottlenecks

1. **File I/O Operations** - Disk read/write speed
2. **Memory Allocation** - Buffer creation and copying
3. **Validation Overhead** - Address and value checking
4. **Discovery Database Queries** - Search algorithms
5. **Transaction Management** - Backup and rollback operations

## File I/O Optimization

### 1. ROM File Caching

```typescript
/**
 * ROM Cache Manager - Keeps frequently accessed ROM data in memory
 */
class ROMCacheManager {
  private cache = new Map<number, Buffer>();
  private cacheSize = 0;
  private readonly maxCacheSize = 1024 * 1024; // 1MB cache
  private readonly blockSize = 4096; // 4KB blocks
  
  async getCachedBlock(
    engine: BinaryROMEngine,
    address: number
  ): Promise<Buffer> {
    const blockStart = Math.floor(address / this.blockSize) * this.blockSize;
    
    if (this.cache.has(blockStart)) {
      return this.cache.get(blockStart)!;
    }
    
    // Load block if not cached
    const block = await engine.readBytes(blockStart, this.blockSize);
    this.addToCache(blockStart, block);
    
    return block;
  }
  
  private addToCache(address: number, data: Buffer): void {
    // Implement LRU eviction if cache is full
    if (this.cacheSize + data.length > this.maxCacheSize) {
      this.evictLRU();
    }
    
    this.cache.set(address, data);
    this.cacheSize += data.length;
  }
  
  private evictLRU(): void {
    // Simple FIFO eviction for demo
    const firstKey = this.cache.keys().next().value;
    if (firstKey !== undefined) {
      const evicted = this.cache.get(firstKey)!;
      this.cache.delete(firstKey);
      this.cacheSize -= evicted.length;
    }
  }
  
  clearCache(): void {
    this.cache.clear();
    this.cacheSize = 0;
  }
}

// Usage example
const cacheManager = new ROMCacheManager();

async function optimizedRead(
  engine: BinaryROMEngine,
  address: number
): Promise<number> {
  const block = await cacheManager.getCachedBlock(engine, address);
  const blockOffset = address % 4096;
  return block[blockOffset];
}
```

### 2. Batched Operations

```typescript
/**
 * Batch Manager - Groups multiple operations for efficiency
 */
class BatchOperationManager {
  private pendingReads: Array<{
    address: number;
    resolve: (value: number) => void;
    reject: (error: Error) => void;
  }> = [];
  
  private pendingWrites: Array<{
    address: number;
    value: number;
    resolve: (success: boolean) => void;
    reject: (error: Error) => void;
  }> = [];
  
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly batchDelay = 10; // 10ms batch window
  
  async queueRead(
    engine: BinaryROMEngine,
    address: number
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      this.pendingReads.push({ address, resolve, reject });
      this.scheduleBatch(engine);
    });
  }
  
  async queueWrite(
    engine: BinaryROMEngine,
    address: number,
    value: number
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.pendingWrites.push({ address, value, resolve, reject });
      this.scheduleBatch(engine);
    });
  }
  
  private scheduleBatch(engine: BinaryROMEngine): void {
    if (this.batchTimeout) return;
    
    this.batchTimeout = setTimeout(() => {
      this.executeBatch(engine);
    }, this.batchDelay);
  }
  
  private async executeBatch(engine: BinaryROMEngine): Promise<void> {
    this.batchTimeout = null;
    
    // Execute batched reads
    if (this.pendingReads.length > 0) {
      await this.executeBatchedReads(engine);
    }
    
    // Execute batched writes
    if (this.pendingWrites.length > 0) {
      await this.executeBatchedWrites(engine);
    }
  }
  
  private async executeBatchedReads(engine: BinaryROMEngine): Promise<void> {
    const reads = [...this.pendingReads];
    this.pendingReads = [];
    
    try {
      // Sort by address for sequential access
      reads.sort((a, b) => a.address - b.address);
      
      // Group contiguous addresses
      const groups = this.groupContiguousAddresses(
        reads.map(r => r.address)
      );
      
      for (const group of groups) {
        const startAddr = group[0];
        const length = group[group.length - 1] - startAddr + 1;
        
        const data = await engine.readBytes(startAddr, length);
        
        // Resolve individual read promises
        for (const read of reads) {
          if (group.includes(read.address)) {
            const offset = read.address - startAddr;
            read.resolve(data[offset]);
          }
        }
      }
    } catch (error) {
      // Reject all pending reads
      reads.forEach(read => read.reject(error as Error));
    }
  }
  
  private async executeBatchedWrites(engine: BinaryROMEngine): Promise<void> {
    const writes = [...this.pendingWrites];
    this.pendingWrites = [];
    
    try {
      const transaction = await engine.beginTransaction();
      
      for (const write of writes) {
        await transaction.modifyByte(write.address, write.value);
      }
      
      await transaction.commit();
      
      // Resolve all write promises
      writes.forEach(write => write.resolve(true));
      
    } catch (error) {
      // Reject all pending writes
      writes.forEach(write => write.reject(error as Error));
    }
  }
  
  private groupContiguousAddresses(addresses: number[]): number[][] {
    if (addresses.length === 0) return [];
    
    const groups: number[][] = [];
    let currentGroup = [addresses[0]];
    
    for (let i = 1; i < addresses.length; i++) {
      if (addresses[i] === addresses[i-1] + 1) {
        currentGroup.push(addresses[i]);
      } else {
        groups.push(currentGroup);
        currentGroup = [addresses[i]];
      }
    }
    
    groups.push(currentGroup);
    return groups;
  }
}

// Usage example
const batchManager = new BatchOperationManager();

// Instead of individual operations
const values = await Promise.all([
  batchManager.queueRead(engine, 0x274ED),
  batchManager.queueRead(engine, 0x274EE),
  batchManager.queueRead(engine, 0x274EF)
]);
```

## Memory Management Optimization

### 1. Buffer Pool

```typescript
/**
 * Buffer Pool - Reuses Buffer objects to reduce garbage collection
 */
class BufferPool {
  private pools = new Map<number, Buffer[]>();
  private readonly maxPoolSize = 100;
  
  getBuffer(size: number): Buffer {
    const pool = this.pools.get(size);
    
    if (pool && pool.length > 0) {
      return pool.pop()!;
    }
    
    return Buffer.allocUnsafe(size);
  }
  
  returnBuffer(buffer: Buffer): void {
    const size = buffer.length;
    
    if (!this.pools.has(size)) {
      this.pools.set(size, []);
    }
    
    const pool = this.pools.get(size)!;
    
    if (pool.length < this.maxPoolSize) {
      buffer.fill(0); // Clear sensitive data
      pool.push(buffer);
    }
  }
  
  clear(): void {
    this.pools.clear();
  }
}

// Global buffer pool
const bufferPool = new BufferPool();

// Optimized ROM reading
async function efficientReadBytes(
  engine: BinaryROMEngine,
  address: number,
  size: number
): Promise<Buffer> {
  const buffer = bufferPool.getBuffer(size);
  
  try {
    const data = await engine.readBytes(address, size);
    data.copy(buffer);
    return buffer.slice(0, size);
  } finally {
    bufferPool.returnBuffer(buffer);
  }
}
```

### 2. Object Pooling

```typescript
/**
 * Object Pool for Discovery objects
 */
class DiscoveryPool {
  private pool: any[] = [];
  private readonly maxSize = 50;
  
  getDiscovery(): any {
    return this.pool.pop() || this.createDiscovery();
  }
  
  returnDiscovery(discovery: any): void {
    if (this.pool.length < this.maxSize) {
      this.resetDiscovery(discovery);
      this.pool.push(discovery);
    }
  }
  
  private createDiscovery(): any {
    return {
      id: '',
      name: '',
      description: '',
      category: null,
      confidence: null,
      address: { rom: 0 },
      tags: new Set(),
      metadata: {}
    };
  }
  
  private resetDiscovery(discovery: any): void {
    discovery.id = '';
    discovery.name = '';
    discovery.description = '';
    discovery.category = null;
    discovery.confidence = null;
    discovery.address.rom = 0;
    discovery.tags.clear();
    discovery.metadata = {};
  }
}
```

## Algorithm Optimization

### 1. Discovery Database Indexing

```typescript
/**
 * Optimized Discovery Database with multiple indexes
 */
class OptimizedDiscoveryDatabase {
  private discoveries = new Map<string, any>();
  
  // Indexes for fast lookups
  private categoryIndex = new Map<string, Set<string>>();
  private tagIndex = new Map<string, Set<string>>();
  private addressIndex = new Map<number, string>();
  
  add(discovery: any): void {
    this.discoveries.set(discovery.id, discovery);
    
    // Update category index
    if (!this.categoryIndex.has(discovery.category)) {
      this.categoryIndex.set(discovery.category, new Set());
    }
    this.categoryIndex.get(discovery.category)!.add(discovery.id);
    
    // Update tag indexes
    if (discovery.tags) {
      for (const tag of discovery.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(discovery.id);
      }
    }
    
    // Update address index
    this.addressIndex.set(discovery.address.rom, discovery.id);
  }
  
  findByCategory(category: string): any[] {
    const ids = this.categoryIndex.get(category);
    if (!ids) return [];
    
    return Array.from(ids).map(id => this.discoveries.get(id)!);
  }
  
  findByTag(tag: string): any[] {
    const ids = this.tagIndex.get(tag);
    if (!ids) return [];
    
    return Array.from(ids).map(id => this.discoveries.get(id)!);
  }
  
  findByAddress(address: number): any | null {
    const id = this.addressIndex.get(address);
    return id ? this.discoveries.get(id)! : null;
  }
  
  // Optimized intersection search
  findByTags(tags: string[]): any[] {
    if (tags.length === 0) return [];
    
    // Start with smallest set
    let resultIds = this.tagIndex.get(tags[0]);
    if (!resultIds) return [];
    
    // Intersect with other tag sets
    for (let i = 1; i < tags.length; i++) {
      const tagIds = this.tagIndex.get(tags[i]);
      if (!tagIds) return [];
      
      resultIds = new Set([...resultIds].filter(id => tagIds.has(id)));
      
      if (resultIds.size === 0) break;
    }
    
    return Array.from(resultIds).map(id => this.discoveries.get(id)!);
  }
}
```

### 2. Spatial Indexing for Address Ranges

```typescript
/**
 * R-Tree like structure for efficient address range queries
 */
class AddressRangeIndex {
  private ranges: Array<{
    start: number;
    end: number;
    discoveryId: string;
  }> = [];
  
  add(start: number, end: number, discoveryId: string): void {
    this.ranges.push({ start, end, discoveryId });
    
    // Keep sorted by start address for efficient queries
    this.ranges.sort((a, b) => a.start - b.start);
  }
  
  findInRange(address: number): string[] {
    const results: string[] = [];
    
    // Binary search for efficiency
    let left = 0;
    let right = this.ranges.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const range = this.ranges[mid];
      
      if (address >= range.start && address <= range.end) {
        results.push(range.discoveryId);
        
        // Check adjacent ranges that might also contain the address
        this.collectAdjacentMatches(mid, address, results);
        break;
      } else if (address < range.start) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }
    
    return results;
  }
  
  private collectAdjacentMatches(
    centerIndex: number,
    address: number,
    results: string[]
  ): void {
    // Check left
    for (let i = centerIndex - 1; i >= 0; i--) {
      const range = this.ranges[i];
      if (address >= range.start && address <= range.end) {
        results.push(range.discoveryId);
      } else {
        break;
      }
    }
    
    // Check right
    for (let i = centerIndex + 1; i < this.ranges.length; i++) {
      const range = this.ranges[i];
      if (address >= range.start && address <= range.end) {
        results.push(range.discoveryId);
      } else {
        break;
      }
    }
  }
}
```

## Transaction Optimization

### 1. Transaction Batching

```typescript
/**
 * Transaction Batcher - Combines multiple operations into single transaction
 */
class TransactionBatcher {
  private operations: Array<{
    type: 'read' | 'write';
    address: number;
    value?: number;
    promise: {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
    };
  }> = [];
  
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly batchWindow = 50; // 50ms batch window
  
  async queueOperation(
    engine: BinaryROMEngine,
    type: 'read' | 'write',
    address: number,
    value?: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.operations.push({
        type,
        address,
        value,
        promise: { resolve, reject }
      });
      
      this.scheduleBatch(engine);
    });
  }
  
  private scheduleBatch(engine: BinaryROMEngine): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
    
    this.batchTimer = setTimeout(() => {
      this.executeBatch(engine);
    }, this.batchWindow);
  }
  
  private async executeBatch(engine: BinaryROMEngine): Promise<void> {
    const ops = [...this.operations];
    this.operations = [];
    this.batchTimer = null;
    
    if (ops.length === 0) return;
    
    const transaction = await engine.beginTransaction();
    
    try {
      const results = new Map<number, any>();
      
      // Execute all reads first
      for (const op of ops.filter(o => o.type === 'read')) {
        try {
          const value = await engine.readByte(op.address);
          results.set(op.address, value);
          op.promise.resolve(value);
        } catch (error) {
          op.promise.reject(error as Error);
        }
      }
      
      // Execute all writes in transaction
      for (const op of ops.filter(o => o.type === 'write')) {
        try {
          await transaction.modifyByte(op.address, op.value!);
          op.promise.resolve(true);
        } catch (error) {
          op.promise.reject(error as Error);
        }
      }
      
      await transaction.commit();
      
    } catch (error) {
      await transaction.rollback();
      
      // Reject all remaining operations
      ops.forEach(op => {
        if (op.type === 'write') {
          op.promise.reject(error as Error);
        }
      });
    }
  }
}
```

### 2. Lazy Backup Creation

```typescript
/**
 * Lazy Backup Manager - Creates backups only when needed
 */
class LazyBackupManager {
  private backupPromise: Promise<string> | null = null;
  private backupId: string | null = null;
  
  async ensureBackup(
    engine: BinaryROMEngine,
    description: string = 'Lazy backup'
  ): Promise<string> {
    if (this.backupId) {
      return this.backupId;
    }
    
    if (this.backupPromise) {
      this.backupId = await this.backupPromise;
      return this.backupId;
    }
    
    this.backupPromise = this.createBackup(engine, description);
    this.backupId = await this.backupPromise;
    return this.backupId;
  }
  
  private async createBackup(
    engine: BinaryROMEngine,
    description: string
  ): Promise<string> {
    const backup = await engine.createBackup(description);
    return backup.id;
  }
  
  reset(): void {
    this.backupPromise = null;
    this.backupId = null;
  }
}
```

## Concurrent Operations

### 1. Operation Queue

```typescript
/**
 * Concurrent Operation Manager with priority queue
 */
class ConcurrentOperationManager {
  private queue: Array<{
    operation: () => Promise<any>;
    priority: number;
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }> = [];
  
  private running = 0;
  private readonly maxConcurrent = 3;
  
  async enqueue<T>(
    operation: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, priority, resolve, reject });
      this.queue.sort((a, b) => b.priority - a.priority);
      
      this.processQueue();
    });
  }
  
  private async processQueue(): Promise<void> {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }
    
    const item = this.queue.shift()!;
    this.running++;
    
    try {
      const result = await item.operation();
      item.resolve(result);
    } catch (error) {
      item.reject(error as Error);
    } finally {
      this.running--;
      this.processQueue(); // Process next item
    }
  }
}

// Usage
const operationManager = new ConcurrentOperationManager();

// High priority operation
const healthValue = await operationManager.enqueue(
  () => engine.readByte(0x274ED),
  10 // High priority
);

// Low priority operation
const inventoryData = await operationManager.enqueue(
  () => engine.readBytes(0x27300, 0x80),
  1 // Low priority
);
```

## Performance Monitoring

### 1. Performance Metrics Collection

```typescript
/**
 * Performance Monitor - Collects and analyzes operation metrics
 */
class PerformanceMonitor {
  private metrics = new Map<string, {
    totalTime: number;
    count: number;
    minTime: number;
    maxTime: number;
  }>();
  
  async measureOperation<T>(
    name: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      this.recordMetric(name, endTime - startTime);
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.recordMetric(`${name}_error`, endTime - startTime);
      throw error;
    }
  }
  
  private recordMetric(name: string, time: number): void {
    const existing = this.metrics.get(name);
    
    if (existing) {
      existing.totalTime += time;
      existing.count++;
      existing.minTime = Math.min(existing.minTime, time);
      existing.maxTime = Math.max(existing.maxTime, time);
    } else {
      this.metrics.set(name, {
        totalTime: time,
        count: 1,
        minTime: time,
        maxTime: time
      });
    }
  }
  
  getReport(): string {
    const report: string[] = ['Performance Report:', '='.repeat(50)];
    
    for (const [name, metric] of this.metrics.entries()) {
      const avgTime = metric.totalTime / metric.count;
      
      report.push(
        `${name}:`,
        `  Count: ${metric.count}`,
        `  Avg: ${avgTime.toFixed(2)}ms`,
        `  Min: ${metric.minTime.toFixed(2)}ms`,
        `  Max: ${metric.maxTime.toFixed(2)}ms`,
        ''
      );
    }
    
    return report.join('\n');
  }
  
  reset(): void {
    this.metrics.clear();
  }
}

// Global performance monitor
const perfMonitor = new PerformanceMonitor();

// Usage
const result = await perfMonitor.measureOperation(
  'health_modification',
  () => engine.modifyByte(0x274ED, 0xFF)
);

// Get performance report
console.log(perfMonitor.getReport());
```

### 2. Automated Performance Testing

```typescript
/**
 * Performance Test Suite
 */
class PerformanceTestSuite {
  private monitor = new PerformanceMonitor();
  
  async runFullSuite(engine: BinaryROMEngine): Promise<void> {
    console.log('🚀 Running Performance Test Suite');
    console.log('==================================\n');
    
    await this.testReadPerformance(engine);
    await this.testWritePerformance(engine);
    await this.testTransactionPerformance(engine);
    await this.testBatchPerformance(engine);
    
    console.log(this.monitor.getReport());
  }
  
  private async testReadPerformance(engine: BinaryROMEngine): Promise<void> {
    console.log('📖 Testing read performance...');
    
    // Single byte reads
    for (let i = 0; i < 1000; i++) {
      await this.monitor.measureOperation(
        'single_byte_read',
        () => engine.readByte(0x274ED + (i % 16))
      );
    }
    
    // Multi-byte reads
    for (let i = 0; i < 100; i++) {
      await this.monitor.measureOperation(
        'multi_byte_read',
        () => engine.readBytes(0x274C0, 64)
      );
    }
  }
  
  private async testWritePerformance(engine: BinaryROMEngine): Promise<void> {
    console.log('✏️  Testing write performance...');
    
    const backup = await engine.createBackup('Performance test');
    
    try {
      // Single byte writes
      for (let i = 0; i < 100; i++) {
        await this.monitor.measureOperation(
          'single_byte_write',
          () => engine.modifyByte(0x274ED, 0xFF)
        );
      }
    } finally {
      await engine.restoreBackup(backup.id);
    }
  }
  
  private async testTransactionPerformance(engine: BinaryROMEngine): Promise<void> {
    console.log('🔄 Testing transaction performance...');
    
    const backup = await engine.createBackup('Transaction performance test');
    
    try {
      // Small transactions
      for (let i = 0; i < 50; i++) {
        await this.monitor.measureOperation(
          'small_transaction',
          async () => {
            const transaction = await engine.beginTransaction();
            await transaction.modifyByte(0x274ED, 0xFF);
            await transaction.modifyByte(0x274EE, 0x80);
            await transaction.commit();
          }
        );
      }
      
      // Large transactions
      for (let i = 0; i < 10; i++) {
        await this.monitor.measureOperation(
          'large_transaction',
          async () => {
            const transaction = await engine.beginTransaction();
            for (let j = 0; j < 20; j++) {
              await transaction.modifyByte(0x274C0 + j, 0xFF);
            }
            await transaction.commit();
          }
        );
      }
    } finally {
      await engine.restoreBackup(backup.id);
    }
  }
  
  private async testBatchPerformance(engine: BinaryROMEngine): Promise<void> {
    console.log('📦 Testing batch performance...');
    
    const batcher = new TransactionBatcher();
    
    // Batch reads
    await this.monitor.measureOperation(
      'batch_reads',
      async () => {
        const promises = [];
        for (let i = 0; i < 50; i++) {
          promises.push(
            batcher.queueOperation(engine, 'read', 0x274C0 + i)
          );
        }
        await Promise.all(promises);
      }
    );
  }
}

// Run performance tests
const perfTests = new PerformanceTestSuite();
await perfTests.runFullSuite(engine);
```

## Best Practices Summary

### 1. File I/O Optimization
- ✅ Use caching for frequently accessed data
- ✅ Batch multiple operations together
- ✅ Use contiguous reads when possible
- ✅ Implement lazy loading for large datasets

### 2. Memory Management
- ✅ Use object and buffer pools
- ✅ Avoid unnecessary allocations
- ✅ Clear references when done
- ✅ Monitor memory usage

### 3. Algorithm Optimization
- ✅ Index frequently queried data
- ✅ Use appropriate data structures
- ✅ Implement spatial indexing for ranges
- ✅ Cache computed results

### 4. Transaction Optimization
- ✅ Batch related operations
- ✅ Use lazy backup creation
- ✅ Minimize transaction scope
- ✅ Implement operation queuing

### 5. Monitoring and Testing
- ✅ Measure operation performance
- ✅ Set performance baselines
- ✅ Regular performance testing
- ✅ Profile bottlenecks

## Performance Checklist

Before deploying ROM modifications:

- [ ] Profile critical paths with performance monitor
- [ ] Implement caching for repeated operations
- [ ] Use batch operations where possible
- [ ] Set up performance regression tests
- [ ] Monitor memory usage patterns
- [ ] Optimize discovery database queries
- [ ] Use efficient data structures
- [ ] Minimize file I/O operations

Remember: **Measure first, optimize second.** Always profile your specific use case before applying optimizations.