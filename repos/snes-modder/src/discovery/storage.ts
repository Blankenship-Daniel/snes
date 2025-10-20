/**
 * Discovery Storage Layer - Scalable and Maintainable
 * Sam's approach: Partition, compress, cache
 * 
 * STORAGE STRATEGY:
 * 1. Partition by category (prevent 100MB JSON files)
 * 2. Lazy load partitions (only load what you need)
 * 3. Write-ahead log for changes (crash recovery)
 * 4. Periodic compaction (merge small files)
 * 5. Cache hot data in memory
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { gzipSync, gunzipSync } from 'zlib';
import { 
  Discovery, 
  DiscoveryCategory,
  DiscoveryIndex,
  SchemaVersion 
} from './schema';

/**
 * Storage configuration
 */
export interface StorageConfig {
  baseDir: string;
  maxPartitionSize: number;  // bytes
  enableCompression: boolean;
  enableCache: boolean;
  cacheSize: number;  // max items in cache
  autoCompact: boolean;
  compactThreshold: number;  // files before compaction
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: StorageConfig = {
  baseDir: './data/discoveries',
  maxPartitionSize: 10 * 1024 * 1024,  // 10MB
  enableCompression: true,
  enableCache: true,
  cacheSize: 1000,
  autoCompact: true,
  compactThreshold: 100
};

/**
 * Partition metadata
 */
interface PartitionMeta {
  category: DiscoveryCategory;
  partitionId: number;
  itemCount: number;
  sizeBytes: number;
  createdAt: Date;
  lastModified: Date;
  schemaVersion: SchemaVersion;
}

/**
 * Write-ahead log entry
 */
interface WALEntry {
  timestamp: Date;
  operation: 'add' | 'update' | 'delete';
  discovery: Discovery;
  partitionKey: string;
}

/**
 * Main storage class
 */
export class DiscoveryStorage {
  private config: StorageConfig;
  private indices: Map<DiscoveryCategory, DiscoveryIndex<Discovery>>;
  private cache: LRUCache<Discovery>;
  private wal: WALEntry[] = [];
  private partitionMeta: Map<string, PartitionMeta>;
  
  constructor(config: Partial<StorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.indices = new Map();
    this.cache = new LRUCache(this.config.cacheSize);
    this.partitionMeta = new Map();
  }
  
  /**
   * Initialize storage system
   */
  async initialize(): Promise<void> {
    // Create directory structure
    await this.createDirectoryStructure();
    
    // Load partition metadata
    await this.loadPartitionMetadata();
    
    // Recovery from WAL if needed
    await this.recoverFromWAL();
    
    // Load hot partitions into cache
    await this.preloadHotPartitions();
  }
  
  /**
   * Add a discovery
   */
  async add(discovery: Discovery): Promise<void> {
    // Validate discovery
    this.validateDiscovery(discovery);
    
    // Add to WAL
    this.wal.push({
      timestamp: new Date(),
      operation: 'add',
      discovery,
      partitionKey: this.getPartitionKey(discovery)
    });
    
    // Add to index
    const index = this.getOrCreateIndex(discovery.category);
    index.add(discovery);
    
    // Add to cache
    if (this.config.enableCache) {
      this.cache.put(discovery.id, discovery);
    }
    
    // Persist to disk
    await this.persistDiscovery(discovery);
    
    // Check if compaction needed
    if (this.config.autoCompact) {
      await this.maybeCompact(discovery.category);
    }
  }
  
  /**
   * Get a discovery by ID
   */
  async get(id: string, category?: DiscoveryCategory): Promise<Discovery | null> {
    // Check cache first
    if (this.config.enableCache) {
      const cached = this.cache.get(id);
      if (cached) {return cached;}
    }
    
    // Check indices
    if (category) {
      const index = this.indices.get(category);
      if (index) {
        const discovery = index.getById(id);
        if (discovery) {
          this.cache.put(id, discovery);
          return discovery;
        }
      }
    }
    
    // Load from disk
    return await this.loadFromDisk(id);
  }
  
  /**
   * Query discoveries
   */
  async query(filter: QueryFilter): Promise<Discovery[]> {
    const results: Discovery[] = [];
    
    // Use indices for fast lookups
    if (filter.category) {
      const index = this.indices.get(filter.category);
      if (index) {
        let items = index.getByCategory(filter.category);
        
        // Apply additional filters
        if (filter.confidence) {
          items = items.filter(d => d.confidence === filter.confidence);
        }
        if (filter.validated !== undefined) {
          items = items.filter(d => d.validated === filter.validated);
        }
        if (filter.name) {
          items = items.filter(d => 
            d.name.toLowerCase().includes(filter.name.toLowerCase())
          );
        }
        
        results.push(...items);
      }
    }
    
    // Apply limit
    if (filter.limit) {
      return results.slice(0, filter.limit);
    }
    
    return results;
  }
  
  /**
   * Create directory structure
   */
  private async createDirectoryStructure(): Promise<void> {
    const dirs = [
      this.config.baseDir,
      path.join(this.config.baseDir, 'partitions'),
      path.join(this.config.baseDir, 'wal'),
      path.join(this.config.baseDir, 'meta'),
      ...Object.values(DiscoveryCategory).map(cat =>
        path.join(this.config.baseDir, 'partitions', cat)
      )
    ];
    
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }
  
  /**
   * Get partition key for discovery
   */
  private getPartitionKey(discovery: Discovery): string {
    const partitionId = this.calculatePartitionId(discovery);
    return `${discovery.category}/${partitionId}`;
  }
  
  /**
   * Calculate partition ID based on discovery
   */
  private calculatePartitionId(discovery: Discovery): number {
    // Simple hash-based partitioning
    const hash = this.hashString(discovery.id);
    return Math.floor(hash % 100);  // 100 partitions per category
  }
  
  /**
   * Simple string hash
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;  // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Persist discovery to disk
   */
  private async persistDiscovery(discovery: Discovery): Promise<void> {
    const partitionKey = this.getPartitionKey(discovery);
    const filePath = path.join(
      this.config.baseDir,
      'partitions',
      `${partitionKey}.json${this.config.enableCompression ? '.gz' : ''}`
    );
    
    // Load existing partition
    let partition: Discovery[] = [];
    try {
      const data = await fs.readFile(filePath);
      const json = this.config.enableCompression 
        ? gunzipSync(data).toString()
        : data.toString();
      partition = JSON.parse(json);
    } catch {
      // File doesn't exist yet
    }
    
    // Add discovery
    partition.push(discovery);
    
    // Save partition
    const json = JSON.stringify(partition, null, 2);
    const data = this.config.enableCompression
      ? gzipSync(json)
      : Buffer.from(json);
    
    await fs.writeFile(filePath, data);
    
    // Update metadata
    this.updatePartitionMeta(partitionKey, partition.length, data.length);
  }
  
  /**
   * Update partition metadata
   */
  private updatePartitionMeta(key: string, count: number, size: number): void {
    const [category, id] = key.split('/');
    const meta: PartitionMeta = {
      category: category as DiscoveryCategory,
      partitionId: parseInt(id),
      itemCount: count,
      sizeBytes: size,
      createdAt: this.partitionMeta.get(key)?.createdAt || new Date(),
      lastModified: new Date(),
      schemaVersion: { major: 1, minor: 0, patch: 0, toString: () => '1.0.0' }
    };
    this.partitionMeta.set(key, meta);
  }
  
  /**
   * Maybe compact partitions
   */
  private async maybeCompact(category: DiscoveryCategory): Promise<void> {
    const partitions = Array.from(this.partitionMeta.values())
      .filter(p => p.category === category);
    
    // Check if we have too many small partitions
    const smallPartitions = partitions.filter(p => p.sizeBytes < 1024 * 100); // 100KB
    
    if (smallPartitions.length >= this.config.compactThreshold) {
      await this.compactPartitions(category, smallPartitions);
    }
  }
  
  /**
   * Compact small partitions
   */
  private async compactPartitions(
    category: DiscoveryCategory,
    partitions: PartitionMeta[]
  ): Promise<void> {
    // Compacting ${partitions.length} partitions for ${category}
    
    // Load all discoveries from small partitions
    const discoveries: Discovery[] = [];
    for (const partition of partitions) {
      const key = `${partition.category}/${partition.partitionId}`;
      const items = await this.loadPartition(key);
      discoveries.push(...items);
    }
    
    // Redistribute into new partitions
    const newPartitions = this.redistributeDiscoveries(discoveries);
    
    // Save new partitions
    for (const [key, items] of newPartitions.entries()) {
      await this.savePartition(key, items);
    }
    
    // Delete old partitions
    for (const partition of partitions) {
      const key = `${partition.category}/${partition.partitionId}`;
      await this.deletePartition(key);
    }
  }
  
  /**
   * Redistribute discoveries into optimal partitions
   */
  private redistributeDiscoveries(
    discoveries: Discovery[]
  ): Map<string, Discovery[]> {
    const result = new Map<string, Discovery[]>();
    
    for (const discovery of discoveries) {
      const key = this.getPartitionKey(discovery);
      if (!result.has(key)) {
        result.set(key, []);
      }
      result.get(key).push(discovery);
    }
    
    return result;
  }
  
  // Stub implementations for brevity
  private validateDiscovery(discovery: Discovery): void {
    // Implement validation
  }
  
  private getOrCreateIndex(category: DiscoveryCategory): DiscoveryIndex<Discovery> {
    if (!this.indices.has(category)) {
      this.indices.set(category, new DiscoveryIndex());
    }
    return this.indices.get(category);
  }
  
  private async loadPartitionMetadata(): Promise<void> {
    // Load metadata from disk
  }
  
  private async recoverFromWAL(): Promise<void> {
    // Recover from write-ahead log
  }
  
  private async preloadHotPartitions(): Promise<void> {
    // Preload frequently accessed partitions
  }
  
  private async loadFromDisk(id: string): Promise<Discovery | null> {
    // Load specific discovery from disk
    return null;
  }
  
  private async loadPartition(key: string): Promise<Discovery[]> {
    // Load partition from disk
    return [];
  }
  
  private async savePartition(key: string, items: Discovery[]): Promise<void> {
    // Save partition to disk
  }
  
  private async deletePartition(key: string): Promise<void> {
    // Delete partition from disk
  }
}

/**
 * Query filter
 */
export interface QueryFilter {
  category?: DiscoveryCategory;
  confidence?: string;
  validated?: boolean;
  name?: string;
  limit?: number;
}

/**
 * LRU Cache implementation
 */
class LRUCache<T> {
  private cache = new Map<string, T>();
  private readonly maxSize: number;
  
  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }
  
  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (item) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }
  
  put(key: string, value: T): void {
    // Remove if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }
  
  clear(): void {
    this.cache.clear();
  }
}