import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROMHandler, ROMModificationError, ROMValidationError } from '../lib/ROMHandler';
import * as fs from 'fs';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  copyFileSync: vi.fn(),
}));

describe('ROMHandler', () => {
  const mockROMPath = '/test/zelda3.sfc';
  let mockROMData: Buffer;
  const mockedFs = vi.mocked(fs, true);

  const seedLoRomHeader = (buffer: Buffer) => {
    const headerOffset = 0x7FC0;
    buffer.fill(0);
    buffer.write('ZELDA3TEST', headerOffset, 'ascii');
    buffer[headerOffset + 0x15] = 0x20; // LoROM mapping
    buffer[headerOffset + 0x16] = 0x00; // ROM type
    buffer[headerOffset + 0x17] = 0x09; // ROM size exponent (512KB)
    buffer[headerOffset + 0x18] = 0x05; // SRAM size exponent
    buffer[headerOffset + 0x19] = 1; // Country
    buffer[headerOffset + 0x1A] = 0; // License
    buffer[headerOffset + 0x1B] = 0; // Version
    buffer.writeUInt16LE(0xFFFF, headerOffset + 0x1C); // Complement
    buffer.writeUInt16LE(0x0000, headerOffset + 0x1E); // Checksum
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockROMData = Buffer.alloc(1_048_576); // 1MB ROM
    seedLoRomHeader(mockROMData);

    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.readFileSync.mockReturnValue(mockROMData);
    mockedFs.writeFileSync.mockReset();
    mockedFs.copyFileSync.mockReset();
  });

  describe('constructor', () => {
    it('throws when the ROM file is missing', () => {
      mockedFs.existsSync.mockReturnValueOnce(false);
      expect(() => new ROMHandler('/missing.smc')).toThrow(ROMValidationError);
    });

    it('loads ROM data when the file exists', () => {
      const rom = new ROMHandler(mockROMPath);
      expect(rom.getSize()).toBe(mockROMData.length);
    });
  });

  describe('read operations', () => {
    it('reads a byte correctly', () => {
      mockROMData[0x100] = 0x42;
      const rom = new ROMHandler(mockROMPath);
      expect(rom.readByte(0x100)).toBe(0x42);
    });

    it('throws on byte reads outside the buffer', () => {
      const rom = new ROMHandler(mockROMPath);
      expect(() => rom.readByte(-1)).toThrow(ROMValidationError);
      expect(() => rom.readByte(mockROMData.length)).toThrow(ROMValidationError);
    });

    it('reads multi-byte slices', () => {
      mockROMData[0x100] = 0x12;
      mockROMData[0x101] = 0x34;
      mockROMData[0x102] = 0x56;
      const rom = new ROMHandler(mockROMPath);
      expect(rom.readBytes(0x100, 3)).toEqual(Buffer.from([0x12, 0x34, 0x56]));
    });

    it('guards word reads near the end of the buffer', () => {
      const rom = new ROMHandler(mockROMPath);
      expect(() => rom.readWord(mockROMData.length - 1)).toThrow(ROMValidationError);
      expect(() => rom.readWord(mockROMData.length - 2)).not.toThrow();
    });

    it('guards long reads near the end of the buffer', () => {
      const rom = new ROMHandler(mockROMPath);
      expect(() => rom.readLong(mockROMData.length - 2)).toThrow(ROMValidationError);
      expect(() => rom.readLong(mockROMData.length - 3)).not.toThrow();
    });
  });

  describe('write operations', () => {
    it('writes a byte and marks the ROM dirty', () => {
      const rom = new ROMHandler(mockROMPath);
      expect(rom.isModified()).toBe(false);
      rom.writeByte(0x100, 0x99);
      expect(rom.readByte(0x100)).toBe(0x99);
      expect(rom.isModified()).toBe(true);
    });

    it('rejects invalid byte values', () => {
      const rom = new ROMHandler(mockROMPath);
      expect(() => rom.writeByte(0x100, -1)).toThrow(ROMModificationError);
      expect(() => rom.writeByte(0x100, 256)).toThrow(ROMModificationError);
    });

    it('guards word writes at the buffer boundary', () => {
      const rom = new ROMHandler(mockROMPath);
      expect(() => rom.writeWord(mockROMData.length - 1, 0x1234)).toThrow(ROMModificationError);
      expect(() => rom.writeWord(mockROMData.length - 2, 0x1234)).not.toThrow();
    });
  });

  describe('address conversion', () => {
    it('converts PC to SNES addresses', () => {
      const rom = new ROMHandler(mockROMPath);
      expect(rom.toSNESAddress(0x0000)).toBe(0x008000);
      expect(rom.toSNESAddress(0x7FFF)).toBe(0x00FFFF);
    });

    it('converts SNES to PC addresses', () => {
      const rom = new ROMHandler(mockROMPath);
      expect(rom.toPCAddress(0x008000)).toBe(0x0000);
      expect(rom.toPCAddress(0x00FFFF)).toBe(0x7FFF);
    });

    it('rejects SNES addresses outside ROM space', () => {
      const rom = new ROMHandler(mockROMPath);
      expect(() => rom.toPCAddress(0x007FFF)).toThrow(ROMValidationError);
    });
  });

  describe('save operations', () => {
    it('writes to a new file path', () => {
      const rom = new ROMHandler(mockROMPath);
      const outputPath = '/tmp/output.sfc';
      rom.saveAs(outputPath);
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(outputPath, expect.any(Buffer));
    });

    it('creates a backup when overwriting the source', () => {
      mockedFs.existsSync.mockImplementation((target: fs.PathLike) => target === mockROMPath || target === `${mockROMPath}.backup`);
      const rom = new ROMHandler(mockROMPath);
      rom.save();
      expect(mockedFs.copyFileSync).toHaveBeenCalledWith(mockROMPath, `${mockROMPath}.backup`);
    });
  });
});
