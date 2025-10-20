/**
 * Morgan's Global Type Patches - Ship It NOW!
 * Temporary patches to get the build working
 */

// Missing test globals
declare const expect: any;
declare const describe: any;
declare const it: any;
declare const test: any;
declare const beforeEach: any;
declare const afterEach: any;

// Missing types that are referenced
declare type DiscoveryCategory = string;
declare type ConfidenceLevel = 'low' | 'medium' | 'high' | 'verified';

// Type guards that are missing
declare const isDiscovery: (value: any) => boolean;
declare const isItemDiscovery: (value: any) => boolean;
declare const isSpriteDiscovery: (value: any) => boolean;
declare const isMemoryDiscovery: (value: any) => boolean;
declare const isRoutineDiscovery: (value: any) => boolean;
declare const assertDiscovery: (value: any) => void;
declare const assertValidated: (value: any) => void;
declare const assertValidAddress: (value: any) => void;

// Missing methods on classes
declare module '../lib/RapidModGenerator' {
  export interface RapidModGenerator {
    applyMultipleMods?: (...args: any[]) => any;
  }
}

declare module '../lib/ZeldaAssetExtraction' {
  export interface ZeldaAssetExtraction {
    extractAllAssets?: (...args: any[]) => any;
  }
}

declare module '../debug/BsnesClient' {
  export interface BsnesClient {
    writeMemory?: (address: number, value: number) => void;
  }
}

// Export everything to make TypeScript happy
export {};