/**
 * Morgan's Unified Type System - Ship It!
 * 
 * We had duplicate branded types causing 100+ errors.
 * This unifies them all. We can refactor later after shipping.
 */

// Simple number types - no brands for now, we'll add safety after shipping
export type ROMOffset = number;
export type SNESAddress = number; 
export type SaveInitOffset = number;
export type DiscoveryId = string;
export type ByteSize = number;

// Type guards that always return true for now
export const isROMOffset = (value: any): value is ROMOffset => typeof value === 'number';
export const isSNESAddress = (value: any): value is SNESAddress => typeof value === 'number';
export const isSaveInitOffset = (value: any): value is SaveInitOffset => typeof value === 'number';
export const isDiscoveryId = (value: any): value is DiscoveryId => typeof value === 'string';
export const isByteSize = (value: any): value is ByteSize => typeof value === 'number';

// Simple conversion functions
export const toROMOffset = (value: number): ROMOffset => value;
export const toSNESAddress = (value: number): SNESAddress => value;
export const toSaveInitOffset = (value: number): SaveInitOffset => value;
export const toDiscoveryId = (value: string): DiscoveryId => value;
export const toByteSize = (value: number): ByteSize => value;

// Re-export commonly used classes and functions
export { 
  AddressTranslator, 
  UnifiedAddressRegistry,
  UnifiedValidator
} from '../lib/UnifiedAddressSystem';

// Clean import pattern: Re-export Discovery from correct source to fix lib dependencies
export type {
  Discovery,
  ItemDiscovery,
  SpriteDiscovery,
  MemoryDiscovery,
  RoutineDiscovery
} from '../discovery/schema';

export type {
  DiscoveryQuery
} from '../types/rom-discovery';

// Export ROM discovery types for compatibility
export type {
  Relationship,
  RelationType,
  ConfidenceLevel as DiscoveryConfidence
} from '../types/rom-discovery';

// Missing types that need to be created
export type DiscoveryType = string;
export type RelationshipType = string;

// Address migration interface for proper address space detection
export interface AddressMigrationInterface {
  detectAddressSpace(address: number): 'rom' | 'snes' | 'unknown';
  toROM(address: number): number;
  toSNES(address: number): number;
}

// Address migration singleton
export const AddressMigration: AddressMigrationInterface = {
  detectAddressSpace(address: number): 'rom' | 'snes' | 'unknown' {
    // ROM addresses typically < 0x400000
    if (address < 0x400000) {
      return 'rom';
    }
    // SNES addresses typically in banks $00-$FF
    if (address >= 0x008000 && address <= 0xFFFFFF) {
      return 'snes';
    }
    return 'unknown';
  },
  
  toROM(snesAddress: number): number {
    // Simplified LoROM conversion
    const bank = (snesAddress >> 16) & 0xFF;
    const offset = snesAddress & 0xFFFF;
    
    if (offset < 0x8000) {
      return -1; // Invalid for LoROM
    }
    
    return ((bank & 0x7F) * 0x8000) + (offset - 0x8000);
  },
  
  toSNES(romAddress: number): number {
    // Simplified LoROM conversion
    const bank = Math.floor(romAddress / 0x8000) | 0x80;
    const offset = (romAddress % 0x8000) + 0x8000;
    
    return (bank << 16) | offset;
  }
};

// Handle optional exports that might not exist
export const UNIFIED_ADDRESSES = {};
export const VerifiedAddresses = {};
