import type { ROMModification as BinaryROMModification } from './snes.types';

export interface ModificationMetadata {
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly author: string;
  readonly gameTargets: readonly string[];
  readonly category: string;
  readonly riskLevel: 'low' | 'medium' | 'high';
  readonly reversible: boolean;
  readonly dependencies: readonly string[];
}

export interface ROMRuntimeModification {
  getMetadata(): ModificationMetadata;
  apply(romBuffer: Uint8Array): Promise<void> | void;
  revert?(romBuffer: Uint8Array): Promise<void> | void;
}

export type ROMModification = ROMRuntimeModification;
export type BytePatchModification = BinaryROMModification;
