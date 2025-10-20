/**
 * Basic Health Modification Example 🟢 BEGINNER
 * 
 * This example demonstrates the most basic ROM modification:
 * changing Link's health values in The Legend of Zelda: A Link to the Past.
 * 
 * What you'll learn:
 * - Basic BinaryROMEngine usage
 * - Safe address validation
 * - Simple byte modifications
 * - Error handling patterns
 */

import { BinaryROMEngine, BinaryROMError } from '../../src/lib/BinaryROMEngine';
import { DiscoveryDatabase } from '../../src/lib/DiscoveryDatabase';

async function basicHealthModification() {
  console.log('🎮 Basic Health Modification Example');
  console.log('=====================================\n');

  // Initialize the ROM engine
  const engine = new BinaryROMEngine('./zelda3.smc');
  
  try {
    // Step 1: Initialize the engine and validate ROM
    console.log('📂 Loading ROM file...');
    await engine.initialize();
    
    const header = await engine.readHeader();
    console.log(`✅ ROM loaded: ${header.title}`);
    console.log(`📊 ROM size: ${header.romSize} KB\n`);

    // Step 2: Define known health addresses (validated offsets)
    const HEALTH_ADDRESSES = {
      maxHealth: 0x274EC,    // Maximum health capacity
      currentHealth: 0x274ED // Current health value
    };

    // Step 3: Read current health values
    console.log('💖 Reading current health values...');
    const maxHealth = await engine.readByte(HEALTH_ADDRESSES.maxHealth);
    const currentHealth = await engine.readByte(HEALTH_ADDRESSES.currentHealth);
    
    console.log(`Max Health: ${maxHealth} (0x${maxHealth.toString(16).toUpperCase()})`);
    console.log(`Current Health: ${currentHealth} (0x${currentHealth.toString(16).toUpperCase()})\n`);

    // Step 4: Create a backup before modification
    console.log('💾 Creating backup...');
    const backup = await engine.createBackup('Before health modification');
    console.log(`✅ Backup created: ${backup.id}\n`);

    // Step 5: Modify health values
    console.log('⚡ Modifying health values...');
    
    // Set maximum health to 20 hearts (0x140 = 320 in decimal, 20 hearts * 16 health per heart)
    const newMaxHealth = 0x140;
    const maxHealthResult = await engine.modifyByte(HEALTH_ADDRESSES.maxHealth, newMaxHealth);
    
    if (maxHealthResult.success) {
      console.log(`✅ Max health: ${maxHealthResult.originalValue} → ${maxHealthResult.newValue}`);
    } else {
      throw new Error(`Failed to modify max health: ${maxHealthResult.error}`);
    }

    // Set current health to match maximum
    const currentHealthResult = await engine.modifyByte(HEALTH_ADDRESSES.currentHealth, newMaxHealth);
    
    if (currentHealthResult.success) {
      console.log(`✅ Current health: ${currentHealthResult.originalValue} → ${currentHealthResult.newValue}`);
    } else {
      throw new Error(`Failed to modify current health: ${currentHealthResult.error}`);
    }

    // Step 6: Verify modifications
    console.log('\n🔍 Verifying modifications...');
    const newMaxHealthRead = await engine.readByte(HEALTH_ADDRESSES.maxHealth);
    const newCurrentHealthRead = await engine.readByte(HEALTH_ADDRESSES.currentHealth);
    
    console.log(`Verified Max Health: ${newMaxHealthRead} (0x${newMaxHealthRead.toString(16).toUpperCase()})`);
    console.log(`Verified Current Health: ${newCurrentHealthRead} (0x${newCurrentHealthRead.toString(16).toUpperCase()})`);

    if (newMaxHealthRead === newMaxHealth && newCurrentHealthRead === newMaxHealth) {
      console.log('✅ Health modification successful!\n');
    } else {
      console.log('❌ Health modification verification failed!\n');
    }

    // Step 7: Optional - Show how to restore from backup
    console.log('📝 Example: How to restore from backup');
    console.log('(Uncomment the next line to actually restore)');
    // await engine.restoreBackup(backup.id);
    // console.log('✅ ROM restored to original state');

    console.log('\n🎉 Health modification example completed!');
    console.log('💡 Tip: Test this in an emulator to see Link with 20 hearts!');

  } catch (error) {
    if (error instanceof BinaryROMError) {
      console.error('❌ ROM modification error:', error.message);
      console.error('🔧 Operation:', error.operation);
      if (error.address !== undefined) {
        console.error('📍 Address:', `0x${error.address.toString(16).toUpperCase()}`);
      }
    } else {
      console.error('❌ Unexpected error:', error);
    }
  } finally {
    // Always close the engine to free resources
    await engine.close();
    console.log('🔒 ROM engine closed');
  }
}

/**
 * Advanced Health Modification with Discovery Database
 * 
 * This shows how to use the discovery database for safer, 
 * metadata-driven modifications.
 */
async function advancedHealthModification() {
  console.log('\n🔬 Advanced Health Modification with Discovery Database');
  console.log('======================================================\n');

  const engine = new BinaryROMEngine('./zelda3.smc');
  const db = new DiscoveryDatabase('./discoveries');

  try {
    await engine.initialize();

    // Query the discovery database for health-related discoveries
    console.log('🔍 Querying discovery database...');
    const healthDiscoveries = db.findByTags(['health', 'player']);
    
    if (healthDiscoveries.length === 0) {
      console.log('📝 No health discoveries found in database');
      console.log('💡 Run discovery scripts first to populate the database');
      return;
    }

    console.log(`✅ Found ${healthDiscoveries.length} health-related discoveries\n`);

    // Use discoveries for safe modifications
    for (const discovery of healthDiscoveries) {
      if (discovery.metadata?.field === 'maxHealth') {
        console.log(`🎯 Modifying ${discovery.name} at 0x${discovery.address.rom.toString(16)}`);
        
        const result = await engine.modifyByte(discovery.address.rom, 0x140);
        if (result.success) {
          console.log(`✅ ${discovery.name}: ${result.originalValue} → ${result.newValue}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Advanced modification error:', error);
  } finally {
    await engine.close();
  }
}

// Run the examples
if (require.main === module) {
  Promise.resolve()
    .then(() => basicHealthModification())
    .then(() => advancedHealthModification())
    .catch(console.error);
}

export { basicHealthModification, advancedHealthModification };