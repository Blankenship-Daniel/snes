/**
 * TypeScript definitions for bsnes-plus integration
 * Bridge ID: bridge-f8c006c6e7e6
 */

declare module '@snes-modder/discovery' {
  export type ROMOffset = number;
  export type SNESAddress = number;
  export type DiscoveryId = string;

  export interface Discovery {
    readonly id: DiscoveryId;
    readonly type: DiscoveryType;
    readonly offset: ROMOffset;
    readonly size: number;
    readonly confidence: ConfidenceLevel;
    readonly discovered: Date;
    readonly lastVerified: Date;
    readonly metadata: DiscoveryMetadata;
    readonly data: DiscoveryData;
    readonly relationships: Relationship[];
  }

  export type DiscoveryType = 
    | 'item'
    | 'sprite' 
    | 'routine'
    | 'pointer_table'
    | 'audio'
    | 'text'
    | 'room';

  export type ConfidenceLevel = 'low' | 'medium' | 'high' | 'verified';

  export interface DiscoveryMetadata {
    readonly source: string;
    readonly method: string;
    readonly name?: string;
    readonly description?: string;
    readonly tags: Set<string>;
    readonly author?: string;
    readonly notes?: string;
  }

  export interface DiscoveryData {
    readonly [key: string]: unknown;
  }

  export interface Relationship {
    readonly type: RelationType;
    readonly targetId: DiscoveryId;
    readonly description?: string;
  }

  export type RelationType = 
    | 'points_to'
    | 'contains'
    | 'calls'
    | 'references'
    | 'depends_on';

  export interface ItemDiscovery extends Discovery {
    readonly type: 'item';
    readonly data: ItemData;
  }

  export interface ItemData {
    readonly itemId: number;
    readonly itemType: string;
    readonly maxValue?: number;
    readonly defaultValue?: number;
    readonly validValues?: number[];
  }

  export interface SpriteDiscovery extends Discovery {
    readonly type: 'sprite';
    readonly data: SpriteData;
  }

  export interface SpriteData {
    readonly spriteId: number;
    readonly spriteType: string;
    readonly animationFrames?: number;
    readonly hitboxes?: HitboxData[];
  }

  export interface HitboxData {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  }

  export interface RoutineDiscovery extends Discovery {
    readonly type: 'routine';
    readonly data: RoutineData;
  }

  export interface RoutineData {
    readonly entryPoint: ROMOffset;
    readonly exitPoints: ROMOffset[];
    readonly parameters?: ParameterInfo[];
    readonly returnType?: string;
  }

  export interface ParameterInfo {
    readonly name: string;
    readonly type: string;
    readonly register?: string;
    readonly address?: ROMOffset;
  }
}

declare module '@snes-modder/address-system' {
  export interface AddressMigration {
    detectAddressSpace(address: number): 'rom' | 'snes' | 'unknown';
    toROM(snesAddress: number): number;
    toSNES(romAddress: number): number;
  }

  export const AddressMigration: AddressMigration;

  export interface UnifiedAddressSpace {
    readonly type: 'rom' | 'sram' | 'wram' | 'vram' | 'oam';
    readonly baseAddress: number;
    readonly size: number;
    readonly writable: boolean;
    readonly persistent: boolean;
  }

  export interface MemoryRegion {
    readonly start: number;
    readonly end: number;
    readonly size: number;
    readonly name: string;
    readonly description?: string;
  }

  export const MEMORY_REGIONS: {
    readonly WRAM: MemoryRegion;
    readonly SRAM: MemoryRegion;
    readonly ROM_LOROM: MemoryRegion;
    readonly PPU_REGISTERS: MemoryRegion;
    readonly CPU_REGISTERS: MemoryRegion;
    readonly DMA_REGISTERS: MemoryRegion;
  };
}

declare module '@snes-modder/protocols' {
  import type { Discovery } from '@snes-modder/discovery';

  export interface DiscoveryProtocol {
    findById(id: string): Discovery | null;
    findByOffset(offset: number): Discovery | null;
    findByType<T extends Discovery['type']>(type: T): Discovery[];
    findByAddress(address: number): Discovery[];
    
    validateDiscovery(discovery: Discovery): boolean;
    exportSymbols(): EmulatorSymbols;
    importSymbols(symbols: EmulatorSymbols): Discovery[];
  }

  export interface EmulatorSymbols {
    readonly addresses: Map<string, number>;
    readonly labels: Map<number, string>;
    readonly functions: Map<string, FunctionInfo>;
    readonly data: Map<string, DataInfo>;
  }

  export interface FunctionInfo {
    readonly address: number;
    readonly size: number;
    readonly name: string;
    readonly parameters?: string[];
    readonly returns?: string;
  }

  export interface DataInfo {
    readonly address: number;
    readonly size: number;
    readonly type: string;
    readonly name: string;
    readonly description?: string;
  }

  export interface EmulatorBreakpoint {
    readonly address: number;
    readonly condition?: string;
    readonly enabled: boolean;
    readonly type: 'read' | 'write' | 'execute' | 'read_write';
  }

  export interface MemoryWatch {
    readonly address: number;
    readonly size: number;
    readonly format: 'hex' | 'decimal' | 'ascii' | 'binary';
    readonly label?: string;
    readonly callback?: (oldValue: Uint8Array, newValue: Uint8Array) => void;
  }
}

declare module '@snes-modder/adapters' {
  import type { Discovery } from '@snes-modder/discovery';
  import type { AddressMigration } from '@snes-modder/address-system';
  import type { EmulatorBreakpoint, MemoryWatch } from '@snes-modder/protocols';

  export class BsnesPlusDiscoveryAdapter {
    constructor(
      discoveries: Discovery[],
      addressMigration: AddressMigration
    );

    toBreakpoint(discovery: Discovery): EmulatorBreakpoint;
    toMemoryWatch(discovery: Discovery): MemoryWatch;
    exportSymbols(): string;
    importSymbols(symbolData: string): Discovery[];
    
    getDiscoveriesByType<T extends Discovery['type']>(type: T): Discovery[];
    validateAddress(address: number): boolean;
    convertROMToSNES(romOffset: number): number;
    convertSNESToROM(snesAddress: number): number;
  }

  export interface AdapterOptions {
    readonly validateAddresses?: boolean;
    readonly includeMetadata?: boolean;
    readonly compressionEnabled?: boolean;
    readonly cacheSize?: number;
  }
}

declare module '@snes-modder/validation' {
  export interface ValidationResult {
    readonly valid: boolean;
    readonly errors: string[];
    readonly warnings: string[];
    readonly suggestions: string[];
  }

  export interface ValidationRules {
    validateSNESAddress(address: number): boolean;
    validateROMOffset(offset: number): boolean;
    validateDiscovery(discovery: unknown): discovery is Discovery;
    validateMemoryRange(start: number, end: number): boolean;
  }

  export const ValidationRules: ValidationRules;
}

// Global constants for bsnes-plus integration
declare const CRITICAL_ADDRESSES: {
  readonly HEALTH_CURRENT: 0x7EF36D;
  readonly HEALTH_MAX: 0x7EF36C;
  readonly MAGIC_CURRENT: 0x7EF36E;
  readonly BOW: 0x7EF340;
  readonly BOOMERANG: 0x7EF341;
  readonly HOOKSHOT: 0x7EF342;
  readonly RUPEES_LOW: 0x7EF360;
  readonly RUPEES_HIGH: 0x7EF361;
  readonly SAVE_DATA_START: 0x7EF000;
  readonly SAVE_DATA_END: 0x7EF4FF;
  readonly ROM_TITLE: 0x7FC0;
  readonly NMI_VECTOR: 0xFFEA;
  readonly RESET_VECTOR: 0xFFFC;
};

declare const HOT_ADDRESSES: readonly number[];

declare const MEMORY_MAP: {
  readonly WRAM: { start: 0x7E0000; end: 0x7FFFFF; size: 0x20000 };
  readonly SRAM: { start: 0x700000; end: 0x77FFFF; size: 0x80000 };
  readonly ROM_BANK_80_BF: { start: 0x808000; end: 0xBFFFFF };
  readonly PPU_REGISTERS: { start: 0x2100; end: 0x213F };
  readonly CPU_REGISTERS: { start: 0x4200; end: 0x421F };
  readonly DMA_REGISTERS: { start: 0x4300; end: 0x437F };
};

// Export configuration for package.json
export interface BridgeConfiguration {
  readonly bridgeId: 'bridge-f8c006c6e7e6';
  readonly version: '1.0.0';
  readonly compatibility: {
    readonly snesModder: '^1.0.0';
    readonly bsnesPlus: '^1.0.0';
  };
}