/**
 * SNES Type Definitions
 * Core types for SNES ROM modification
 * Designed by Alex (Architecture)
 */

// Re-export from unified types for compatibility
export type { 
  ROMOffset,
  SaveInitOffset,
  DiscoveryId,
  ByteSize
} from './unified-types';

// SNESAddress is already defined below, don't re-export

// Memory addresses
export type ByteAddress = number;
export type WordAddress = number;
export type LongAddress = number;
export type SNESAddress = number;
export type PCAddress = number;

// Data types
export type Byte = number;  // 0x00-0xFF
export type Word = number;  // 0x0000-0xFFFF
export type Long = number;  // 0x000000-0xFFFFFF

// ROM Mapping modes
export enum ROMMapping {
  LoROM = 0x20,
  HiROM = 0x21,
  ExLoROM = 0x22,
  ExHiROM = 0x25,
}

// Equipment types from our research
export enum SwordType {
  None = 0x00,
  Fighter = 0x01,
  Master = 0x02,
  Tempered = 0x03,
  Golden = 0x04,
}

export enum ShieldType {
  None = 0x00,
  Fighter = 0x01,
  Fire = 0x02,
  Mirror = 0x03,
}

export enum ArmorType {
  Green = 0x00,
  Blue = 0x01,
  Red = 0x02,
}

// ROM Modification interface
export interface ROMModification {
  offset: ByteAddress;
  originalValue: Byte | Byte[];
  newValue: Byte | Byte[];
  description: string;
}

// Mod configuration
export interface ModConfig {
  name: string;
  version: string;
  author: string;
  description: string;
  modifications: ROMModification[];
}

// Equipment preset for Zelda 3
export interface EquipmentPreset {
  name: string;
  description: string;
  sword: SwordType;
  shield: ShieldType;
  armor: ArmorType;
  bow: boolean;
  boomerang: boolean;
  hookshot: boolean;
  bombs: number;
  magicPowder: boolean;
  fireRod: boolean;
  iceRod: boolean;
  bombos: boolean;
  ether: boolean;
  quake: boolean;
  lamp: boolean;
  hammer: boolean;
  flute: boolean;
  net: boolean;
  book: boolean;
  bottleCount: number;
  somaria: boolean;
  byrna: boolean;
  cape: boolean;
  mirror: boolean;
  gloves: number;
  boots: boolean;
  flippers: boolean;
  moonPearl: boolean;
  hearts: number;
  rupees: number;
}

// DMA Transfer configuration
export interface DMATransfer {
  channel: number;
  mode: number;
  source: LongAddress;
  destination: ByteAddress;
  size: Word;
  sourceBank: Byte;
}

// HDMA Table entry
export interface HDMAEntry {
  scanlines: Byte;
  data: Byte  ;
}

// PPU Memory types
export enum PPUMemoryType {
  VRAM = 'VRAM',
  CGRAM = 'CGRAM',
  OAM = 'OAM',
}

// Assembly instruction for documentation
export interface AssemblyInstruction {
  mnemonic: string;
  opcode: Byte;
  addressingMode: string;
  bytes: number;
  cycles: number;
  flags: string[];
  description: string;
}

// Bsnes Debugging Integration Types
export interface DebugSession {
  readonly id: string;
  readonly romPath: string;
  readonly startTime: Date;
  status: 'initializing' | 'running' | 'paused' | 'stopped' | 'error';  // Made mutable for state changes
}

export interface Breakpoint {
  readonly id: string;
  address: SNESAddress;
  condition?: string;
  enabled: boolean;
  hitCount: number;
  readonly type: 'execution' | 'read' | 'write';
}

export interface MemoryWatch {
  readonly id: string;
  address: SNESAddress;
  size: number;
  format: 'hex' | 'decimal' | 'ascii';
  description: string;
}

export interface TraceEntry {
  readonly timestamp: number;
  address: SNESAddress;
  instruction: string;
  registers: ProcessorState;
  memoryAccess?: MemoryAccess;
}

export interface ProcessorState {
  pc: LongAddress;
  a: Word;
  x: Word;
  y: Word;
  sp: Word;
  dp: Word;
  db: Byte;
  p: Byte;
  e: boolean;
}

export interface MemoryAccess {
  type: 'read' | 'write';
  address: SNESAddress;
  value: Byte;
  bank: Byte;
}

export interface DisassemblyLine {
  address: SNESAddress;
  opcode: Byte[];
  instruction: string;
  operand?: string;
  comment?: string;
  label?: string;
}

// Memory region definition
export interface MemoryRegion {
  start: LongAddress;
  end: LongAddress;
  type: 'RAM' | 'ROM' | 'IO' | 'SRAM';
  access: 'read' | 'write' | 'read/write';
  description: string;
  bank?: Byte;
}