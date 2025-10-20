#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import Zelda3 tools
import { searchCode, formatSearchResults } from './tools/search-code.js';
import { readSourceFile, formatSourceFileContent } from './tools/read-source-file.js';
import { findFunctions, formatFunctionResults } from './tools/find-functions.js';
import { listFiles, formatFileList } from './tools/list-files.js';
import { analyzeGameComponents, formatComponentAnalysis } from './tools/analyze-game-components.js';

// Server metadata
const SERVER_NAME = 'zelda3-mcp-server';
const SERVER_VERSION = '0.1.0';
const SERVER_DESCRIPTION = 'Zelda 3 disassembly access, search, and analysis tools for reverse engineering';

// Create the MCP server instance
const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Handler for listing available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_code',
        description: 'Search for code patterns in the Zelda 3 source code',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (supports regex patterns)',
            },
            directory: {
              type: 'string',
              description: 'Directory to search in (relative to repo root)',
              default: '',
            },
            file_type: {
              type: 'string',
              description: 'File extension filter (e.g., \'asm\', \'inc\', \'cfg\')',
              default: '',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'list_files',
        description: 'List files and directories in the Zelda 3 repository',
        inputSchema: {
          type: 'object',
          properties: {
            directory: {
              type: 'string',
              description: 'Directory path (relative to repo root)',
              default: '',
            },
            filter: {
              type: 'string',
              description: 'File extension filter (e.g., \'asm\', \'inc\')',
              default: '',
            },
            recursive: {
              type: 'boolean',
              description: 'List files recursively',
              default: false,
            },
          },
        },
      },
      {
        name: 'read_source_file',
        description: 'Read contents of a specific source file',
        inputSchema: {
          type: 'object',
          properties: {
            file_path: {
              type: 'string',
              description: 'Path to source file (relative to repo root)',
            },
            start_line: {
              type: 'number',
              description: 'Starting line number (1-based)',
              default: 1,
            },
            end_line: {
              type: 'number',
              description: 'Ending line number (optional)',
            },
          },
          required: ['file_path'],
        },
      },
      {
        name: 'find_functions',
        description: 'Find function definitions in assembly files',
        inputSchema: {
          type: 'object',
          properties: {
            function_name: {
              type: 'string',
              description: 'Function name to search for (supports partial matches)',
            },
            directory: {
              type: 'string',
              description: 'Directory to search in',
              default: '',
            },
          },
          required: ['function_name'],
        },
      },
      {
        name: 'analyze_game_components',
        description: 'Analyze major game components and subsystems',
        inputSchema: {
          type: 'object',
          properties: {
            component: {
              type: 'string',
              description: 'Component to analyze (\'sprite\', \'player\', \'dungeon\', \'overworld\', \'audio\', \'graphics\', \'input\', \'items\')',
              default: '',
            },
          },
        },
      },
    ],
  };
});

// Handler for calling tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case 'search_code': {
      const params = request.params.arguments as any;
      const result = searchCode(params);
      const formatted = formatSearchResults(result);
      
      return {
        content: [{
          type: 'text',
          text: formatted,
        }],
      };
    }
    
    case 'list_files': {
      const params = request.params.arguments as any;
      const result = listFiles(params);
      const formatted = formatFileList(result);
      
      return {
        content: [{
          type: 'text',
          text: formatted,
        }],
      };
    }
    
    case 'read_source_file': {
      const params = request.params.arguments as any;
      const result = readSourceFile(params);
      const formatted = formatSourceFileContent(result);
      
      return {
        content: [{
          type: 'text',
          text: formatted,
        }],
      };
    }
    
    case 'find_functions': {
      const params = request.params.arguments as any;
      const result = findFunctions(params);
      const formatted = formatFunctionResults(result);
      
      return {
        content: [{
          type: 'text',
          text: formatted,
        }],
      };
    }
    
    case 'analyze_game_components': {
      const params = request.params.arguments as any;
      const result = analyzeGameComponents(params);
      const formatted = formatComponentAnalysis(result);
      
      return {
        content: [{
          type: 'text',
          text: formatted,
        }],
      };
    }

    default:
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${request.params.name}`
      );
  }
});

// Handler for listing available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'zelda3://disassembly/overview',
        name: 'Disassembly Overview',
        description: 'Overview of the Zelda 3 disassembly structure and organization',
        mimeType: 'text/plain',
      },
      {
        uri: 'zelda3://disassembly/banks',
        name: 'ROM Bank Layout',
        description: 'Information about ROM bank organization and contents',
        mimeType: 'text/plain',
      },
      {
        uri: 'zelda3://disassembly/constants',
        name: 'Constants and Definitions',
        description: 'Game constants, memory addresses, and definitions',
        mimeType: 'text/plain',
      },
      {
        uri: 'zelda3://disassembly/memory-map',
        name: 'Memory Map',
        description: 'SNES memory layout and Zelda 3 specific memory usage',
        mimeType: 'text/plain',
      },
    ],
  };
});

// Handler for reading resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  
  switch (uri) {
    case 'zelda3://disassembly/overview':
      return {
        contents: [{
          uri,
          mimeType: 'text/plain',
          text: getDisassemblyOverview(),
        }],
      };
      
    case 'zelda3://disassembly/banks':
      return {
        contents: [{
          uri,
          mimeType: 'text/plain',
          text: getROMBankLayout(),
        }],
      };
      
    case 'zelda3://disassembly/constants':
      return {
        contents: [{
          uri,
          mimeType: 'text/plain',
          text: getConstantsInfo(),
        }],
      };
      
    case 'zelda3://disassembly/memory-map':
      return {
        contents: [{
          uri,
          mimeType: 'text/plain',
          text: getMemoryMapInfo(),
        }],
      };
      
    default:
      throw new McpError(
        ErrorCode.InvalidRequest,
        `Unknown resource: ${uri}`
      );
  }
});

function getDisassemblyOverview(): string {
  return `Zelda 3: A Link to the Past Disassembly

This is a complete reverse-engineered disassembly of The Legend of Zelda: A Link to the Past for the SNES.

Structure:
- bank0.asm through bank31.asm: Individual ROM banks containing game code
- constants.asm: Game constants and memory address definitions
- hdr.asm: ROM header information
- snes.asm: SNES hardware register definitions
- main.s: Main assembly entry point
- Makefile: Build configuration

The disassembly is organized by ROM banks, with each bank containing related game systems.
Use the search tools to find specific functions, variables, or code patterns.

Key Areas:
- Banks 0-7: Core game engine, player control, sprite management
- Banks 8-15: Dungeon systems, room data, AI routines
- Banks 16-23: Overworld data, graphics, music
- Banks 24-31: Additional data, compression, special systems`;
}

function getROMBankLayout(): string {
  return `Zelda 3 ROM Bank Organization:

Bank 00: Reset vectors, core initialization, main game loop
Bank 01: Player movement, collision detection, state management
Bank 02: Sprite engine, enemy AI, object interactions
Bank 03: Graphics routines, DMA transfers, PPU management
Bank 04: Sound engine interface, SPC communication
Bank 05: Menu systems, inventory, save/load
Bank 06: Dungeon room engine, door transitions
Bank 07: Overworld engine, area transitions
Bank 08: Enemy AI routines, boss logic
Bank 09: Item collection, equipment effects
Bank 0A: Dialogue system, text rendering
Bank 0B: Map data compression, room layouts
Bank 0C: Overworld map data and scripts
Bank 0D: Dungeon map data and scripts  
Bank 0E: Graphics decompression, tile loading
Bank 0F: Music and sound effect data
Bank 10-17: Graphics data (sprites, backgrounds, palettes)
Bank 18-1F: Music and audio data
Bank 20-31: Additional game data, tables, and resources

Each bank is typically 32KB in size and contains logically related code and data.`;
}

function getConstantsInfo(): string {
  return `Key Constants and Memory Addresses:

Player Data:
$7E0020: Link X coordinate (low byte)
$7E0022: Link Y coordinate (low byte)  
$7E0024: Link X coordinate (high byte)
$7E0026: Link Y coordinate (high byte)
$7E002F: Link direction facing

Game State:
$7E0010: Game state/mode
$7E0011: Sub-state
$7E040A: Current area (overworld)
$7E040C: Current room (dungeon)

Items and Equipment:
$7E0340: Bow
$7E0341: Boomerang
$7E0342: Hookshot
$7E0343: Bombs
$7E0344: Mushroom/Powder
$7E035F: Sword level
$7E0360: Shield level
$7E036C: Current health
$7E036D: Maximum health

System Registers:
$2100: Screen display register
$2105: BG mode and size register
$2140-2143: APU communication ports
$4016-4017: Controller input registers

See constants.asm for complete definitions.`;
}

function getMemoryMapInfo(): string {
  return `SNES Memory Layout for Zelda 3:

$00:0000-$00:1FFF: Work RAM (WRAM) - temporary variables
$00:2000-$00:20FF: PPU registers
$00:4000-$00:43FF: CPU registers, DMA, timers
$00:6000-$00:7FFF: Expansion area
$7E:0000-$7E:1FFF: Game variables and save data
$7E:2000-$7F:FFFF: Additional work RAM
$80:0000-$FF:FFFF: ROM banks (mapped via bank switching)

Zelda 3 Specific Memory Usage:
$7E:0000-$7E:00FF: Core game variables
$7E:0100-$7E:01FF: Player data and state
$7E:0200-$7E:02FF: Sprite data tables
$7E:0300-$7E:03FF: Item and equipment data
$7E:0400-$7E:04FF: Room and area data
$7E:0500-$7E:07FF: Object and enemy data
$7E:0800-$7E:0FFF: Graphics and tile buffers
$7E:1000-$7E:1FFF: Additional game data

The game uses bank switching to access the full 4MB ROM space,
with different banks containing code, graphics, music, and data.`;
}

// Main function to start the server
async function main() {
  console.error('Initializing Zelda 3 disassembly MCP server...');
  
  const transport = new StdioServerTransport();
  
  await server.connect(transport);
  
  console.error(`${SERVER_NAME} (v${SERVER_VERSION}) - ${SERVER_DESCRIPTION}`);
  console.error('Server started and listening for connections...');
}

// Start the server
main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});