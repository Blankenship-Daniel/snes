/**
 * SNES Modder - Main Entry Point
 * Modern TypeScript toolkit for SNES ROM modification
 */

export { ROMHandler, ROMValidationError, ROMModificationError } from './lib/ROMHandler';
export { MasterSwordMod } from './mods/MasterSwordMod';
export * from './types/snes.types';

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const [,, command, ...args] = process.argv;
  
  switch(command) {
    case 'master-sword':
      import('./mods/MasterSwordMod').then(({ MasterSwordMod }) => {
        MasterSwordMod.fromCLI(args[0], args[1]);
      });
      break;
    default:
      // SNES Modder - TypeScript Edition usage information
      // Available commands: master-sword mod, development server, build, test
  }
}