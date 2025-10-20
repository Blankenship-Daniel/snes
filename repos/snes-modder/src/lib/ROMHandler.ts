/**
 * SNES ROM Handler - TypeScript implementation
 * Provides safe, type-checked ROM manipulation
 */

import { Buffer } from 'buffer';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface ROMHeader {
  title: string;
  mappingMode: number;
  romType: number;
  romSize: number;
  sramSize: number;
  country: number;
  license: number;
  version: number;
  checksum: number;
  checksumComplement: number;
}

export class ROMValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ROMValidationError';
  }
}

export class ROMModificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ROMModificationError';
  }
}

export class ROMHandler {
  private data: Buffer;
  private readonly path: string;
  private readonly originalChecksum: string;
  public readonly header: ROMHeader;

  // Quick shipping fix: Public getters for data and path access
  get romData(): Buffer {
    return this.data;
  }
  
  get romPath(): string {
    return this.path;
  }

  constructor(romPath: string) {
    if (!fs.existsSync(romPath)) {
      throw new ROMValidationError(`ROM file not found: ${romPath}`);
    }

    this.path = romPath;
    this.data = fs.readFileSync(romPath);
    this.originalChecksum = this.calculateChecksum();
    this.header = this.parseHeader();
    this.validate();
  }

  private calculateChecksum(): string {
    const hash = crypto.createHash('sha256');
    hash.update(this.data);
    return hash.digest('hex');
  }

  private parseHeader(): ROMHeader {
    // Detect header offset (LoROM vs HiROM)
    const headerOffset = this.detectHeaderOffset();
    
    return {
      title: this.data.toString('ascii', headerOffset + 0x00, headerOffset + 0x15).trim(),
      mappingMode: this.data[headerOffset + 0x15],
      romType: this.data[headerOffset + 0x16],
      romSize: this.data[headerOffset + 0x17],
      sramSize: this.data[headerOffset + 0x18],
      country: this.data[headerOffset + 0x19],
      license: this.data[headerOffset + 0x1A],
      version: this.data[headerOffset + 0x1B],
      checksumComplement: this.data.readUInt16LE(headerOffset + 0x1C),
      checksum: this.data.readUInt16LE(headerOffset + 0x1E),
    };
  }

  private detectHeaderOffset(): number {
    // Check for SMC header (512 bytes)
    const hasSMCHeader = (this.data.length & 0x3FF) === 0x200;
    const baseOffset = hasSMCHeader ? 0x200 : 0;

    // Try LoROM location first
    const loRomOffset = baseOffset + 0x7FC0;
    if (this.isValidHeader(loRomOffset)) {
      return loRomOffset;
    }

    // Try HiROM location
    const hiRomOffset = baseOffset + 0xFFC0;
    if (this.isValidHeader(hiRomOffset)) {
      return hiRomOffset;
    }

    throw new ROMValidationError('Could not detect valid ROM header');
  }

  private isValidHeader(offset: number): boolean {
    if (offset + 0x20 > this.data.length) {
      return false;
    }

    const checksum = this.data.readUInt16LE(offset + 0x1E);
    const complement = this.data.readUInt16LE(offset + 0x1C);
    
    return (checksum ^ complement) === 0xFFFF;
  }

  private validate(): void {
    // Validate ROM size
    const expectedSize = Math.pow(2, this.header.romSize + 10);
    const actualSize = this.data.length & ~0x1FF; // Ignore SMC header
    
    if (actualSize < expectedSize * 0.5 || actualSize > expectedSize * 2) {
      console.warn(`ROM size mismatch. Expected: ${expectedSize}, Actual: ${actualSize}`);
    }

    // Validate checksum
    const calculatedChecksum = this.calculateInternalChecksum();
    if (calculatedChecksum !== this.header.checksum) {
      console.warn('ROM checksum mismatch - ROM may be modified or corrupt');
    }
  }

  private calculateInternalChecksum(): number {
    // Exclude 512-byte copier/SMC header if present
    const smcHeaderOffset = (this.data.length & 0x3FF) === 0x200 ? 0x200 : 0;

    let sum = 0;
    for (let i = smcHeaderOffset; i < this.data.length; i++) {
      sum += this.data[i];
    }
    return sum & 0xFFFF;
  }

  public readByte(offset: number): number {
    if (offset < 0 || offset >= this.data.length) {
      throw new ROMValidationError(`Invalid offset: 0x${offset.toString(16)}`);
    }
    return this.data[offset];
  }

  public readBytes(offset: number, length: number): Buffer {
    if (offset < 0 || offset + length > this.data.length) {
      throw new ROMValidationError(`Invalid read range: 0x${offset.toString(16)}-0x${(offset + length).toString(16)}`);
    }
    return this.data.slice(offset, offset + length);
  }

  public readWord(offset: number): number {
    if (offset < 0 || offset + 1 >= this.data.length) {
      throw new ROMValidationError(`Invalid word read at offset: 0x${offset.toString(16)}`);
    }
    return this.data.readUInt16LE(offset);
  }

  public readLong(offset: number): number {
    if (offset < 0 || offset + 2 >= this.data.length) {
      throw new ROMValidationError(`Invalid long read at offset: 0x${offset.toString(16)}`);
    }
    return this.data.readUInt16LE(offset) | (this.data[offset + 2] << 16);
  }

  public writeByte(offset: number, value: number): void {
    if (offset < 0 || offset >= this.data.length) {
      throw new ROMModificationError(`Invalid offset: 0x${offset.toString(16)}`);
    }
    if (value < 0 || value > 0xFF) {
      throw new ROMModificationError(`Invalid byte value: ${value}`);
    }
    this.data[offset] = value;
  }

  public writeBytes(offset: number, bytes: Buffer | number[]): void {
    const data = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
    
    if (offset < 0 || offset + data.length > this.data.length) {
      throw new ROMModificationError(`Invalid write range: 0x${offset.toString(16)}-0x${(offset + data.length).toString(16)}`);
    }
    
    data.copy(this.data, offset);
  }

  public writeWord(offset: number, value: number): void {
    if (value < 0 || value > 0xFFFF) {
      throw new ROMModificationError(`Invalid word value: ${value}`);
    }
    if (offset < 0 || offset + 1 >= this.data.length) {
      throw new ROMModificationError(`Invalid write offset for word: 0x${offset.toString(16)}`);
    }
    this.data.writeUInt16LE(value, offset);
  }

  public save(outputPath?: string): void {
    const savePath = outputPath || this.path;
    
    // Create backup if overwriting
    if (!outputPath && fs.existsSync(savePath)) {
      const backupPath = `${savePath}.backup`;
      fs.copyFileSync(savePath, backupPath);
    }
    
    fs.writeFileSync(savePath, this.data);
  }

  public saveAs(outputPath: string): void {
    this.save(outputPath);
  }

  public getSize(): number {
    return this.data.length;
  }

  public getData(): Buffer {
    return Buffer.from(this.data);
  }

  public isModified(): boolean {
    return this.calculateChecksum() !== this.originalChecksum;
  }

  public updateChecksum(): void {
    const headerOffset = this.detectHeaderOffset();
    // Recompute over ROM body (excluding any 512-byte copier header)
    const checksum = this.calculateInternalChecksum();
    const complement = checksum ^ 0xFFFF;
    
    this.data.writeUInt16LE(checksum, headerOffset + 0x1E);
    this.data.writeUInt16LE(complement, headerOffset + 0x1C);
  }

  public toSNESAddress(pcAddress: number): number {
    // Convert PC address to SNES LoROM address
    const bank = (pcAddress >> 15) & 0x7F;
    const offset = (pcAddress & 0x7FFF) | 0x8000;
    return (bank << 16) | offset;
  }

  public toPCAddress(snesAddress: number): number {
    // Convert SNES LoROM address to PC address
    const bank = (snesAddress >> 16) & 0x7F;
    const offset = snesAddress & 0xFFFF;
    
    if (offset < 0x8000) {
      throw new ROMValidationError(`Invalid SNES address offset: 0x${offset.toString(16)}`);
    }
    
    return (bank << 15) | (offset & 0x7FFF);
  }
}
