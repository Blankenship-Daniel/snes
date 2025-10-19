/**
 * BsnesEmulator - Manages persistent emulator session
 *
 * Since bsnes-cli is stateless, this wrapper tracks all inputs
 * and replays them from the beginning each time.
 */

import { spawn } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export interface GameState {
  rupees: number;
  health: number;
  totalFrames: number;
  location: string;
}

interface InputCommand {
  type: 'button' | 'frames';
  button?: string;
  frames: number;
}

export class BsnesEmulator {
  private romPath: string;
  private bsnesPath: string;
  private totalFrames: number = 0;
  private tempDir: string;
  private isRunning: boolean = false;
  private inputHistory: InputCommand[] = [];

  constructor(romPath: string, bsnesPath: string = 'bsnes') {
    this.romPath = romPath;
    this.bsnesPath = bsnesPath;
    this.tempDir = join(tmpdir(), `bsnes-mcp-${Date.now()}`);
  }

  /**
   * Start the emulator session
   */
  async start(): Promise<void> {
    if (!existsSync(this.romPath)) {
      throw new Error(`ROM file not found: ${this.romPath}`);
    }

    // Create temp directory
    await mkdir(this.tempDir, { recursive: true });
    this.isRunning = true;
    this.inputHistory = [];
    this.totalFrames = 0;
  }

  /**
   * Press a controller button
   */
  async pressButton(button: string, frames: number = 1): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Emulator not running');
    }

    // Add to history
    this.inputHistory.push({ type: 'button', button, frames });
    this.totalFrames += frames;
  }

  /**
   * Run frames without input
   */
  async runFrames(frames: number): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Emulator not running');
    }

    // Add to history
    this.inputHistory.push({ type: 'frames', frames });
    this.totalFrames += frames;
  }

  /**
   * Read memory from WRAM
   */
  async readMemory(address: string, size: number): Promise<Buffer> {
    if (!this.isRunning) {
      throw new Error('Emulator not running');
    }

    const dumpFile = join(this.tempDir, `mem-${Date.now()}.bin`);

    // Replay all inputs and dump memory
    await this.replayWithDump(dumpFile, address, size);

    // Read the dumped memory
    const { readFile } = await import('fs/promises');
    const data = await readFile(dumpFile);

    // Clean up
    await unlink(dumpFile).catch(() => {});

    return data;
  }

  /**
   * Format memory data
   */
  formatMemory(data: Buffer, format: 'hex' | 'decimal' | 'binary'): string {
    const bytes = Array.from(data);

    switch (format) {
      case 'hex':
        return bytes.map(b => `0x${b.toString(16).padStart(2, '0').toUpperCase()}`).join(' ');
      case 'decimal':
        return bytes.map(b => b.toString()).join(' ');
      case 'binary':
        return bytes.map(b => `0b${b.toString(2).padStart(8, '0')}`).join(' ');
      default:
        return bytes.map(b => `0x${b.toString(16).padStart(2, '0')}`).join(' ');
    }
  }

  /**
   * Get comprehensive game state for Zelda 3
   */
  async getGameState(): Promise<string> {
    if (!this.isRunning) {
      throw new Error('Emulator not running');
    }

    // Read key memory addresses
    const rupeeData = await this.readMemory('0x7EF360', 2);
    const healthData = await this.readMemory('0x7EF36D', 1);
    const roomData = await this.readMemory('0x7E00A0', 2);

    // Parse values (little-endian)
    const rupees = rupeeData.readUInt16LE(0);
    const health = healthData.readUInt8(0);
    const room = roomData.readUInt16LE(0);

    return `Frame: ${this.totalFrames}
💰 Rupees: ${rupees}
❤️  Health: ${health}
📍 Room: 0x${room.toString(16).padStart(4, '0')}

Memory Details:
  - Rupees at $7EF360: ${this.formatMemory(rupeeData, 'hex')} (${rupees} decimal)
  - Health at $7EF36D: ${this.formatMemory(healthData, 'hex')} (${health}/160)
  - Room at $7E00A0: ${this.formatMemory(roomData, 'hex')}`;
  }

  /**
   * Reset emulator
   */
  async reset(): Promise<void> {
    this.totalFrames = 0;
    this.inputHistory = [];
  }

  /**
   * Stop emulator and cleanup
   */
  async stop(): Promise<void> {
    this.isRunning = false;

    // Clean up temp directory
    try {
      const { rm } = await import('fs/promises');
      await rm(this.tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Get total frames executed
   */
  getTotalFrames(): number {
    return this.totalFrames;
  }

  /**
   * Replay all inputs from the beginning and dump memory
   */
  private async replayWithDump(dumpFile: string, address: string, size: number): Promise<void> {
    // Build command args by replaying all inputs with frame-accurate timing
    const args: string[] = [];

    // Helper to normalize button identifiers and build command fragments
    const norm = (s: string) => s.trim().toLowerCase();
    const makeCmds = (button: string) => {
      const b = norm(button);
      // face + shoulders
      if (['a', 'b', 'x', 'y', 'l', 'r', 'start', 'select'].includes(b)) {
        const cap = b.charAt(0).toUpperCase() + b.slice(1);
        return {
          press: `p1_press_${cap}`,
          hold: `p1_hold_${b}`,
          release: `p1_release_${b}`,
        };
      }
      // d-pad
      if (['up', 'down', 'left', 'right'].includes(b)) {
        return {
          press: `p1_press_${b}`,
          hold: `p1_hold_${b}`,
          release: `p1_release_${b}`,
        };
      }
      return null;
    };

    // Convert history into scheduled input commands of the form
    //   cmd@F            -> at frame F
    //   cmd@F1-F2        -> inclusive frame range
    // And ensure a matching release at the end of any multi-frame hold.
    const scheduled: string[] = [];
    let cursor = 0;
    for (const cmd of this.inputHistory) {
      if (cmd.type === 'frames') {
        cursor += cmd.frames;
        continue;
      }
      if (!cmd.button) continue;

      const c = makeCmds(cmd.button);
      if (!c) continue;

      const duration = Math.max(1, cmd.frames || 1);
      const start = cursor;
      const end = cursor + duration - 1;

      if (duration === 1) {
        // Single-frame tap
        scheduled.push(`${c.press}@${start}`);
      } else {
        // Multi-frame hold with explicit release at end
        scheduled.push(`${c.hold}@${start}-${end}`);
        scheduled.push(`${c.release}@${end}`);
      }

      cursor += duration;
    }

    if (scheduled.length > 0) {
      args.push('--ai-controller');
      for (const s of scheduled) args.push('--input-command', s);
    }

    // Add run frames for total
    args.push('--run-frames', String(Math.max(1, this.totalFrames)));

    // Add memory dump
    args.push('--dump-wram', `${address}:${size}:${dumpFile}`);

    // Debug: log the command
    console.error('DEBUG: Running bsnes with args:', args.join(' '));

    await this.runBsnesCommand(args);
  }

  /**
   * Run bsnes with specified command-line arguments
   */
  private async runBsnesCommand(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(this.bsnesPath, [this.romPath, ...args], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`bsnes exited with code ${code}\nStdout: ${stdout}\nStderr: ${stderr}\nCommand: ${this.bsnesPath} ${this.romPath} ${args.join(' ')}`));
        } else {
          resolve();
        }
      });

      proc.on('error', (error) => {
        reject(new Error(`Failed to spawn bsnes: ${error.message}`));
      });
    });
  }
}
