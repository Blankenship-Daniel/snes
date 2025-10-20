#!/usr/bin/env node
/**
 * Debug Intro Skip Search
 * 
 * Searches for the JSR $3DB4.w instruction and shows hex dumps
 * to help understand the ROM structure.
 */

const fs = require('fs');
const path = require('path');

function hexDump(buffer, offset, length = 64) {
  const lines = [];
  for (let i = 0; i < length; i += 16) {
    const addr = offset + i;
    const hexBytes = [];
    const asciiChars = [];
    
    for (let j = 0; j < 16 && (i + j) < length; j++) {
      const byteIndex = offset + i + j;
      if (byteIndex < buffer.length) {
        const byte = buffer[byteIndex];
        hexBytes.push(byte.toString(16).padStart(2, '0'));
        asciiChars.push(byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.');
      } else {
        hexBytes.push('  ');
        asciiChars.push(' ');
      }
    }
    
    lines.push(`${addr.toString(16).padStart(6, '0')}:  ${hexBytes.join(' ')}  |${asciiChars.join('')}|`);
  }
  return lines.join('\n');
}

function searchForPattern(buffer, pattern, maxResults = 10) {
  const results = [];
  for (let i = 0; i <= buffer.length - pattern.length; i++) {
    let match = true;
    for (let j = 0; j < pattern.length; j++) {
      if (buffer[i + j] !== pattern[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      results.push(i);
      if (results.length >= maxResults) break;
    }
  }
  return results;
}

function analyzeROM() {
  console.log('🔍 Debug: Searching for Intro Skip Target');
  console.log('==========================================\n');

  try {
    // Load ROM
    const romPath = path.join(process.cwd(), 'zelda3.smc');
    const romBuffer = fs.readFileSync(romPath);
    console.log(`📂 ROM loaded: ${romBuffer.length} bytes\n`);

    // Search for JSR $3DB4.w pattern (20 B4 3D)
    const jsrPattern = [0x20, 0xB4, 0x3D];
    console.log('🔍 Searching for JSR $3DB4.w (20 B4 3D)...');
    const jsrResults = searchForPattern(romBuffer, jsrPattern);
    
    if (jsrResults.length > 0) {
      console.log(`✅ Found ${jsrResults.length} instances of JSR $3DB4.w:`);
      jsrResults.forEach((addr, i) => {
        console.log(`   ${i + 1}. Address: 0x${addr.toString(16)}`);
        console.log(hexDump(romBuffer, addr - 16, 48));
        console.log('');
      });
    } else {
      console.log('❌ No JSR $3DB4.w instructions found');
    }

    // Check the expected address area
    const targetAddress = 0xCC156;
    console.log(`🔍 Checking expected address 0x${targetAddress.toString(16)}:`);
    if (targetAddress < romBuffer.length) {
      console.log(hexDump(romBuffer, targetAddress - 32, 96));
    } else {
      console.log('❌ Target address beyond ROM bounds');
    }

    // Search for any JSR instructions (opcode 0x20)
    console.log('\n🔍 Searching for all JSR instructions (opcode 20)...');
    const jsrOpcodeResults = [];
    for (let i = 0; i < romBuffer.length - 2; i++) {
      if (romBuffer[i] === 0x20) {
        jsrOpcodeResults.push(i);
        if (jsrOpcodeResults.length >= 20) break; // Limit to first 20
      }
    }

    console.log(`Found ${jsrOpcodeResults.length} JSR instructions (showing first 20):`);
    jsrOpcodeResults.forEach((addr, i) => {
      const operand = (romBuffer[addr + 2] << 8) | romBuffer[addr + 1];
      console.log(`   ${i + 1}. 0x${addr.toString(16)}: JSR $${operand.toString(16).padStart(4, '0')}`);
    });

    // Search for intro-related patterns
    console.log('\n🔍 Searching for potential intro patterns...');
    
    // Look for common intro signatures
    const patterns = [
      { name: 'Nintendo Logo Check', bytes: [0xA9, 0x00, 0x8D] }, // Common intro pattern
      { name: 'SNES Header Check', bytes: [0x21, 0x00, 0x2C] },   // Header validation
      { name: 'Mode7 Setup', bytes: [0xE2, 0x20, 0x64] },        // Mode 7 initialization
    ];

    patterns.forEach(pattern => {
      const results = searchForPattern(romBuffer, pattern.bytes, 3);
      if (results.length > 0) {
        console.log(`   ${pattern.name}: Found at addresses: ${results.map(addr => '0x' + addr.toString(16)).join(', ')}`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeROM();