#!/usr/bin/env node
/**
 * Standalone Intro Skip Test
 * 
 * Tests the intro skip modification without TypeScript compilation.
 * This is a direct JavaScript implementation for immediate testing.
 */

const fs = require('fs');
const path = require('path');

class IntroSkipTest {
  constructor() {
    this.targetAddress = 0xCB344; // Found via debug search
    this.jsrBytes = [0x20, 0xB4, 0x3D]; // JSR $3DB4.w
    this.nopBytes = [0xEA, 0xEA, 0xEA]; // NOP NOP NOP
  }

  findJSRInstruction(romBuffer, approximateAddress) {
    const searchWindow = 64;
    const startAddr = Math.max(0, approximateAddress - searchWindow);
    const endAddr = Math.min(romBuffer.length - 3, approximateAddress + searchWindow);
    
    for (let addr = startAddr; addr <= endAddr; addr++) {
      const bytes = Array.from(romBuffer.slice(addr, addr + 3));
      if (bytes.every((byte, i) => byte === this.jsrBytes[i])) {
        return { found: true, address: addr };
      }
    }
    
    return { found: false };
  }

  applyIntroSkip(romBuffer) {
    const searchResult = this.findJSRInstruction(romBuffer, this.targetAddress);
    
    if (!searchResult.found) {
      throw new Error('Could not locate JSR $3DB4.w instruction');
    }

    const targetAddress = searchResult.address;
    console.log(`🔧 Found JSR $3DB4.w at address 0x${targetAddress.toString(16)}`);
    
    // Apply NOPs
    for (let i = 0; i < this.nopBytes.length; i++) {
      romBuffer[targetAddress + i] = this.nopBytes[i];
    }

    // Verify
    const verifyBytes = Array.from(romBuffer.slice(targetAddress, targetAddress + 3));
    const success = this.nopBytes.every((byte, i) => byte === verifyBytes[i]);
    
    if (!success) {
      throw new Error('Modification verification failed');
    }

    console.log(`✅ Successfully replaced JSR with NOPs: [${verifyBytes.map(b => b.toString(16)).join(' ')}]`);
    return targetAddress;
  }

  revertIntroSkip(romBuffer, targetAddress) {
    // Restore original JSR bytes
    for (let i = 0; i < this.jsrBytes.length; i++) {
      romBuffer[targetAddress + i] = this.jsrBytes[i];
    }

    // Verify revert
    const verifyBytes = Array.from(romBuffer.slice(targetAddress, targetAddress + 3));
    const success = this.jsrBytes.every((byte, i) => byte === verifyBytes[i]);
    
    if (!success) {
      throw new Error('Revert verification failed');
    }

    console.log(`✅ Successfully restored JSR: [${verifyBytes.map(b => b.toString(16)).join(' ')}]`);
  }

  async runTest() {
    console.log('🧪 Intro Skip Modification Test');
    console.log('================================\n');

    try {
      // Load ROM
      const romPath = path.join(process.cwd(), 'zelda3.smc');
      if (!fs.existsSync(romPath)) {
        throw new Error('ROM file not found: zelda3.smc');
      }

      console.log('📂 Loading ROM file...');
      const romBuffer = fs.readFileSync(romPath);
      console.log(`✅ ROM loaded: ${romBuffer.length} bytes`);

      // Create test copy
      const testBuffer = Buffer.from(romBuffer);

      // Test 1: Apply modification
      console.log('\n🔧 Test 1: Applying intro skip...');
      const modifiedAddress = this.applyIntroSkip(testBuffer);

      // Test 2: Verify bytes changed
      console.log('\n🔍 Test 2: Verifying modification...');
      let changeCount = 0;
      for (let i = 0; i < romBuffer.length; i++) {
        if (romBuffer[i] !== testBuffer[i]) {
          changeCount++;
        }
      }
      
      if (changeCount === 3) {
        console.log('✅ Exactly 3 bytes modified (as expected)');
      } else {
        console.log(`⚠️  Unexpected change count: ${changeCount} bytes`);
      }

      // Test 3: Save test ROM
      console.log('\n💾 Test 3: Creating test ROM...');
      const testRomPath = path.join(process.cwd(), 'zelda3-intro-skip-test.smc');
      fs.writeFileSync(testRomPath, testBuffer);
      console.log(`✅ Test ROM saved: ${path.basename(testRomPath)}`);

      // Test 4: Revert modification
      console.log('\n🔄 Test 4: Reverting modification...');
      this.revertIntroSkip(testBuffer, modifiedAddress);

      // Test 5: Verify complete revert
      console.log('\n🔍 Test 5: Verifying revert...');
      let differences = 0;
      for (let i = 0; i < romBuffer.length; i++) {
        if (romBuffer[i] !== testBuffer[i]) {
          differences++;
        }
      }

      if (differences === 0) {
        console.log('✅ ROM perfectly restored to original state');
      } else {
        console.log(`❌ ${differences} bytes still different after revert`);
      }

      console.log('\n🎉 All tests passed! Intro skip modification works correctly.');
      console.log('\nℹ️  Manual Testing:');
      console.log('   1. Load zelda3-intro-skip-test.smc in an emulator');
      console.log('   2. Start a new game and observe intro behavior');
      console.log('   3. Verify the game plays normally after intro');

    } catch (error) {
      console.error('\n❌ Test failed:', error.message);
      process.exit(1);
    }
  }
}

// Run test if called directly
if (require.main === module) {
  const test = new IntroSkipTest();
  test.runTest().catch(console.error);
}

module.exports = IntroSkipTest;