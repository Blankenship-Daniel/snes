/**
 * Discovery Manager - Clean API for discovery data
 * Sam's approach: Simple interface, complex implementation
 * 
 * DESIGN GOALS:
 * 1. Hide complexity from consumers
 * 2. Enforce validation at boundaries
 * 3. Provide useful abstractions
 * 4. Make the right thing easy
 * 5. Make the wrong thing hard
 */

import { z } from 'zod';
import { 
  Discovery,
  DiscoveryCategory,
  ConfidenceLevel,
  ItemDiscovery,
  SpriteDiscovery,
  MemoryDiscovery,
  RoutineDiscovery,
  SchemaVersion,
  DiscoveryBaseSchema
} from './schema';
import { DiscoveryStorage, QueryFilter } from './storage';

/**
 * Discovery manager configuration
 */
export interface ManagerConfig {
  dataDir?: string;
  autoSave?: boolean;
  validateOnAdd?: boolean;
  requireValidation?: boolean;
  allowDuplicates?: boolean;
}

/**
 * Discovery statistics
 */
export interface DiscoveryStats {
  total: number;
  byCategory: Record<DiscoveryCategory, number>;
  byConfidence: Record<ConfidenceLevel, number>;
  validated: number;
  unvalidated: number;
  lastUpdated: Date;
}

/**
 * Import/Export format
 */
export interface DiscoveryExport {
  version: SchemaVersion;
  exportedAt: Date;
  exportedBy: string;
  discoveries: Discovery[];
  stats: DiscoveryStats;
}

/**
 * Main discovery manager
 */
export class DiscoveryManager {
  private storage: DiscoveryStorage;
  private config: Required<ManagerConfig>;
  private validators: Map<DiscoveryCategory, z.ZodSchema>;
  private hooks: DiscoveryHooks;
  
  constructor(config: ManagerConfig = {}) {
    this.config = {
      dataDir: config.dataDir || './data/discoveries',
      autoSave: config.autoSave ?? true,
      validateOnAdd: config.validateOnAdd ?? true,
      requireValidation: config.requireValidation ?? false,
      allowDuplicates: config.allowDuplicates ?? false
    };
    
    this.storage = new DiscoveryStorage({
      baseDir: this.config.dataDir
    });
    
    this.validators = new Map();
    this.hooks = new DiscoveryHooks();
    
    this.registerDefaultValidators();
  }
  
  /**
   * Initialize the manager
   */
  async initialize(): Promise<void> {
    await this.storage.initialize();
  }
  
  // ============================================
  // CRUD OPERATIONS
  // ============================================
  
  /**
   * Add a new discovery
   */
  async addDiscovery<T extends Discovery>(discovery: T): Promise<string> {
    // Run pre-add hooks
    await this.hooks.runHooks('beforeAdd', discovery);
    
    // Validate if enabled
    if (this.config.validateOnAdd) {
      this.validateDiscovery(discovery);
    }
    
    // Check for duplicates
    if (!this.config.allowDuplicates) {
      await this.checkDuplicates(discovery);
    }
    
    // Generate ID if needed
    const finalDiscovery = {
      ...discovery,
      id: discovery.id || this.generateId(),
      discoveredAt: discovery.discoveredAt || new Date(),
      version: discovery.version || this.getCurrentVersion()
    };
    
    // Store
    await this.storage.add(finalDiscovery);
    
    // Run post-add hooks
    await this.hooks.runHooks('afterAdd', finalDiscovery);
    
    return finalDiscovery.id;
  }
  
  /**
   * Get discovery by ID
   */
  async getDiscovery(id: string): Promise<Discovery | null> {
    return await this.storage.get(id);
  }
  
  /**
   * Update a discovery (creates new version)
   */
  async updateDiscovery<T extends Discovery>(
    id: string,
    updates: Partial<T>,
    changelog?: string
  ): Promise<string> {
    const existing = await this.getDiscovery(id);
    if (!existing) {
      throw new Error(`Discovery ${id} not found`);
    }
    
    // Create new version
    const newDiscovery: T = {
      ...existing as T,
      ...updates,
      id: this.generateId(),
      previousVersionId: id,
      changelog: changelog || 'Updated',
      version: this.bumpVersion(existing.version)
    };
    
    return await this.addDiscovery(newDiscovery);
  }
  
  /**
   * Query discoveries
   */
  async queryDiscoveries(filter: QueryFilter): Promise<Discovery[]> {
    return await this.storage.query(filter);
  }
  
  // ============================================
  // SPECIALIZED QUERIES
  // ============================================
  
  /**
   * Get all items
   */
  async getItems(): Promise<ItemDiscovery[]> {
    const discoveries = await this.storage.query({
      category: DiscoveryCategory.Item
    });
    return discoveries as ItemDiscovery[];
  }
  
  /**
   * Get all sprites
   */
  async getSprites(): Promise<SpriteDiscovery[]> {
    const discoveries = await this.storage.query({
      category: DiscoveryCategory.Sprite
    });
    return discoveries as SpriteDiscovery[];
  }
  
  /**
   * Get memory map
   */
  async getMemoryMap(): Promise<MemoryDiscovery[]> {
    const discoveries = await this.storage.query({
      category: DiscoveryCategory.Memory
    });
    return (discoveries as MemoryDiscovery[]).sort((a, b) => 
      a.address.offset - b.address.offset
    );
  }
  
  /**
   * Get routines
   */
  async getRoutines(): Promise<RoutineDiscovery[]> {
    const discoveries = await this.storage.query({
      category: DiscoveryCategory.Routine
    });
    return discoveries as RoutineDiscovery[];
  }
  
  // ============================================
  // VALIDATION
  // ============================================
  
  /**
   * Validate a discovery
   */
  validateDiscovery(discovery: Discovery): void {
    // Base validation
    const baseResult = DiscoveryBaseSchema.safeParse(discovery);
    if (!baseResult.success) {
      throw new ValidationError('Base validation failed', baseResult.error);
    }
    
    // Category-specific validation
    const validator = this.validators.get(discovery.category);
    if (validator) {
      const result = validator.safeParse(discovery);
      if (!result.success) {
        throw new ValidationError(`${discovery.category} validation failed`, result.error);
      }
    }
    
    // Custom validation rules
    this.validateCustomRules(discovery);
  }
  
  /**
   * Custom validation rules
   */
  private validateCustomRules(discovery: Discovery): void {
    // Name uniqueness within category
    if (discovery.name.length < 3) {
      throw new ValidationError('Name must be at least 3 characters');
    }
    
    // Confidence requirements
    if (this.config.requireValidation && !discovery.validated) {
      if (discovery.confidence !== ConfidenceLevel.Experimental) {
        throw new ValidationError('Unvalidated discoveries must be marked experimental');
      }
    }
    
    // Related IDs must exist
    if (discovery.relatedIds) {
      // Would check these exist in storage
    }
  }
  
  /**
   * Mark discovery as validated
   */
  async validateDiscoveryById(
    id: string,
    validatedBy: string
  ): Promise<void> {
    await this.updateDiscovery(id, {
      validated: true,
      validatedBy,
      validatedAt: new Date(),
      confidence: ConfidenceLevel.Verified
    }, 'Marked as validated');
  }
  
  // ============================================
  // IMPORT/EXPORT
  // ============================================
  
  /**
   * Export discoveries
   */
  async export(filter?: QueryFilter): Promise<DiscoveryExport> {
    const discoveries = await this.queryDiscoveries(filter || {});
    const stats = await this.getStatistics();
    
    return {
      version: this.getCurrentVersion(),
      exportedAt: new Date(),
      exportedBy: 'DiscoveryManager',
      discoveries,
      stats
    };
  }
  
  /**
   * Import discoveries
   */
  async import(data: DiscoveryExport): Promise<ImportResult> {
    const results: ImportResult = {
      imported: 0,
      skipped: 0,
      errors: []
    };
    
    for (const discovery of data.discoveries) {
      try {
        await this.addDiscovery(discovery);
        results.imported++;
      } catch (error) {
        if (error instanceof DuplicateError) {
          results.skipped++;
        } else {
          results.errors.push({
            discovery: discovery.id,
            error: error.message
          });
        }
      }
    }
    
    return results;
  }
  
  // ============================================
  // STATISTICS
  // ============================================
  
  /**
   * Get statistics
   */
  async getStatistics(): Promise<DiscoveryStats> {
    const all = await this.storage.query({});
    
    const byCategory: Record<DiscoveryCategory, number> = {} as any;
    const byConfidence: Record<ConfidenceLevel, number> = {} as any;
    let validated = 0;
    
    for (const discovery of all) {
      byCategory[discovery.category] = (byCategory[discovery.category] || 0) + 1;
      byConfidence[discovery.confidence] = (byConfidence[discovery.confidence] || 0) + 1;
      if (discovery.validated) {validated++;}
    }
    
    return {
      total: all.length,
      byCategory,
      byConfidence,
      validated,
      unvalidated: all.length - validated,
      lastUpdated: new Date()
    };
  }
  
  // ============================================
  // HELPERS
  // ============================================
  
  private generateId(): string {
    return crypto.randomUUID();
  }
  
  private getCurrentVersion(): SchemaVersion {
    return { major: 1, minor: 0, patch: 0, toString: () => '1.0.0' };
  }
  
  private bumpVersion(version: SchemaVersion): SchemaVersion {
    return {
      ...version,
      patch: version.patch + 1,
      toString: () => `${version.major}.${version.minor}.${version.patch + 1}`
    };
  }
  
  private async checkDuplicates(discovery: Discovery): Promise<void> {
    const existing = await this.storage.query({
      category: discovery.category,
      name: discovery.name
    });
    
    if (existing.length > 0) {
      throw new DuplicateError(`Discovery with name "${discovery.name}" already exists`);
    }
  }
  
  private registerDefaultValidators(): void {
    // Register validators for each category
    // Implementation omitted for brevity
  }
}

// ============================================
// HOOKS SYSTEM
// ============================================

type HookType = 'beforeAdd' | 'afterAdd' | 'beforeUpdate' | 'afterUpdate';
type HookFunction = (discovery: Discovery) => Promise<void> | void;

class DiscoveryHooks {
  private hooks: Map<HookType, HookFunction[]> = new Map();
  
  register(type: HookType, fn: HookFunction): void {
    if (!this.hooks.has(type)) {
      this.hooks.set(type, []);
    }
    this.hooks.get(type).push(fn);
  }
  
  async runHooks(type: HookType, discovery: Discovery): Promise<void> {
    const hooks = this.hooks.get(type) || [];
    for (const hook of hooks) {
      await hook(discovery);
    }
  }
}

// ============================================
// ERROR TYPES
// ============================================

export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class DuplicateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateError';
  }
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{ discovery: string; error: string }>;
}