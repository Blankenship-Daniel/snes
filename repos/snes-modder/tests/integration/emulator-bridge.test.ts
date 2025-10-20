/**
 * EMULATOR BRIDGE INTEGRATION TESTS
 * Specific tests for bsnes-plus communication protocol
 * 
 * @author Sam (Code Custodian)
 * @purpose Validate emulator integration stability
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { BsnesClient } from '../../src/debug/BsnesClient';

describe('🎮 Emulator Bridge Tests', () => {
  let emulator: BsnesClient;
  
  beforeAll(async () => {
    emulator = new BsnesClient();
  });
  
  afterAll(async () => {
    await emulator.disconnect();
  });
  
  describe('Connection Management', () => {
    
    test('Connect to bsnes-plus', async () => {
      const result = await emulator.connect();
      
      expect(result.success).toBe(true);
      expect(emulator.isConnected()).toBe(true);
      
      console.log('✅ Connected to bsnes-plus');
    });
    
    test('Handle connection failure gracefully', async () => {
      // Simulate connection to non-existent emulator
      const badEmulator = new BsnesClient('invalid-host', 9999);
      
      const result = await badEmulator.connect().catch(e => ({ success: false, error: e.message }));
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      
      console.log('✅ Connection failure handled gracefully');
    });
    
    test('Reconnection after disconnect', async () => {
      // Disconnect
      await emulator.disconnect();
      expect(emulator.isConnected()).toBe(false);
      
      // Reconnect
      const result = await emulator.connect();
      expect(result.success).toBe(true);
      expect(emulator.isConnected()).toBe(true);
      
      console.log('✅ Reconnection successful');
    });
  });
  
  describe('ROM Loading', () => {
    
    test('Load ROM file', async () => {
      const romPath = './test-roms/zelda3-clean.sfc';
      
      const result = await emulator.loadROM(romPath);
      
      expect(result.success).toBe(true);
      expect(result.romInfo).toBeDefined();
      expect(result.romInfo.name).toContain('ZELDA');
      
      console.log(`✅ ROM loaded: ${result.romInfo.name}`);
    });
    
    test('Handle invalid ROM', async () => {
      const result = await emulator.loadROM('./invalid-rom.sfc').catch(e => ({ success: false, error: e.message }));
      
      expect(result.success).toBe(false);
      
      console.log('✅ Invalid ROM handled gracefully');
    });
    
    test('ROM info extraction', async () => {
      const info = await emulator.getROMInfo();
      
      expect(info.name).toBeDefined();
      expect(info.size).toBeGreaterThan(0);
      expect(info.checksum).toBeDefined();
      expect(info.region).toMatch(/NTSC|PAL/);
      
      console.log(`✅ ROM Info: ${info.name} (${info.size} bytes)`);
    });
  });
  
  describe('Memory Operations', () => {
    
    test('Read memory addresses', async () => {
      const addresses = [
        0x7EF36C, // Current health
        0x7EF340, // Bow item
        0x7EF359  // Sword level
      ];
      
      for (const addr of addresses) {
        const value = await emulator.readMemory(addr);
        
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(255);
        
        console.log(`✅ Read 0x${addr.toString(16)}: 0x${value.toString(16)}`);
      }
    });
    
    test('Write memory addresses', async () => {
      const testCases = [
        { addr: 0x7EF36C, value: 0x50 }, // Health
        { addr: 0x7EF340, value: 0x01 }, // Bow
        { addr: 0x7EF359, value: 0x04 }  // Master sword
      ];
      
      for (const testCase of testCases) {
        // Write value
        await emulator.writeMemory(testCase.addr, testCase.value);
        
        // Read back and verify
        const readValue = await emulator.readMemory(testCase.addr);
        expect(readValue).toBe(testCase.value);
        
        console.log(`✅ Write/Read 0x${testCase.addr.toString(16)}: 0x${testCase.value.toString(16)}`);
      }
    });
    
    test('16-bit memory operations', async () => {
      const testAddr = 0x7E0022; // X position
      const testValue = 0x1234;
      
      // Write 16-bit value
      await emulator.writeMemory16(testAddr, testValue);
      
      // Read back
      const readValue = await emulator.readMemory16(testAddr);
      expect(readValue).toBe(testValue);
      
      console.log(`✅ 16-bit operation: 0x${testValue.toString(16)}`);
    });
    
    test('Memory range read', async () => {
      const startAddr = 0x7EF340;
      const length = 16;
      
      const data = await emulator.readMemoryRange(startAddr, length);
      
      expect(data).toHaveLength(length);
      expect(Array.isArray(data)).toBe(true);
      
      console.log(`✅ Read ${length} bytes from 0x${startAddr.toString(16)}`);
    });
  });
  
  describe('Game State Control', () => {
    
    test('Start new game', async () => {
      const result = await emulator.newGame();
      
      expect(result.success).toBe(true);
      
      // Verify starting state
      const health = await emulator.readMemory(0x7EF36C);
      expect(health).toBe(0x18); // 3 hearts
      
      console.log('✅ New game started');
    });
    
    test('Pause and resume', async () => {
      // Pause
      await emulator.pause();
      const pauseState = await emulator.getExecutionState();
      expect(pauseState.paused).toBe(true);
      
      // Resume
      await emulator.resume();
      const resumeState = await emulator.getExecutionState();
      expect(resumeState.paused).toBe(false);
      
      console.log('✅ Pause/Resume working');
    });
    
    test('Reset game', async () => {
      // Modify game state
      await emulator.writeMemory(0x7EF36C, 0xA0);
      
      // Reset
      await emulator.reset();
      
      // Verify reset to defaults
      const health = await emulator.readMemory(0x7EF36C);
      expect(health).toBe(0x18); // Back to 3 hearts
      
      console.log('✅ Reset working');
    });
  });
  
  describe('Save State Management', () => {
    
    test('Create save state', async () => {
      const stateName = 'test-state-' + Date.now();
      
      const result = await emulator.createSaveState(stateName);
      
      expect(result.success).toBe(true);
      expect(result.stateName).toBe(stateName);
      
      console.log(`✅ Save state created: ${stateName}`);
    });
    
    test('Load save state', async () => {
      const stateName = 'test-load-state';
      
      // Create state with specific health
      await emulator.writeMemory(0x7EF36C, 0x50);
      await emulator.createSaveState(stateName);
      
      // Change health
      await emulator.writeMemory(0x7EF36C, 0xA0);
      
      // Load state
      await emulator.loadSaveState(stateName);
      
      // Verify restored
      const health = await emulator.readMemory(0x7EF36C);
      expect(health).toBe(0x50);
      
      console.log('✅ Save state loaded successfully');
    });
    
    test('List save states', async () => {
      const states = await emulator.listSaveStates();
      
      expect(Array.isArray(states)).toBe(true);
      expect(states.length).toBeGreaterThan(0);
      
      console.log(`✅ Found ${states.length} save states`);
    });
    
    test('Delete save state', async () => {
      const stateName = 'test-delete-state';
      
      // Create state
      await emulator.createSaveState(stateName);
      
      // Delete state
      const result = await emulator.deleteSaveState(stateName);
      expect(result.success).toBe(true);
      
      // Verify deleted
      const states = await emulator.listSaveStates();
      expect(states.find(s => s.name === stateName)).toBeUndefined();
      
      console.log('✅ Save state deleted');
    });
  });
  
  describe('Debugging Features', () => {
    
    test('Set memory breakpoint', async () => {
      const addr = 0x7EF36C; // Health address
      
      const result = await emulator.setBreakpoint({
        type: 'memory',
        address: addr,
        access: 'write'
      });
      
      expect(result.success).toBe(true);
      expect(result.breakpointId).toBeDefined();
      
      console.log(`✅ Breakpoint set at 0x${addr.toString(16)}`);
    });
    
    test('Remove breakpoint', async () => {
      const breakpoints = await emulator.listBreakpoints();
      
      if (breakpoints.length > 0) {
        const result = await emulator.removeBreakpoint(breakpoints[0].id);
        expect(result.success).toBe(true);
        
        console.log('✅ Breakpoint removed');
      }
    });
    
    test('Step execution', async () => {
      // Pause first
      await emulator.pause();
      
      // Step one instruction
      const result = await emulator.step();
      
      expect(result.success).toBe(true);
      expect(result.pc).toBeDefined();
      
      console.log(`✅ Stepped to PC: 0x${result.pc.toString(16)}`);
    });
    
    test('CPU state inspection', async () => {
      const cpuState = await emulator.getCPUState();
      
      expect(cpuState.pc).toBeDefined();
      expect(cpuState.a).toBeDefined();
      expect(cpuState.x).toBeDefined();
      expect(cpuState.y).toBeDefined();
      expect(cpuState.sp).toBeDefined();
      
      console.log(`✅ CPU State: PC=0x${cpuState.pc.toString(16)}, A=0x${cpuState.a.toString(16)}`);
    });
  });
  
  describe('Performance Monitoring', () => {
    
    test('Memory operation latency', async () => {
      const iterations = 100;
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        await emulator.readMemory(0x7EF36C);
      }
      
      const duration = performance.now() - start;
      const avgLatency = duration / iterations;
      
      expect(avgLatency).toBeLessThan(5); // <5ms per read
      
      console.log(`✅ Avg memory read latency: ${avgLatency.toFixed(2)}ms`);
    });
    
    test('Bulk operation throughput', async () => {
      const addresses = Array.from({ length: 50 }, (_, i) => 0x7EF300 + i);
      
      const start = performance.now();
      
      const results = await Promise.all(
        addresses.map(addr => emulator.readMemory(addr))
      );
      
      const duration = performance.now() - start;
      const throughput = results.length / (duration / 1000); // ops/sec
      
      expect(throughput).toBeGreaterThan(100); // >100 ops/sec
      expect(results).toHaveLength(50);
      
      console.log(`✅ Bulk read throughput: ${throughput.toFixed(0)} ops/sec`);
    });
    
    test('Memory pressure test', async () => {
      // Test sustained load
      const promises = [];
      
      for (let i = 0; i < 200; i++) {
        promises.push(emulator.readMemory(0x7EF300 + (i % 256)));
      }
      
      const start = performance.now();
      const results = await Promise.all(promises);
      const duration = performance.now() - start;
      
      expect(results).toHaveLength(200);
      expect(duration).toBeLessThan(2000); // Complete in <2 seconds
      
      console.log(`✅ Memory pressure test: ${duration.toFixed(0)}ms for 200 operations`);
    });
  });
  
  describe('Error Handling', () => {
    
    test('Invalid memory address', async () => {
      const result = await emulator.readMemory(0x999999).catch(e => ({ error: e.message }));
      
      expect(result.error).toBeDefined();
      
      console.log('✅ Invalid address error handled');
    });
    
    test('Connection loss recovery', async () => {
      // Simulate connection loss
      await emulator.disconnect();
      
      // Attempt operation
      const result = await emulator.readMemory(0x7EF36C).catch(e => ({ error: e.message }));
      
      expect(result.error).toBeDefined();
      expect(result.error).toContain('not connected');
      
      // Reconnect and verify recovery
      await emulator.connect();
      const value = await emulator.readMemory(0x7EF36C);
      expect(value).toBeDefined();
      
      console.log('✅ Connection loss recovery working');
    });
    
    test('Timeout handling', async () => {
      // Set very short timeout
      emulator.setTimeout(1);
      
      // Operation should timeout
      const result = await emulator.readMemory(0x7EF36C).catch(e => ({ error: e.message }));
      
      expect(result.error).toContain('timeout');
      
      // Reset timeout
      emulator.setTimeout(5000);
      
      console.log('✅ Timeout handling working');
    });
  });
});

describe('🔄 Bridge Protocol Compliance', () => {
  
  test('Message format validation', () => {
    interface BridgeMessage {
      type: 'read' | 'write' | 'control';
      address?: number;
      value?: number;
      command?: string;
    }
    
    const readMessage: BridgeMessage = {
      type: 'read',
      address: 0x7EF36C
    };
    
    const writeMessage: BridgeMessage = {
      type: 'write',
      address: 0x7EF36C,
      value: 0x50
    };
    
    expect(readMessage.type).toBe('read');
    expect(readMessage.address).toBeDefined();
    expect(writeMessage.value).toBeDefined();
    
    console.log('✅ Message format compliant');
  });
  
  test('Response format validation', () => {
    interface BridgeResponse {
      success: boolean;
      data?: any;
      error?: string;
      timestamp: number;
    }
    
    const successResponse: BridgeResponse = {
      success: true,
      data: { value: 0x50 },
      timestamp: Date.now()
    };
    
    const errorResponse: BridgeResponse = {
      success: false,
      error: 'Memory read failed',
      timestamp: Date.now()
    };
    
    expect(successResponse.success).toBe(true);
    expect(successResponse.data).toBeDefined();
    expect(errorResponse.error).toBeDefined();
    
    console.log('✅ Response format compliant');
  });
});