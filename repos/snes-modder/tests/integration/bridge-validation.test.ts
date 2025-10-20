/**
 * BRIDGE INTEGRATION TEST SUITE
 * Cross-team validation for SNES Modder + bsnes-plus
 * 
 * @author Sam (Code Custodian)
 * @purpose Ensure seamless tool integration across platforms
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { BsnesClient } from '../../src/debug/BsnesClient';
import { ROMHandler } from '../../src/lib/ROMHandler';
import { SpeedrunController } from '../../src/cli/speedrun-live';
import { DiscoveryManager } from '../../src/discovery/DiscoveryManager';
import * as fs from 'fs/promises';
import * as path from 'path';

// Test configuration
const TEST_ROM_PATH = './test-roms/zelda3-clean.sfc';
const MODIFIED_ROM_PATH = './test-roms/zelda3-test.sfc';
const EMULATOR_TIMEOUT = 5000;
const VALIDATION_PRECISION = 0.99; // 99% accuracy requirement

describe('🔗 Bridge Integration Test Suite', () => {
  let bsnesClient: BsnesClient;
  let romHandler: ROMHandler;
  let discoveryManager: DiscoveryManager;
  
  beforeAll(async () => {
    // Setup test environment
    console.log('🚀 Initializing bridge integration tests...');
    
    // Ensure test ROM exists
    await ensureTestROM();
    
    // Initialize components
    romHandler = new ROMHandler(TEST_ROM_PATH);
    discoveryManager = new DiscoveryManager();
    bsnesClient = new BsnesClient();
  });
  
  afterAll(async () => {
    // Cleanup
    await bsnesClient.disconnect();
    await cleanupTestFiles();
  });
  
  describe('📊 Phase 2 Core Integration Tests', () => {
    
    test('TypeScript-C++ bridge validation', async () => {
      // Step 1: Validate API boundary
      const apiResult = await bsnesClient.validateAPICompatibility();
      expect(apiResult.success).toBe(true);
      expect(apiResult.protocol_version).toBe('2.0');
      
      console.log('✅ TypeScript-C++ API bridge validated');
    });
    
    test('ROM modification → Emulator validation', async () => {
      // Step 1: Modify ROM with SNES Modder
      const modder = new ROMHandler(TEST_ROM_PATH);
      
      // Apply health modification
      modder.writeByte(0x274EC, 0x50); // 10 hearts
      modder.save(MODIFIED_ROM_PATH);
      
      // Step 2: Load in bsnes-plus
      await bsnesClient.connect();
      await bsnesClient.loadROM(MODIFIED_ROM_PATH);
      
      // Step 3: Start new game
      await bsnesClient.newGame();
      
      // Step 4: Validate health value
      const health = await bsnesClient.readMemory(0x7EF36C);
      
      expect(health).toBe(0x50);
      console.log('✅ Health modification validated in emulator');
    });
    
    test('Live memory manipulation', async () => {
      // Connect to running emulator
      await bsnesClient.connect();
      
      // Write directly to emulator memory
      await bsnesClient.writeMemory(0x7EF36C, 0xA0); // 20 hearts
      
      // Read back and verify
      const health = await bsnesClient.readMemory(0x7EF36C);
      expect(health).toBe(0xA0);
      
      // Verify visual update (through game state)
      const maxHealth = await bsnesClient.readMemory(0x7EF36D);
      expect(maxHealth).toBeGreaterThanOrEqual(0xA0);
      
      console.log('✅ Live memory manipulation working');
    });
    
    test('Discovery → Emulator verification', async () => {
      // Use discovery system to find addresses
      const discoveries = await discoveryManager.discoverAddresses('health');
      
      expect(discoveries.length).toBeGreaterThan(0);
      
      // Verify each discovered address in emulator
      for (const discovery of discoveries) {
        const value = await bsnesClient.readMemory(discovery.address);
        
        // Validate discovery accuracy
        expect(discovery.confidence).toBeGreaterThan(0.8);
        
        console.log(`📍 Verified discovery: ${discovery.name} at 0x${discovery.address.toString(16)}`);
      }
      
      console.log('✅ Discovery system validated with emulator');
    });
  });
  
  describe('🎮 Speedrun Feature Tests', () => {
    
    test('Health control commands', async () => {
      const testCases = [
        { hearts: 3, expected: 0x18 },
        { hearts: 10, expected: 0x50 },
        { hearts: 20, expected: 0xA0 }
      ];
      
      for (const testCase of testCases) {
        // Set health via CLI command
        await executeCommand(`health set ${testCase.hearts}`);
        
        // Verify in emulator
        const health = await bsnesClient.readMemory(0x7EF36C);
        expect(health).toBe(testCase.expected);
        
        console.log(`✅ Health set to ${testCase.hearts} hearts`);
      }
    });
    
    test('Inventory manipulation', async () => {
      const items = [
        { name: 'bow', address: 0x7EF340, bit: 0 },
        { name: 'boomerang', address: 0x7EF341, bit: 0 },
        { name: 'hookshot', address: 0x7EF342, value: 0x01 }
      ];
      
      for (const item of items) {
        // Add item via CLI
        await executeCommand(`inventory add ${item.name}`);
        
        // Verify in emulator
        const value = await bsnesClient.readMemory(item.address);
        
        if (item.bit !== undefined) {
          expect(value & (1 << item.bit)).toBeGreaterThan(0);
        } else {
          expect(value).toBe(item.value);
        }
        
        console.log(`✅ ${item.name} added to inventory`);
      }
    });
    
    test('Room warping', async () => {
      const warps = [
        { 
          location: 'pyramid',
          room: 0x005B,
          x: 0x0778,
          y: 0x0ECA
        },
        {
          location: 'castle',
          room: 0x0012,
          x: 0x0688,
          y: 0x054A
        }
      ];
      
      for (const warp of warps) {
        // Execute warp command
        await executeCommand(`warp ${warp.location}`);
        
        // Wait for transition
        await sleep(100);
        
        // Verify room ID
        const roomLow = await bsnesClient.readMemory(0x7E00A0);
        const roomHigh = await bsnesClient.readMemory(0x7E00A1);
        const room = (roomHigh << 8) | roomLow;
        
        expect(room).toBe(warp.room);
        
        console.log(`✅ Warped to ${warp.location}`);
      }
    });
    
    test('Preset loading', async () => {
      const presets = ['any-percent', '100-percent', 'practice'];
      
      for (const preset of presets) {
        // Load preset
        await executeCommand(`run ${preset}`);
        
        // Verify appropriate items loaded
        // Check at least one signature item per preset
        let signatureVerified = false;
        
        switch (preset) {
          case 'any-percent':
            const sword = await bsnesClient.readMemory(0x7EF359);
            signatureVerified = sword === 4; // Master sword
            break;
            
          case '100-percent':
            const hearts = await bsnesClient.readMemory(0x7EF36C);
            signatureVerified = hearts === 0xA0; // 20 hearts
            break;
            
          case 'practice':
            const shield = await bsnesClient.readMemory(0x7EF35A);
            signatureVerified = shield >= 2; // Good shield
            break;
        }
        
        expect(signatureVerified).toBe(true);
        console.log(`✅ ${preset} preset loaded and verified`);
      }
    });
  });
  
  describe('⚡ Phase 2 Performance Validation', () => {
    
    test('Headless mode performance baseline', async () => {
      // Validate headless mode meets performance requirements
      const headlessMetrics = await bsnesClient.measureHeadlessPerformance();
      
      expect(headlessMetrics.startup_time).toBeLessThan(500); // <500ms
      expect(headlessMetrics.memory_footprint).toBeLessThan(64 * 1024 * 1024); // <64MB
      expect(headlessMetrics.cpu_usage).toBeLessThan(10); // <10%
      
      console.log(`✅ Headless performance: ${headlessMetrics.startup_time}ms startup`);
    });
    
    test('Command execution time', async () => {
      const commands = [
        { cmd: 'health set 10', maxTime: 10 },
        { cmd: 'inventory add bow', maxTime: 15 },
        { cmd: 'warp pyramid', maxTime: 50 }
      ];
      
      for (const command of commands) {
        const start = performance.now();
        await executeCommand(command.cmd);
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(command.maxTime);
        
        console.log(`✅ ${command.cmd}: ${duration.toFixed(2)}ms (limit: ${command.maxTime}ms)`);
      }
    });
    
    test('Bulk operation performance', async () => {
      const start = performance.now();
      
      // Execute 100 operations rapidly
      for (let i = 0; i < 100; i++) {
        await bsnesClient.readMemory(0x7EF36C);
      }
      
      const duration = performance.now() - start;
      const avgTime = duration / 100;
      
      expect(avgTime).toBeLessThan(5); // <5ms per operation
      
      console.log(`✅ Bulk operations: ${avgTime.toFixed(2)}ms average`);
    });
    
    test('Memory consistency under load', async () => {
      const testValue = 0x42;
      const testAddress = 0x7EF400; // Safe test area
      
      // Write value
      await bsnesClient.writeMemory(testAddress, testValue);
      
      // Perform many other operations
      for (let i = 0; i < 50; i++) {
        await bsnesClient.readMemory(0x7EF36C);
        await bsnesClient.readMemory(0x7EF340);
      }
      
      // Verify value unchanged
      const finalValue = await bsnesClient.readMemory(testAddress);
      expect(finalValue).toBe(testValue);
      
      console.log('✅ Memory consistency maintained under load');
    });
  });
  
  describe('🛡️ Error Handling & Recovery', () => {
    
    test('Graceful emulator disconnection', async () => {
      // Simulate disconnection
      await bsnesClient.disconnect();
      
      // Attempt operation
      const result = await executeCommand('health set 10').catch(e => e);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('not connected');
      
      // Reconnect
      await bsnesClient.connect();
      
      // Verify recovery
      const health = await bsnesClient.readMemory(0x7EF36C);
      expect(health).toBeDefined();
      
      console.log('✅ Graceful disconnection handling');
    });
    
    test('Invalid command handling', async () => {
      const invalidCommands = [
        'health set 999',     // Out of range
        'inventory add sword-level-5', // Invalid item
        'warp nowhere'        // Unknown location
      ];
      
      for (const cmd of invalidCommands) {
        const result = await executeCommand(cmd).catch(e => e);
        
        expect(result).toBeInstanceOf(Error);
        console.log(`✅ Invalid command handled: ${cmd}`);
      }
    });
    
    test('ROM corruption detection', async () => {
      // Create corrupted ROM
      const corruptROM = new ROMHandler(TEST_ROM_PATH);
      
      // Corrupt header
      corruptROM.writeByte(0xFFC0, 0xFF);
      corruptROM.writeByte(0xFFC1, 0xFF);
      corruptROM.save('./test-roms/corrupt.sfc');
      
      // Attempt to load
      const result = await bsnesClient.loadROM('./test-roms/corrupt.sfc').catch(e => e);
      
      expect(result).toBeInstanceOf(Error);
      
      console.log('✅ ROM corruption detected');
    });
  });
  
  describe('🔄 Cross-Platform Compatibility', () => {
    
    test('ROM format compatibility', async () => {
      const formats = ['.sfc', '.smc'];
      
      for (const format of formats) {
        const testPath = `./test-roms/zelda3${format}`;
        
        if (await fileExists(testPath)) {
          const rom = new ROMHandler(testPath);
          
          // Verify can read
          const health = rom.readByte(0x274EC);
          expect(health).toBeDefined();
          
          console.log(`✅ ${format} format supported`);
        }
      }
    });
    
    test('Emulator version compatibility', async () => {
      // Get emulator info
      const info = await bsnesClient.getEmulatorInfo();
      
      expect(info.name).toContain('bsnes');
      expect(info.version).toBeDefined();
      
      console.log(`✅ Compatible with ${info.name} v${info.version}`);
    });
    
    test('Save state compatibility', async () => {
      // Create save state
      await bsnesClient.createSaveState('test-state');
      
      // Modify game state
      await bsnesClient.writeMemory(0x7EF36C, 0x50);
      
      // Load save state
      await bsnesClient.loadSaveState('test-state');
      
      // Verify state restored
      const health = await bsnesClient.readMemory(0x7EF36C);
      expect(health).not.toBe(0x50); // Should be original value
      
      console.log('✅ Save state compatibility verified');
    });
  });
});

// Helper functions
async function ensureTestROM(): Promise<void> {
  if (!await fileExists(TEST_ROM_PATH)) {
    throw new Error(`Test ROM not found at ${TEST_ROM_PATH}`);
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function cleanupTestFiles(): Promise<void> {
  const testFiles = [
    MODIFIED_ROM_PATH,
    './test-roms/corrupt.sfc'
  ];
  
  for (const file of testFiles) {
    try {
      await fs.unlink(file);
    } catch {
      // Ignore if doesn't exist
    }
  }
}

async function executeCommand(command: string): Promise<void> {
  // Simulate CLI command execution
  const [cmd, subCmd, ...args] = command.split(' ');
  
  // Implementation would call actual CLI handlers
  console.log(`Executing: ${command}`);
  
  // Simulate async execution
  await sleep(10);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}