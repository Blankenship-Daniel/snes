/**
 * Discovery Integration Example 🟡 INTERMEDIATE
 * 
 * This example demonstrates how to use the discovery database for
 * metadata-driven ROM modifications with full type safety.
 * 
 * What you'll learn:
 * - Discovery database integration
 * - Metadata-driven modifications
 * - Relationship tracking
 * - Safe discovery-based operations
 */

import { BinaryROMEngine } from '../../src/lib/BinaryROMEngine';
import { DiscoveryDatabase, DiscoveryBuilder } from '../../src/lib/DiscoveryDatabase';
import { DiscoveryCategory, ConfidenceLevel } from '../../src/discovery/types/core.types';
import { toROMAddress } from '../../src/discovery/types/guards';

interface ModificationPlan {
  discoveryId: string;
  newValue: number;
  reason: string;
  priority: number;
}

async function discoveryBasedModification() {
  console.log('🔬 Discovery-Based ROM Modification');
  console.log('==================================\n');

  const engine = new BinaryROMEngine('./zelda3.smc');
  const db = new DiscoveryDatabase('./discoveries');

  try {
    await engine.initialize();

    // Step 1: Query discoveries from the database
    console.log('📊 Querying discovery database...');
    
    const playerDiscoveries = db.findByCategory(DiscoveryCategory.Memory)
      .filter(d => d.tags?.has('player') || d.tags?.has('save_data'));
    
    console.log(`Found ${playerDiscoveries.length} player-related discoveries\n`);

    if (playerDiscoveries.length === 0) {
      console.log('📝 No player discoveries found. Creating sample discoveries...');
      await createSampleDiscoveries(db);
      console.log('✅ Sample discoveries created\n');
    }

    // Step 2: Display available discoveries
    console.log('📋 Available discoveries:');
    for (const discovery of playerDiscoveries) {
      console.log(`  • ${discovery.name} (${discovery.id})`);
      console.log(`    Address: 0x${discovery.address.rom.toString(16)}`);
      console.log(`    Confidence: ${discovery.confidence}`);
      console.log(`    Tags: ${Array.from(discovery.tags || []).join(', ')}`);
      console.log('');
    }

    // Step 3: Create modification plan based on discoveries
    const modificationPlan = createModificationPlan(playerDiscoveries);
    
    console.log('📋 Modification plan:');
    for (const plan of modificationPlan) {
      const discovery = db.get(plan.discoveryId);
      console.log(`  ${plan.priority}. ${discovery?.name}: ${plan.reason}`);
      console.log(`     New value: 0x${plan.newValue.toString(16)}`);
    }
    console.log('');

    // Step 4: Execute modifications with discovery metadata
    console.log('⚡ Executing discovery-based modifications...');
    const backup = await engine.createBackup('Discovery-based modifications');
    
    for (const plan of modificationPlan.sort((a, b) => a.priority - b.priority)) {
      const discovery = db.get(plan.discoveryId);
      if (!discovery) {
        console.log(`❌ Discovery ${plan.discoveryId} not found`);
        continue;
      }

      try {
        // Validate discovery confidence level
        if (discovery.confidence === ConfidenceLevel.Low || 
            discovery.confidence === ConfidenceLevel.Experimental) {
          console.log(`⚠️  Warning: ${discovery.name} has ${discovery.confidence} confidence`);
          console.log('   Proceeding with caution...');
        }

        // Read current value
        const currentValue = await engine.readByte(discovery.address.rom);
        
        // Apply modification
        const result = await engine.modifyByte(discovery.address.rom, plan.newValue);
        
        if (result.success) {
          console.log(`✅ ${discovery.name}: 0x${currentValue.toString(16)} → 0x${plan.newValue.toString(16)}`);
          
          // Update discovery metadata to track modification
          await updateDiscoveryWithModification(db, discovery.id, {
            originalValue: currentValue,
            newValue: plan.newValue,
            modificationDate: new Date(),
            reason: plan.reason
          });
          
        } else {
          console.log(`❌ Failed to modify ${discovery.name}: ${result.error}`);
        }

      } catch (error) {
        console.log(`❌ Error modifying ${discovery.name}: ${error}`);
      }
    }

    // Step 5: Verify modifications using discoveries
    console.log('\n🔍 Verifying modifications...');
    await verifyModificationsUsingDiscoveries(engine, db, modificationPlan);

  } catch (error) {
    console.error('❌ Discovery integration example failed:', error);
  } finally {
    await engine.close();
  }
}

async function createSampleDiscoveries(db: DiscoveryDatabase) {
  console.log('📝 Creating sample discoveries for demonstration...');

  const discoveries = [
    new DiscoveryBuilder(DiscoveryCategory.Memory)
      .id('player_max_health')
      .name('Player Maximum Health')
      .description('Maximum health capacity for Link')
      .address({ rom: toROMAddress(0x274EC) })
      .size(1)
      .confidence(ConfidenceLevel.Verified)
      .tags(['player', 'health', 'save_data'])
      .metadata({
        source: 'zelda3-disasm MCP server',
        dataType: 'uint8',
        unit: 'health_points',
        validRange: { min: 0x18, max: 0x140 }, // 3-20 hearts
        description: 'Each heart = 16 health points'
      })
      .build(),

    new DiscoveryBuilder(DiscoveryCategory.Memory)
      .id('player_current_health')
      .name('Player Current Health')
      .description('Current health value for Link')
      .address({ rom: toROMAddress(0x274ED) })
      .size(1)
      .confidence(ConfidenceLevel.Verified)
      .tags(['player', 'health', 'save_data'])
      .metadata({
        source: 'zelda3-disasm MCP server',
        dataType: 'uint8',
        unit: 'health_points',
        relatedTo: 'player_max_health'
      })
      .build(),

    new DiscoveryBuilder(DiscoveryCategory.Memory)
      .id('player_magic_power')
      .name('Player Magic Power')
      .description('Magic meter capacity and current value')
      .address({ rom: toROMAddress(0x274EE) })
      .size(1)
      .confidence(ConfidenceLevel.High)
      .tags(['player', 'magic', 'save_data'])
      .metadata({
        source: 'bsnes-plus debugger',
        dataType: 'uint8',
        validRange: { min: 0x00, max: 0x80 }
      })
      .build(),

    new DiscoveryBuilder(DiscoveryCategory.Item)
      .id('sword_level')
      .name('Sword Upgrade Level')
      .description('Current sword level (Fighter/Master/Tempered/Golden)')
      .address({ rom: toROMAddress(0x27359) })
      .size(1)
      .confidence(ConfidenceLevel.Verified)
      .tags(['equipment', 'sword', 'upgrade'])
      .metadata({
        source: 'zelda3-disasm MCP server',
        dataType: 'uint8',
        validValues: [0x00, 0x01, 0x02, 0x03, 0x04],
        valueMapping: {
          0x00: 'No Sword',
          0x01: 'Fighter Sword',
          0x02: 'Master Sword',
          0x03: 'Tempered Sword',
          0x04: 'Golden Sword'
        }
      })
      .build()
  ];

  for (const discovery of discoveries) {
    db.add(discovery);
    console.log(`  ✅ Created: ${discovery.name}`);
  }
}

function createModificationPlan(discoveries: any[]): ModificationPlan[] {
  const plans: ModificationPlan[] = [];

  for (const discovery of discoveries) {
    if (discovery.tags?.has('health')) {
      if (discovery.metadata?.unit === 'health_points') {
        plans.push({
          discoveryId: discovery.id,
          newValue: 0x140, // 20 hearts
          reason: 'Set to maximum health (20 hearts)',
          priority: 1
        });
      }
    } else if (discovery.tags?.has('magic')) {
      plans.push({
        discoveryId: discovery.id,
        newValue: 0x80, // Full magic
        reason: 'Set to maximum magic power',
        priority: 2
      });
    } else if (discovery.tags?.has('sword')) {
      plans.push({
        discoveryId: discovery.id,
        newValue: 0x04, // Golden Sword
        reason: 'Upgrade to Golden Sword',
        priority: 3
      });
    }
  }

  return plans;
}

async function updateDiscoveryWithModification(
  db: DiscoveryDatabase,
  discoveryId: string,
  modificationInfo: any
) {
  const discovery = db.get(discoveryId);
  if (!discovery) return;

  // Create updated discovery with modification history
  const updatedMetadata = {
    ...discovery.metadata,
    lastModification: modificationInfo,
    modificationHistory: [
      ...(discovery.metadata?.modificationHistory || []),
      modificationInfo
    ]
  };

  // Note: In a real implementation, you'd update the discovery in the database
  // For this example, we're just logging the update
  console.log(`  📝 Updated discovery metadata for ${discovery.name}`);
}

async function verifyModificationsUsingDiscoveries(
  engine: BinaryROMEngine,
  db: DiscoveryDatabase,
  plans: ModificationPlan[]
) {
  let successCount = 0;
  let totalCount = plans.length;

  for (const plan of plans) {
    const discovery = db.get(plan.discoveryId);
    if (!discovery) continue;

    const currentValue = await engine.readByte(discovery.address.rom);
    const expected = plan.newValue;
    const matches = currentValue === expected;

    console.log(`  ${matches ? '✅' : '❌'} ${discovery.name}: 0x${currentValue.toString(16)} ${matches ? '==' : '!='} 0x${expected.toString(16)}`);
    
    if (matches) successCount++;
  }

  console.log(`\n📊 Verification complete: ${successCount}/${totalCount} modifications successful`);
}

async function relationshipBasedModification() {
  console.log('\n🔗 Relationship-Based Modification');
  console.log('==================================\n');

  const engine = new BinaryROMEngine('./zelda3.smc');
  const db = new DiscoveryDatabase('./discoveries');

  try {
    await engine.initialize();

    // Find discoveries with relationships
    console.log('🔍 Finding related discoveries...');
    
    const healthDiscoveries = db.findByTags(['health']);
    if (healthDiscoveries.length === 0) {
      console.log('📝 No health discoveries found for relationship demo');
      return;
    }

    // Example: When modifying max health, also update current health
    console.log('🔗 Processing health-related modifications...');
    
    for (const discovery of healthDiscoveries) {
      if (discovery.metadata?.relatedTo) {
        const relatedDiscovery = db.get(discovery.metadata.relatedTo);
        if (relatedDiscovery) {
          console.log(`Found relationship: ${discovery.name} ↔ ${relatedDiscovery.name}`);
          
          // Apply coordinated modifications
          const newMaxHealth = 0x140;
          await engine.modifyByte(relatedDiscovery.address.rom, newMaxHealth);
          await engine.modifyByte(discovery.address.rom, newMaxHealth);
          
          console.log(`✅ Updated both ${relatedDiscovery.name} and ${discovery.name}`);
        }
      }
    }

    // Track modification relationships
    console.log('\n📈 Building modification dependency graph...');
    const modificationGraph = buildModificationGraph(healthDiscoveries);
    
    for (const [source, targets] of modificationGraph.entries()) {
      console.log(`${source} affects: ${targets.join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Relationship-based modification failed:', error);
  } finally {
    await engine.close();
  }
}

function buildModificationGraph(discoveries: any[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const discovery of discoveries) {
    const relations: string[] = [];
    
    // Find related discoveries based on metadata
    if (discovery.metadata?.relatedTo) {
      relations.push(discovery.metadata.relatedTo);
    }
    
    // Find discoveries with similar tags
    for (const other of discoveries) {
      if (other.id === discovery.id) continue;
      
      const sharedTags = Array.from(discovery.tags || []).filter(tag => 
        other.tags?.has(tag)
      );
      
      if (sharedTags.length > 0) {
        relations.push(other.id);
      }
    }
    
    if (relations.length > 0) {
      graph.set(discovery.name, relations);
    }
  }

  return graph;
}

// Advanced pattern: Discovery validation before modification
async function validatedDiscoveryModification() {
  console.log('\n🛡️  Validated Discovery Modification');
  console.log('===================================\n');

  const engine = new BinaryROMEngine('./zelda3.smc');
  const db = new DiscoveryDatabase('./discoveries');

  try {
    await engine.initialize();

    // Get all discoveries
    const allDiscoveries = db.getAll();
    
    console.log('🔍 Validating discoveries before modification...');
    
    for (const discovery of allDiscoveries) {
      const validationResult = await validateDiscovery(engine, discovery);
      
      console.log(`${validationResult.isValid ? '✅' : '❌'} ${discovery.name}`);
      if (!validationResult.isValid) {
        console.log(`   Reason: ${validationResult.reason}`);
      }
      
      if (validationResult.isValid && validationResult.canModify) {
        console.log(`   ✓ Safe to modify`);
      }
    }

  } catch (error) {
    console.error('❌ Validated discovery modification failed:', error);
  } finally {
    await engine.close();
  }
}

async function validateDiscovery(engine: BinaryROMEngine, discovery: any) {
  const validation = {
    isValid: false,
    canModify: false,
    reason: ''
  };

  try {
    // Check if address is valid
    if (!engine.validateAddress(discovery.address.rom)) {
      validation.reason = 'Invalid ROM address';
      return validation;
    }

    // Check confidence level
    if (discovery.confidence === ConfidenceLevel.Low || 
        discovery.confidence === ConfidenceLevel.Experimental) {
      validation.reason = 'Confidence level too low for safe modification';
      return validation;
    }

    // Check if the discovery has required metadata
    if (!discovery.metadata || !discovery.metadata.dataType) {
      validation.reason = 'Missing required metadata';
      return validation;
    }

    // Validate current value against expected range
    if (discovery.metadata.validRange) {
      const currentValue = await engine.readByte(discovery.address.rom);
      const { min, max } = discovery.metadata.validRange;
      
      if (currentValue < min || currentValue > max) {
        validation.reason = `Current value (0x${currentValue.toString(16)}) outside valid range (0x${min.toString(16)}-0x${max.toString(16)})`;
        return validation;
      }
    }

    validation.isValid = true;
    validation.canModify = true;
    validation.reason = 'Discovery validation passed';

  } catch (error) {
    validation.reason = `Validation error: ${error}`;
  }

  return validation;
}

// Run examples
if (require.main === module) {
  Promise.resolve()
    .then(() => discoveryBasedModification())
    .then(() => relationshipBasedModification())
    .then(() => validatedDiscoveryModification())
    .catch(console.error);
}

export {
  discoveryBasedModification,
  relationshipBasedModification,
  validatedDiscoveryModification,
  createSampleDiscoveries
};