/**
 * Discovery Data Schema - Built for Scale
 * Sam's approach: Immutable, versioned, validated
 * 
 * PRINCIPLES:
 * 1. Every discovery is immutable (never modify, only add)
 * 2. All data is versioned (track schema evolution)
 * 3. Validation at boundaries (parse, don't validate)
 * 4. Indexed for performance (O(1) lookups)
 * 5. Partitioned by category (prevent mega-files)
 */

// ============================================
// CORE TYPES - The foundation
// ============================================

/**
 * Semantic versioning for schema evolution
 */
export interface SchemaVersion {
  major: number;  // Breaking changes
  minor: number;  // New features
  patch: number;  // Bug fixes
  
  toString(): string;
}

/**
 * Base discovery interface - EVERYTHING extends this
 */
export interface Discovery {
  // Immutable ID - NEVER changes
  readonly id: string;
  
  // Metadata for tracking
  readonly version: SchemaVersion;
  readonly discoveredAt: Date;
  readonly discoveredBy: string;
  readonly confidence: ConfidenceLevel;
  
  // Categorization for partitioning
  readonly category: DiscoveryCategory;
  readonly subcategory?: string;
  
  // Human-readable info
  readonly name: string;
  readonly description: string;
  
  // Validation status
  readonly validated: boolean;
  readonly validatedBy?: string;
  readonly validatedAt?: Date;
  
  // Relationships (graph structure)
  readonly relatedIds?: string[];
  readonly dependencies?: string[];
  
  // Change tracking
  readonly previousVersionId?: string;
  readonly changelog?: string;
}

/**
 * Confidence levels for discoveries
 */
export enum ConfidenceLevel {
  Verified = 'verified',      // 100% confirmed
  High = 'high',              // Very likely correct
  Medium = 'medium',          // Probably correct
  Low = 'low',               // Needs verification
  Experimental = 'experimental' // Testing only
}

/**
 * Discovery categories for partitioning
 */
export enum DiscoveryCategory {
  Memory = 'memory',
  Item = 'item',
  Sprite = 'sprite',
  Tileset = 'tileset',
  Audio = 'audio',
  Logic = 'logic',
  Routine = 'routine',
  Table = 'table',
  Pointer = 'pointer',
  Text = 'text',
  Graphics = 'graphics',
  Behavior = 'behavior'
}

// ============================================
// SPECIFIC DISCOVERY TYPES
// ============================================

/**
 * Memory location discovery
 */
export interface MemoryDiscovery extends Discovery {
  readonly category: DiscoveryCategory.Memory;
  readonly address: {
    readonly bank: number;
    readonly offset: number;
    readonly pc?: number;  // PC address if applicable
  };
  readonly size: number;  // bytes
  readonly dataType: MemoryDataType;
  readonly access: 'read' | 'write' | 'read-write';
  readonly usage: string;
  readonly notes?: string;
}

export enum MemoryDataType {
  Byte = 'byte',
  Word = 'word',
  Long = 'long',
  Pointer = 'pointer',
  Array = 'array',
  Struct = 'struct',
  Code = 'code',
  Data = 'data'
}

/**
 * Item discovery
 */
export interface ItemDiscovery extends Discovery {
  readonly category: DiscoveryCategory.Item;
  readonly itemId: number;
  readonly memoryAddress: number;
  readonly properties: {
    readonly name: string;
    readonly type: ItemType;
    readonly value?: number;
    readonly effect?: string;
    readonly graphics?: {
      readonly spriteId: number;
      readonly paletteId: number;
    };
  };
}

export enum ItemType {
  Weapon = 'weapon',
  Shield = 'shield',
  Armor = 'armor',
  Consumable = 'consumable',
  Key = 'key',
  Tool = 'tool',
  Magic = 'magic',
  Quest = 'quest'
}

/**
 * Sprite discovery
 */
export interface SpriteDiscovery extends Discovery {
  readonly category: DiscoveryCategory.Sprite;
  readonly spriteId: number;
  readonly properties: {
    readonly name: string;
    readonly type: SpriteType;
    readonly size: { width: number; height: number };
    readonly tileData: number[];
    readonly paletteIds: number[];
    readonly animations?: AnimationData[];
  };
  readonly memoryLocations: {
    readonly dataTable: number;
    readonly pointerTable?: number;
    readonly routineAddress?: number;
  };
}

export enum SpriteType {
  Player = 'player',
  Enemy = 'enemy',
  NPC = 'npc',
  Boss = 'boss',
  Object = 'object',
  Projectile = 'projectile',
  Effect = 'effect'
}

export interface AnimationData {
  readonly frameCount: number;
  readonly frameDuration: number;
  readonly frames: number[];
}

/**
 * Routine/Function discovery
 */
export interface RoutineDiscovery extends Discovery {
  readonly category: DiscoveryCategory.Routine;
  readonly address: {
    readonly bank: number;
    readonly start: number;
    readonly end: number;
  };
  readonly signature: string;  // Function signature
  readonly parameters: ParameterInfo[];
  readonly returns: ReturnInfo;
  readonly callers: number[];  // Addresses that call this
  readonly calls: number[];    // Addresses this routine calls
  readonly sideEffects: string[];
  readonly verified: boolean;
}

export interface ParameterInfo {
  readonly name: string;
  readonly register: 'A' | 'X' | 'Y' | 'Stack' | 'Direct';
  readonly type: string;
  readonly description: string;
}

export interface ReturnInfo {
  readonly register: 'A' | 'X' | 'Y' | 'Carry' | 'Zero';
  readonly type: string;
  readonly description: string;
}

// ============================================
// VALIDATION SCHEMAS (using Zod for runtime validation)
// ============================================

import { z } from 'zod';

export const SchemaVersionSchema = z.object({
  major: z.number().int().min(0),
  minor: z.number().int().min(0),
  patch: z.number().int().min(0)
});

export const DiscoveryBaseSchema = z.object({
  id: z.string().uuid(),
  version: SchemaVersionSchema,
  discoveredAt: z.date(),
  discoveredBy: z.string(),
  confidence: z.nativeEnum(ConfidenceLevel),
  category: z.nativeEnum(DiscoveryCategory),
  subcategory: z.string().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(1000),
  validated: z.boolean(),
  validatedBy: z.string().optional(),
  validatedAt: z.date().optional(),
  relatedIds: z.array(z.string().uuid()).optional(),
  dependencies: z.array(z.string().uuid()).optional(),
  previousVersionId: z.string().uuid().optional(),
  changelog: z.string().optional()
});

// ============================================
// INDEXING SYSTEM
// ============================================

/**
 * Index for O(1) lookups
 */
export class DiscoveryIndex<T extends Discovery> {
  private readonly byId = new Map<string, T>();
  private readonly byCategory = new Map<DiscoveryCategory, Set<string>>();
  private readonly byName = new Map<string, Set<string>>();
  private readonly byAddress = new Map<number, Set<string>>();
  private readonly byConfidence = new Map<ConfidenceLevel, Set<string>>();
  
  add(discovery: T): void {
    // Primary index
    this.byId.set(discovery.id, discovery);
    
    // Category index
    if (!this.byCategory.has(discovery.category)) {
      this.byCategory.set(discovery.category, new Set());
    }
    this.byCategory.get(discovery.category).add(discovery.id);
    
    // Name index (for search)
    const nameKey = discovery.name.toLowerCase();
    if (!this.byName.has(nameKey)) {
      this.byName.set(nameKey, new Set());
    }
    this.byName.get(nameKey).add(discovery.id);
    
    // Address index (if applicable)
    if ('address' in discovery) {
      const addr = (discovery as any).address;
      const key = typeof addr === 'number' ? addr : addr.offset;
      if (!this.byAddress.has(key)) {
        this.byAddress.set(key, new Set());
      }
      this.byAddress.get(key).add(discovery.id);
    }
    
    // Confidence index
    if (!this.byConfidence.has(discovery.confidence)) {
      this.byConfidence.set(discovery.confidence, new Set());
    }
    this.byConfidence.get(discovery.confidence).add(discovery.id);
  }
  
  getById(id: string): T | undefined {
    return this.byId.get(id);
  }
  
  getByCategory(category: DiscoveryCategory): T[] {
    const ids = this.byCategory.get(category) || new Set();
    return Array.from(ids).map(id => this.byId.get(id)).filter(Boolean);
  }
  
  getByAddress(address: number): T[] {
    const ids = this.byAddress.get(address) || new Set();
    return Array.from(ids).map(id => this.byId.get(id)).filter(Boolean);
  }
  
  search(query: string): T[] {
    const nameKey = query.toLowerCase();
    const ids = this.byName.get(nameKey) || new Set();
    return Array.from(ids).map(id => this.byId.get(id)).filter(Boolean);
  }
  
  getStats(): IndexStats {
    return {
      totalDiscoveries: this.byId.size,
      byCategory: Object.fromEntries(
        Array.from(this.byCategory.entries()).map(([k, v]) => [k, v.size])
      ),
      byConfidence: Object.fromEntries(
        Array.from(this.byConfidence.entries()).map(([k, v]) => [k, v.size])
      )
    };
  }
}

export interface IndexStats {
  totalDiscoveries: number;
  byCategory: Record<string, number>;
  byConfidence: Record<string, number>;
}

// ============================================
// MIGRATION SYSTEM
// ============================================

/**
 * Migration for schema changes
 */
export interface Migration {
  fromVersion: SchemaVersion;
  toVersion: SchemaVersion;
  migrate(data: unknown): unknown;
  rollback(data: unknown): unknown;
}

/**
 * Migration manager
 */
export class MigrationManager {
  private migrations: Migration[] = [];
  
  register(migration: Migration): void {
    this.migrations.push(migration);
    this.migrations.sort((a, b) => 
      this.compareVersions(a.fromVersion, b.fromVersion)
    );
  }
  
  migrate(data: unknown, fromVersion: SchemaVersion, toVersion: SchemaVersion): unknown {
    let current = data;
    let currentVersion = fromVersion;
    
    while (this.compareVersions(currentVersion, toVersion) < 0) {
      const migration = this.findMigration(currentVersion);
      if (!migration) {
        throw new Error(`No migration from ${currentVersion.toString()}`);
      }
      current = migration.migrate(current);
      currentVersion = migration.toVersion;
    }
    
    return current;
  }
  
  private findMigration(version: SchemaVersion): Migration | undefined {
    return this.migrations.find(m => 
      this.compareVersions(m.fromVersion, version) === 0
    );
  }
  
  private compareVersions(a: SchemaVersion, b: SchemaVersion): number {
    if (a.major !== b.major) {return a.major - b.major;}
    if (a.minor !== b.minor) {return a.minor - b.minor;}
    return a.patch - b.patch;
  }
}