#!/usr/bin/env npx tsx

/**
 * Zelda 3 Instant Mods CLI
 *
 * Quick presets for pre-populating a save start state in the base ROM.
 * Addresses are resolved through the unified address translator to avoid
 * writing WRAM offsets directly into the file.
 */

import fs from 'fs';
import path from 'path';
import { AddressTranslator } from '../lib/UnifiedAddressSystem';
import { deriveRomOutputPath } from '../lib/outputPaths';

const SNES_WRAM_BANK = 0x7E_0000;

const ZELDA3_SNES_ADDRESSES = {
  HEALTH_CAPACITY: SNES_WRAM_BANK + 0xF36C,
  HEALTH_CURRENT: SNES_WRAM_BANK + 0xF36D,
  RUPEES_LOW: SNES_WRAM_BANK + 0xF360,
  RUPEES_HIGH: SNES_WRAM_BANK + 0xF361,
  MAGIC_POWER: SNES_WRAM_BANK + 0xF36E,
  MAGIC_CONSUMPTION: SNES_WRAM_BANK + 0xF37B,
  BOW: SNES_WRAM_BANK + 0xF340,
  BOOMERANG: SNES_WRAM_BANK + 0xF341,
  HOOKSHOT: SNES_WRAM_BANK + 0xF342,
  BOMBS: SNES_WRAM_BANK + 0xF343,
  FIRE_ROD: SNES_WRAM_BANK + 0xF345,
  ICE_ROD: SNES_WRAM_BANK + 0xF346,
  BOMBOS_MEDALLION: SNES_WRAM_BANK + 0xF347,
  ETHER_MEDALLION: SNES_WRAM_BANK + 0xF348,
  QUAKE_MEDALLION: SNES_WRAM_BANK + 0xF349,
  HAMMER: SNES_WRAM_BANK + 0xF34B,
  FLUTE: SNES_WRAM_BANK + 0xF34C,
  GLOVES: SNES_WRAM_BANK + 0xF354,
  BOOTS: SNES_WRAM_BANK + 0xF355,
  MOON_PEARL: SNES_WRAM_BANK + 0xF357,
  SWORD: SNES_WRAM_BANK + 0xF359,
  SHIELD: SNES_WRAM_BANK + 0xF35A,
  ARMOR: SNES_WRAM_BANK + 0xF35B,
} as const;

type BytePatchMap = Record<number, number>;

interface InstantPreset {
  readonly name: string;
  readonly description: string;
  readonly patches: BytePatchMap;
}

const INSTANT_PRESETS: Record<string, InstantPreset> = {
  'max-health': {
    name: 'Max Health',
    description: 'Start with 20 hearts (160 HP)',
    patches: {
      [ZELDA3_SNES_ADDRESSES.HEALTH_CAPACITY]: 160,
      [ZELDA3_SNES_ADDRESSES.HEALTH_CURRENT]: 160,
    },
  },
  rich: {
    name: 'Rich Start',
    description: 'Start with 999 rupees',
    patches: {
      [ZELDA3_SNES_ADDRESSES.RUPEES_LOW]: 0xE7,
      [ZELDA3_SNES_ADDRESSES.RUPEES_HIGH]: 0x03,
    },
  },
  'infinite-magic': {
    name: 'Infinite Magic',
    description: 'Never run out of magic power - perfect for speedrunners!',
    patches: {
      [ZELDA3_SNES_ADDRESSES.MAGIC_POWER]: 0x80,
      [ZELDA3_SNES_ADDRESSES.MAGIC_CONSUMPTION]: 0x00,
      [ZELDA3_SNES_ADDRESSES.FIRE_ROD]: 1,
      [ZELDA3_SNES_ADDRESSES.ICE_ROD]: 1,
      [ZELDA3_SNES_ADDRESSES.BOMBOS_MEDALLION]: 1,
      [ZELDA3_SNES_ADDRESSES.ETHER_MEDALLION]: 1,
      [ZELDA3_SNES_ADDRESSES.QUAKE_MEDALLION]: 1,
    },
  },
  explorer: {
    name: "Explorer's Pack",
    description: 'Max health + all essential items for exploration',
    patches: {
      [ZELDA3_SNES_ADDRESSES.HEALTH_CAPACITY]: 160,
      [ZELDA3_SNES_ADDRESSES.HEALTH_CURRENT]: 160,
      [ZELDA3_SNES_ADDRESSES.BOW]: 2,
      [ZELDA3_SNES_ADDRESSES.HOOKSHOT]: 1,
      [ZELDA3_SNES_ADDRESSES.HAMMER]: 1,
      [ZELDA3_SNES_ADDRESSES.GLOVES]: 2,
      [ZELDA3_SNES_ADDRESSES.MOON_PEARL]: 1,
      [ZELDA3_SNES_ADDRESSES.BOOTS]: 1,
      [ZELDA3_SNES_ADDRESSES.FLUTE]: 1,
      [ZELDA3_SNES_ADDRESSES.FIRE_ROD]: 1,
      [ZELDA3_SNES_ADDRESSES.ICE_ROD]: 1,
      [ZELDA3_SNES_ADDRESSES.BOOMERANG]: 2,
      [ZELDA3_SNES_ADDRESSES.BOMBS]: 1,
      [ZELDA3_SNES_ADDRESSES.SWORD]: 2,
      [ZELDA3_SNES_ADDRESSES.SHIELD]: 2,
      [ZELDA3_SNES_ADDRESSES.ARMOR]: 1,
      [ZELDA3_SNES_ADDRESSES.RUPEES_LOW]: 0xF4,
      [ZELDA3_SNES_ADDRESSES.RUPEES_HIGH]: 0x01,
    },
  },
  overpowered: {
    name: 'Overpowered',
    description: 'Max everything + money for testing/fun',
    patches: {
      [ZELDA3_SNES_ADDRESSES.HEALTH_CAPACITY]: 160,
      [ZELDA3_SNES_ADDRESSES.HEALTH_CURRENT]: 160,
      [ZELDA3_SNES_ADDRESSES.RUPEES_LOW]: 0xE7,
      [ZELDA3_SNES_ADDRESSES.RUPEES_HIGH]: 0x03,
      [ZELDA3_SNES_ADDRESSES.BOW]: 2,
      [ZELDA3_SNES_ADDRESSES.BOOMERANG]: 2,
      [ZELDA3_SNES_ADDRESSES.HOOKSHOT]: 1,
      [ZELDA3_SNES_ADDRESSES.BOMBS]: 1,
      [ZELDA3_SNES_ADDRESSES.FIRE_ROD]: 1,
      [ZELDA3_SNES_ADDRESSES.ICE_ROD]: 1,
      [ZELDA3_SNES_ADDRESSES.HAMMER]: 1,
      [ZELDA3_SNES_ADDRESSES.FLUTE]: 1,
      [ZELDA3_SNES_ADDRESSES.GLOVES]: 2,
      [ZELDA3_SNES_ADDRESSES.BOOTS]: 1,
      [ZELDA3_SNES_ADDRESSES.MOON_PEARL]: 1,
      [ZELDA3_SNES_ADDRESSES.SWORD]: 4,
      [ZELDA3_SNES_ADDRESSES.SHIELD]: 3,
      [ZELDA3_SNES_ADDRESSES.ARMOR]: 2,
    },
  },
};

function resolveRomOffset(snesAddress: number): number {
  return AddressTranslator.snesAddressToROMOffset(snesAddress);
}

class InstantModder {
  private readonly romPath: string;
  private readonly romBuffer: Buffer;

  constructor(romPath: string) {
    this.romPath = romPath;

    if (!fs.existsSync(romPath)) {
      throw new Error(`ROM file not found: ${romPath}`);
    }

    this.romBuffer = fs.readFileSync(romPath);
    this.validateZelda3ROM();
  }

  private validateZelda3ROM(): void {
    if (this.romBuffer.length < 1024 * 1024) {
      throw new Error('ROM file seems too small for Zelda 3');
    }

    console.log(`✓ ROM loaded: ${(this.romBuffer.length / 1024 / 1024).toFixed(1)}MB`);
  }

  applyPreset(presetName: string): string {
    const preset = INSTANT_PRESETS[presetName];
    if (!preset) {
      const available = Object.keys(INSTANT_PRESETS).join(', ');
      throw new Error(`Unknown preset: ${presetName}. Available: ${available}`);
    }

    console.log(`🚀 Applying ${preset.name}: ${preset.description}`);
    this.createBackup();

    const modBuffer = Buffer.from(this.romBuffer);
    let patchCount = 0;

    for (const [snesAddressStr, byteValue] of Object.entries(preset.patches)) {
      const snesAddress = Number(snesAddressStr);
      const romOffset = resolveRomOffset(snesAddress);

      if (romOffset < 0 || romOffset >= modBuffer.length) {
        throw new Error(`Calculated ROM offset out of bounds for SNES address 0x${snesAddress.toString(16)}`);
      }

      modBuffer[romOffset] = byteValue;
      patchCount += 1;
      console.log(
        `  📝 SNES 0x${snesAddress.toString(16)} → ROM 0x${romOffset.toString(16)} set to ${byteValue}`
      );
    }

    const outputPath = deriveRomOutputPath(this.romPath, `-${presetName}`);
    fs.writeFileSync(outputPath, modBuffer);

    console.log(`✅ Applied ${patchCount} patches to ${outputPath}`);
    console.log('🎮 Ready to play! Load in any SNES emulator.');

    return outputPath;
  }

  private createBackup(): void {
    const backupDir = '.rom-backups';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const backupPath = path.join(backupDir, path.basename(this.romPath));
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(this.romPath, backupPath);
      console.log(`💾 Backup created: ${backupPath}`);
    }
  }
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.log(`
🎮 ZELDA 3 INSTANT MODS - Ship It Edition!

Usage: npx tsx zelda3-instant-mods.ts <rom-file> <preset>

Available Presets:
  max-health     - Start with 20 hearts (160 HP)
  rich           - Start with 999 rupees
  infinite-magic - Never run out of magic (NEW!)
  explorer       - Max health + all exploration items (RECOMMENDED!)
  overpowered    - Max everything + money for testing

Example:
  npx tsx zelda3-instant-mods.ts zelda3.smc explorer

⚡ Patches your ROM in under 5 seconds!
    `);
    process.exit(1);
  }

  const [romFile, preset] = args;

  try {
    const modder = new InstantModder(romFile);
    const outputPath = modder.applyPreset(preset);

    console.log(`
🎉 SUCCESS! Your modified ROM is ready:
   ${outputPath}

🎮 Next steps:
   1. Load ${path.basename(outputPath)} in your SNES emulator
   2. Start a new game to see your modifications
   3. Enjoy!
    `);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error: ${message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { InstantModder, INSTANT_PRESETS, ZELDA3_SNES_ADDRESSES };
