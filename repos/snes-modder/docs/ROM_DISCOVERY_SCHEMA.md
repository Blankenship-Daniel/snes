# ROM Discovery Data Structure Design

## Team Consensus

After consulting with our AI engineering team, here's the unified data structure design that balances Alex's type safety, Morgan's practicality, and Sam's maintainability requirements.

## Core Data Structure

### TypeScript Interface Design (Alex's Type-Safe Architecture)

```typescript
// Core discovery entity
interface ROMDiscovery {
  id: string;                    // UUID for unique identification
  romOffset: number;              // Position in ROM file
  memoryAddress?: number;         // Runtime memory location (if applicable)
  bank?: number;                  // Memory bank number
  size: number;                   // Size in bytes
  type: DiscoveryType;           // Strongly typed category
  subtype?: string;              // Flexible subcategory
  name: string;                  // Human-readable identifier
  description: string;           // Detailed notes
  confidence: ConfidenceLevel;   // How certain we are
  discoveredAt: Date;            // Timestamp
  discoveredBy: string;          // Method/tool used
  relationships: Relationship[]; // Links to other discoveries
  metadata: Record<string, any>; // Flexible additional data
  version: number;               // Schema version for migrations
}

// Discovery categories
enum DiscoveryType {
  ITEM = 'item',
  SPRITE = 'sprite',
  TILESET = 'tileset',
  PALETTE = 'palette',
  MUSIC = 'music',
  SOUND_EFFECT = 'sound_effect',
  TEXT = 'text',
  ROUTINE = 'routine',
  DATA_TABLE = 'data_table',
  COMPRESSION = 'compression',
  DMA_OPERATION = 'dma_operation',
  GAME_LOGIC = 'game_logic'
}

// Confidence in discovery accuracy
enum ConfidenceLevel {
  VERIFIED = 'verified',      // Tested and confirmed
  HIGH = 'high',              // Strong evidence
  MEDIUM = 'medium',          // Reasonable assumption
  LOW = 'low',               // Guess based on patterns
  HYPOTHESIS = 'hypothesis'   // Needs investigation
}

// Relationships between discoveries
interface Relationship {
  targetId: string;           // ID of related discovery
  type: RelationshipType;     // Nature of relationship
  description?: string;       // Additional context
}

enum RelationshipType {
  USES = 'uses',                    // This uses that
  USED_BY = 'used_by',             // This is used by that
  CONTAINS = 'contains',            // This contains that
  CONTAINED_IN = 'contained_in',   // This is contained in that
  REFERENCES = 'references',        // This references that
  DECOMPRESSES_TO = 'decompresses_to',
  COMPRESSED_FROM = 'compressed_from',
  TRIGGERS = 'triggers',           // This triggers that
  TRIGGERED_BY = 'triggered_by'
}
```

## Storage Implementation (Morgan's Practical Approach)

### Simple JSON Database

```typescript
class DiscoveryDatabase {
  private discoveries: Map<string, ROMDiscovery> = new Map();
  private offsetIndex: Map<number, Set<string>> = new Map();
  private typeIndex: Map<DiscoveryType, Set<string>> = new Map();
  private nameIndex: Map<string, string> = new Map();
  
  // Fast lookups
  findByOffset(offset: number): ROMDiscovery[] {
    const ids = this.offsetIndex.get(offset) || new Set();
    return Array.from(ids).map(id => this.discoveries.get(id)!);
  }
  
  findByType(type: DiscoveryType): ROMDiscovery[] {
    const ids = this.typeIndex.get(type) || new Set();
    return Array.from(ids).map(id => this.discoveries.get(id)!);
  }
  
  findByName(name: string): ROMDiscovery | undefined {
    const id = this.nameIndex.get(name);
    return id ? this.discoveries.get(id) : undefined;
  }
  
  // Range queries
  findInRange(startOffset: number, endOffset: number): ROMDiscovery[] {
    const results: ROMDiscovery[] = [];
    for (const discovery of this.discoveries.values()) {
      if (discovery.romOffset >= startOffset && 
          discovery.romOffset < endOffset) {
        results.push(discovery);
      }
    }
    return results;
  }
  
  // Persistence
  save(filepath: string): void {
    const data = {
      version: SCHEMA_VERSION,
      discoveries: Array.from(this.discoveries.values()),
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  }
  
  load(filepath: string): void {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    if (data.version !== SCHEMA_VERSION) {
      this.migrate(data);
    }
    this.rebuild(data.discoveries);
  }
}
```

## Maintainability Patterns (Sam's Clean Code Approach)

### 1. Schema Versioning & Migrations

```typescript
const SCHEMA_VERSION = 1;

class SchemaMigrator {
  private migrations: Map<number, MigrationFunction> = new Map([
    [1, this.migrateV0ToV1],
    [2, this.migrateV1ToV2]
  ]);
  
  migrate(data: any): ROMDiscovery[] {
    let version = data.version || 0;
    let discoveries = data.discoveries;
    
    while (version < SCHEMA_VERSION) {
      const migration = this.migrations.get(version + 1);
      if (!migration) throw new Error(`No migration for v${version + 1}`);
      discoveries = migration(discoveries);
      version++;
    }
    
    return discoveries;
  }
}
```

### 2. Validation Layer

```typescript
class DiscoveryValidator {
  validate(discovery: ROMDiscovery): ValidationResult {
    const errors: string[] = [];
    
    // Range checks
    if (discovery.romOffset < 0 || discovery.romOffset > ROM_SIZE) {
      errors.push(`Invalid ROM offset: ${discovery.romOffset}`);
    }
    
    if (discovery.size < 0 || discovery.size > MAX_DISCOVERY_SIZE) {
      errors.push(`Invalid size: ${discovery.size}`);
    }
    
    // Relationship validation
    for (const rel of discovery.relationships) {
      if (!this.database.exists(rel.targetId)) {
        errors.push(`Invalid relationship target: ${rel.targetId}`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
}
```

### 3. Data Partitioning

```typescript
// Separate files by type for scalability
class PartitionedStorage {
  private basePath: string;
  
  save(discoveries: ROMDiscovery[]): void {
    // Group by type
    const grouped = this.groupByType(discoveries);
    
    // Save each type to separate file
    for (const [type, items] of grouped.entries()) {
      const filepath = `${this.basePath}/${type}.json`;
      fs.writeFileSync(filepath, JSON.stringify(items, null, 2));
    }
    
    // Save index for quick lookups
    this.saveIndex(discoveries);
  }
  
  private saveIndex(discoveries: ROMDiscovery[]): void {
    const index = {
      byOffset: this.buildOffsetIndex(discoveries),
      byName: this.buildNameIndex(discoveries),
      relationships: this.buildRelationshipGraph(discoveries)
    };
    fs.writeFileSync(`${this.basePath}/index.json`, JSON.stringify(index));
  }
}
```

## Usage Examples

### Adding a Discovery

```typescript
const db = new DiscoveryDatabase();

// Add Link's starting position
db.add({
  id: crypto.randomUUID(),
  romOffset: 0x274F2,
  memoryAddress: 0x7EF36C,
  size: 2,
  type: DiscoveryType.DATA_TABLE,
  name: "Link_Starting_Health",
  description: "Link's starting/max health (3 hearts = 0x18)",
  confidence: ConfidenceLevel.VERIFIED,
  discoveredAt: new Date(),
  discoveredBy: "bsnes-plus debugger",
  relationships: [
    {
      targetId: "heart-container-item-id",
      type: RelationshipType.REFERENCES
    }
  ],
  metadata: {
    originalValue: 0x18,
    modifiedValue: 0xA0,
    unit: "hearts",
    formula: "value / 8 = heart_count"
  },
  version: SCHEMA_VERSION
});

// Add Master Sword location
db.add({
  id: crypto.randomUUID(),
  romOffset: 0x274D9,
  size: 1,
  type: DiscoveryType.ITEM,
  subtype: "sword",
  name: "Starting_Sword_Type",
  description: "Sword type in save initialization (0x00=none, 0x02=master)",
  confidence: ConfidenceLevel.VERIFIED,
  discoveredAt: new Date(),
  discoveredBy: "trace log analysis",
  relationships: [],
  metadata: {
    values: {
      0x00: "No sword",
      0x01: "Fighter's Sword",
      0x02: "Master Sword",
      0x03: "Tempered Sword",
      0x04: "Golden Sword"
    }
  },
  version: SCHEMA_VERSION
});
```

### Querying Discoveries

```typescript
// Find all items
const items = db.findByType(DiscoveryType.ITEM);

// Find discoveries at specific offset
const discoveries = db.findByOffset(0x274F2);

// Find all sprite-related discoveries
const sprites = db.findByType(DiscoveryType.SPRITE);

// Find discoveries in a ROM bank
const bank7E = db.findInRange(0x7E0000, 0x7FFFFF);

// Get relationship graph
const graph = db.getRelationshipGraph("master-sword-id");
```

## File Organization

```
discoveries/
├── index.json           # Master index for fast lookups
├── items.json          # All item discoveries
├── sprites.json        # All sprite discoveries
├── tilesets.json       # All tileset discoveries
├── routines.json       # All routine discoveries
├── game_logic.json     # All game logic discoveries
├── relationships.json  # Relationship graph
├── metadata.json       # Schema version, stats
└── backups/           # Versioned backups
    ├── 2024-01-01.tar.gz
    └── 2024-01-02.tar.gz
```

## Benefits of This Design

### From Alex (Architecture):
- **Type Safety**: Full TypeScript types prevent errors
- **Scalability**: Indexed lookups handle thousands of entries
- **Flexibility**: Metadata field for unforeseen data

### From Morgan (Practicality):
- **Simple Start**: Just JSON files, no database needed
- **Works Today**: Can start using immediately
- **Easy Export**: Human-readable format

### From Sam (Maintainability):
- **Versioning**: Schema migrations handle changes
- **Validation**: Catches errors before corruption
- **Partitioning**: Keeps files manageable
- **Backups**: Version history prevents data loss

## Next Steps

1. Implement core TypeScript interfaces
2. Build the DiscoveryDatabase class
3. Create validation layer
4. Add import/export utilities
5. Build UI for discovery management
6. Integrate with trace log parser
7. Create discovery templates for common patterns

This design balances all three perspectives:
- **Robust** enough for long-term use (Alex)
- **Simple** enough to ship today (Morgan)  
- **Clean** enough to maintain forever (Sam)

The modular design allows starting simple and adding complexity as needed without breaking existing data.