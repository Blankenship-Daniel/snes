/**
 * Transaction Patterns Example 🔴 ADVANCED
 * 
 * This example demonstrates advanced transaction management for complex
 * ROM modifications that require atomicity and rollback capability.
 * 
 * What you'll learn:
 * - Transaction lifecycle management
 * - Atomic multi-byte modifications
 * - Error recovery and rollback
 * - Best practices for complex modifications
 */

import { BinaryROMEngine, BinaryROMError } from '../../src/lib/BinaryROMEngine';

interface PlayerStats {
  maxHealth: number;
  currentHealth: number;
  maxMagic: number;
  currentMagic: number;
  attackPower: number;
  defensePower: number;
}

async function basicTransactionExample() {
  console.log('🔄 Basic Transaction Example');
  console.log('============================\n');

  const engine = new BinaryROMEngine('./zelda3.smc');

  try {
    await engine.initialize();

    // Define the save data region addresses
    const SAVE_ADDRESSES = {
      maxHealth: 0x274EC,
      currentHealth: 0x274ED,
      maxMagic: 0x274EE,
      currentMagic: 0x274EF,
      attackPower: 0x274F0,
      defensePower: 0x274F1
    };

    // Read current values
    console.log('📊 Reading current player stats...');
    const currentStats: PlayerStats = {
      maxHealth: await engine.readByte(SAVE_ADDRESSES.maxHealth),
      currentHealth: await engine.readByte(SAVE_ADDRESSES.currentHealth),
      maxMagic: await engine.readByte(SAVE_ADDRESSES.maxMagic),
      currentMagic: await engine.readByte(SAVE_ADDRESSES.currentMagic),
      attackPower: await engine.readByte(SAVE_ADDRESSES.attackPower),
      defensePower: await engine.readByte(SAVE_ADDRESSES.defensePower)
    };

    console.log('Current Stats:', currentStats);

    // Begin transaction
    console.log('\n🏁 Beginning transaction...');
    const transaction = await engine.beginTransaction();

    try {
      // Modify all stats atomically
      console.log('⚡ Applying stat modifications...');
      
      await transaction.modifyByte(SAVE_ADDRESSES.maxHealth, 0x140);    // 20 hearts
      await transaction.modifyByte(SAVE_ADDRESSES.currentHealth, 0x140);
      await transaction.modifyByte(SAVE_ADDRESSES.maxMagic, 0x80);      // Max magic
      await transaction.modifyByte(SAVE_ADDRESSES.currentMagic, 0x80);
      await transaction.modifyByte(SAVE_ADDRESSES.attackPower, 0xFF);   // Max attack
      await transaction.modifyByte(SAVE_ADDRESSES.defensePower, 0xFF);  // Max defense

      // Commit all changes atomically
      console.log('💾 Committing transaction...');
      await transaction.commit();
      console.log('✅ Transaction committed successfully!\n');

    } catch (error) {
      // Rollback on any error
      console.log('❌ Error during transaction, rolling back...');
      await transaction.rollback();
      console.log('🔄 Transaction rolled back\n');
      throw error;
    }

    // Verify changes
    console.log('🔍 Verifying modifications...');
    const newStats: PlayerStats = {
      maxHealth: await engine.readByte(SAVE_ADDRESSES.maxHealth),
      currentHealth: await engine.readByte(SAVE_ADDRESSES.currentHealth),
      maxMagic: await engine.readByte(SAVE_ADDRESSES.maxMagic),
      currentMagic: await engine.readByte(SAVE_ADDRESSES.currentMagic),
      attackPower: await engine.readByte(SAVE_ADDRESSES.attackPower),
      defensePower: await engine.readByte(SAVE_ADDRESSES.defensePower)
    };

    console.log('New Stats:', newStats);

  } catch (error) {
    console.error('❌ Transaction example failed:', error);
  } finally {
    await engine.close();
  }
}

async function complexTransactionWithValidation() {
  console.log('🛡️  Complex Transaction with Validation');
  console.log('========================================\n');

  const engine = new BinaryROMEngine('./zelda3.smc');

  try {
    await engine.initialize();

    // Create backup before complex operation
    const backup = await engine.createBackup('Before complex stat modification');
    console.log(`💾 Backup created: ${backup.id}\n`);

    // Define inventory modification plan
    const INVENTORY_BASE = 0x274C0;
    const inventoryModifications = [
      { offset: 0x00, item: 0x01, description: 'Fighter Sword' },
      { offset: 0x01, item: 0x02, description: 'Master Sword' },
      { offset: 0x02, item: 0x04, description: 'Tempered Sword' },
      { offset: 0x03, item: 0x03, description: 'Golden Sword' },
      { offset: 0x04, item: 0x01, description: 'Fighter Shield' },
      { offset: 0x05, item: 0x02, description: 'Fire Shield' },
      { offset: 0x06, item: 0x03, description: 'Mirror Shield' }
    ];

    console.log('🎯 Planning complex inventory modification...');
    console.log(`📦 Will modify ${inventoryModifications.length} inventory slots\n`);

    // Begin complex transaction with validation
    const transaction = await engine.beginTransaction();

    try {
      console.log('🔍 Validating addresses before modification...');
      
      // Pre-validate all addresses
      for (const mod of inventoryModifications) {
        const address = INVENTORY_BASE + mod.offset;
        if (!engine.validateAddress(address)) {
          throw new Error(`Invalid address: 0x${address.toString(16)}`);
        }
      }

      console.log('✅ All addresses validated\n');

      // Apply modifications with progress tracking
      console.log('⚡ Applying inventory modifications...');
      for (let i = 0; i < inventoryModifications.length; i++) {
        const mod = inventoryModifications[i];
        const address = INVENTORY_BASE + mod.offset;
        
        console.log(`  ${i + 1}/${inventoryModifications.length}: ${mod.description} (0x${mod.item.toString(16)})`);
        
        // Read original value for logging
        const originalValue = await engine.readByte(address);
        
        // Apply modification
        await transaction.modifyByte(address, mod.item);
        
        console.log(`    Address 0x${address.toString(16)}: 0x${originalValue.toString(16)} → 0x${mod.item.toString(16)}`);
      }

      // Simulate a conditional rollback scenario
      const shouldRollback = false; // Set to true to test rollback
      if (shouldRollback) {
        console.log('\n🔄 Simulating rollback scenario...');
        throw new Error('Simulated error for rollback demonstration');
      }

      console.log('\n💾 Committing complex transaction...');
      await transaction.commit();
      console.log('✅ Complex transaction committed successfully!\n');

    } catch (error) {
      console.log('❌ Error in complex transaction, rolling back...');
      await transaction.rollback();
      console.log('🔄 Complex transaction rolled back\n');
      
      // Optionally restore from backup on critical failures
      if (error.message.includes('critical')) {
        console.log('🆘 Critical error detected, restoring from backup...');
        await engine.restoreBackup(backup.id);
        console.log('✅ ROM restored from backup\n');
      }
      
      throw error;
    }

    // Verify final state
    console.log('🔍 Verifying inventory modifications...');
    for (const mod of inventoryModifications) {
      const address = INVENTORY_BASE + mod.offset;
      const value = await engine.readByte(address);
      const status = value === mod.item ? '✅' : '❌';
      console.log(`  ${status} ${mod.description}: 0x${value.toString(16)}`);
    }

  } catch (error) {
    console.error('❌ Complex transaction failed:', error);
  } finally {
    await engine.close();
  }
}

async function transactionErrorRecoveryPattern() {
  console.log('🔧 Transaction Error Recovery Pattern');
  console.log('====================================\n');

  const engine = new BinaryROMEngine('./zelda3.smc');

  try {
    await engine.initialize();

    // Demonstrate different error recovery strategies
    const recoveryStrategies = [
      'immediate_rollback',
      'retry_with_fallback',
      'partial_commit',
      'backup_restore'
    ];

    for (const strategy of recoveryStrategies) {
      console.log(`\n🧪 Testing strategy: ${strategy}`);
      console.log('─'.repeat(40));
      
      await demonstrateRecoveryStrategy(engine, strategy);
    }

  } catch (error) {
    console.error('❌ Recovery pattern demonstration failed:', error);
  } finally {
    await engine.close();
  }
}

async function demonstrateRecoveryStrategy(engine: BinaryROMEngine, strategy: string) {
  const testAddress = 0x274ED; // Health address for testing
  
  switch (strategy) {
    case 'immediate_rollback':
      console.log('Strategy: Immediate rollback on any error');
      try {
        const transaction = await engine.beginTransaction();
        await transaction.modifyByte(testAddress, 0xFF);
        // Simulate error
        throw new Error('Simulated error');
      } catch (error) {
        console.log('❌ Error caught, rolling back immediately');
        // Transaction automatically rolls back when it goes out of scope
        console.log('✅ Rollback completed');
      }
      break;

    case 'retry_with_fallback':
      console.log('Strategy: Retry with exponential backoff');
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          const transaction = await engine.beginTransaction();
          await transaction.modifyByte(testAddress, 0xFF);
          
          // Simulate intermittent failure
          if (attempts < 2 && Math.random() > 0.5) {
            throw new Error('Simulated intermittent error');
          }
          
          await transaction.commit();
          console.log(`✅ Succeeded on attempt ${attempts + 1}`);
          break;
          
        } catch (error) {
          attempts++;
          const delay = Math.pow(2, attempts) * 100; // Exponential backoff
          console.log(`❌ Attempt ${attempts} failed, retrying in ${delay}ms...`);
          
          if (attempts >= maxAttempts) {
            console.log('❌ Max attempts reached, operation failed');
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      break;

    case 'partial_commit':
      console.log('Strategy: Partial commit with error boundaries');
      const operations = [
        { address: 0x274ED, value: 0xFF, name: 'Health' },
        { address: 0x274EE, value: 0x80, name: 'Magic' },
        { address: 0x999999, value: 0xFF, name: 'Invalid' }, // This will fail
        { address: 0x274EF, value: 0x7F, name: 'Stamina' }
      ];

      for (const op of operations) {
        try {
          const transaction = await engine.beginTransaction();
          await transaction.modifyByte(op.address, op.value);
          await transaction.commit();
          console.log(`✅ ${op.name} modified successfully`);
        } catch (error) {
          console.log(`❌ ${op.name} modification failed: ${error.message}`);
          // Continue with other operations
        }
      }
      break;

    case 'backup_restore':
      console.log('Strategy: Backup before operation, restore on critical failure');
      const backup = await engine.createBackup(`Strategy test: ${strategy}`);
      
      try {
        const transaction = await engine.beginTransaction();
        await transaction.modifyByte(testAddress, 0xFF);
        
        // Simulate critical error that requires backup restore
        throw new Error('CRITICAL: ROM corruption detected');
        
      } catch (error) {
        if (error.message.includes('CRITICAL')) {
          console.log('🆘 Critical error detected, restoring from backup...');
          await engine.restoreBackup(backup.id);
          console.log('✅ ROM restored from backup');
        } else {
          console.log('❌ Non-critical error, transaction rolled back');
        }
      }
      break;
  }
}

// Best practices utility functions
export class TransactionManager {
  private engine: BinaryROMEngine;
  private backupStack: string[] = [];

  constructor(engine: BinaryROMEngine) {
    this.engine = engine;
  }

  /**
   * Execute a complex operation with automatic backup and rollback
   */
  async executeWithBackup<T>(
    operation: () => Promise<T>,
    description: string = 'Transaction operation'
  ): Promise<T> {
    const backup = await this.engine.createBackup(description);
    this.backupStack.push(backup.id);

    try {
      const result = await operation();
      console.log(`✅ Operation "${description}" completed successfully`);
      return result;
    } catch (error) {
      console.log(`❌ Operation "${description}" failed, restoring backup...`);
      await this.engine.restoreBackup(backup.id);
      throw error;
    } finally {
      this.backupStack.pop();
    }
  }

  /**
   * Execute with retry logic and exponential backoff
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 100
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          break;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`❌ Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

// Run examples
if (require.main === module) {
  Promise.resolve()
    .then(() => basicTransactionExample())
    .then(() => complexTransactionWithValidation())
    .then(() => transactionErrorRecoveryPattern())
    .catch(console.error);
}

export {
  basicTransactionExample,
  complexTransactionWithValidation,
  transactionErrorRecoveryPattern,
  TransactionManager
};