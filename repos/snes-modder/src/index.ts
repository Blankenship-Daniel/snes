/**
 * SNES Modder - Main Entry Point
 * Modern TypeScript toolkit for SNES ROM modification
 */

export { ROMHandler, ROMValidationError, ROMModificationError } from './lib/ROMHandler';
export * from './types/snes.types';

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , command] = process.argv;

  switch (command) {
    default:
      // SNES Modder - TypeScript Edition usage information
      // Available commands: development server, build, test
  }
}
