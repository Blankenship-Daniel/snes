import { readFileSync } from 'fs';
import { searchCode } from './search-code.js';
import { findFunctions } from './find-functions.js';

export interface AnalyzeComponentsParams {
  component?: string;
}

export interface ComponentAnalysis {
  component: string;
  description: string;
  files: string[];
  functions: string[];
  key_addresses: string[];
  related_systems: string[];
}

export interface AnalyzeComponentsResult {
  analyses: ComponentAnalysis[];
  summary: string;
}

export function analyzeGameComponents(params: AnalyzeComponentsParams): AnalyzeComponentsResult {
  const { component = '' } = params;
  
  const analyses: ComponentAnalysis[] = [];
  
  if (component) {
    // Analyze specific component
    const analysis = analyzeSpecificComponent(component);
    if (analysis) {
      analyses.push(analysis);
    }
  } else {
    // Analyze all major components
    const components = ['sprite', 'player', 'dungeon', 'overworld', 'audio', 'graphics', 'input', 'items'];
    
    for (const comp of components) {
      const analysis = analyzeSpecificComponent(comp);
      if (analysis) {
        analyses.push(analysis);
      }
    }
  }
  
  const summary = generateComponentSummary(analyses);
  
  return { analyses, summary };
}

function analyzeSpecificComponent(component: string): ComponentAnalysis | null {
  const componentMap: Record<string, ComponentAnalysis> = {
    sprite: {
      component: 'Sprite System',
      description: 'Sprite management, rendering, and behavior',
      files: [],
      functions: [],
      key_addresses: ['$7E0E20', '$7E0F00', '$0E4000'],
      related_systems: ['graphics', 'collision', 'ai']
    },
    player: {
      component: 'Player Character',
      description: 'Link\'s movement, state, and abilities',
      files: [],
      functions: [],
      key_addresses: ['$7E0020', '$7E0022', '$7E0024'],
      related_systems: ['input', 'collision', 'items']
    },
    dungeon: {
      component: 'Dungeon System',
      description: 'Dungeon rooms, transitions, and mechanics',
      files: [],
      functions: [],
      key_addresses: ['$7E0550', '$7E040C', '$0A8000'],
      related_systems: ['overworld', 'rooms', 'doors']
    },
    overworld: {
      component: 'Overworld System',
      description: 'World map, areas, and transitions',
      files: [],
      functions: [],
      key_addresses: ['$7E040A', '$7E043C', '$0C8000'],
      related_systems: ['dungeon', 'weather', 'events']
    },
    audio: {
      component: 'Audio System',
      description: 'Music, sound effects, and SPC communication',
      files: [],
      functions: [],
      key_addresses: ['$2140', '$2141', '$2142'],
      related_systems: ['spc700', 'music', 'sfx']
    },
    graphics: {
      component: 'Graphics System',
      description: 'PPU control, tile management, and rendering',
      files: [],
      functions: [],
      key_addresses: ['$2100', '$2105', '$2107'],
      related_systems: ['sprites', 'bg', 'palettes']
    },
    input: {
      component: 'Input System',
      description: 'Controller reading and input processing',
      files: [],
      functions: [],
      key_addresses: ['$4016', '$4017', '$7E0F6C'],
      related_systems: ['player', 'menu', 'pause']
    },
    items: {
      component: 'Item System',
      description: 'Inventory, equipment, and item effects',
      files: [],
      functions: [],
      key_addresses: ['$7E0340', '$7E035F', '$7E0374'],
      related_systems: ['player', 'save', 'upgrades']
    }
  };
  
  const base = componentMap[component.toLowerCase()];
  if (!base) {
    return null;
  }
  
  // Search for related files and functions
  try {
    const searchResult = searchCode({ query: component, file_type: 'asm' });
    base.files = [...new Set(searchResult.results.map(r => r.file))].slice(0, 10);
    
    const functionResult = findFunctions({ function_name: component });
    base.functions = functionResult.functions.map(f => f.name).slice(0, 10);
  } catch (error) {
    // Continue with base analysis even if search fails
  }
  
  return base;
}

function generateComponentSummary(analyses: ComponentAnalysis[]): string {
  if (analyses.length === 0) {
    return 'No components analyzed.';
  }
  
  let summary = `Zelda 3 Component Analysis Summary:\n\n`;
  summary += `Analyzed ${analyses.length} major game components:\n\n`;
  
  analyses.forEach(analysis => {
    summary += `🎮 ${analysis.component}\n`;
    summary += `   ${analysis.description}\n`;
    summary += `   Files: ${analysis.files.length}, Functions: ${analysis.functions.length}\n`;
    summary += `   Key addresses: ${analysis.key_addresses.join(', ')}\n\n`;
  });
  
  return summary;
}

export function formatComponentAnalysis(result: AnalyzeComponentsResult): string {
  let output = result.summary + '\n';
  
  result.analyses.forEach(analysis => {
    output += `\n## ${analysis.component}\n\n`;
    output += `${analysis.description}\n\n`;
    
    if (analysis.files.length > 0) {
      output += `**Related Files:**\n`;
      analysis.files.forEach(file => {
        output += `- ${file}\n`;
      });
      output += '\n';
    }
    
    if (analysis.functions.length > 0) {
      output += `**Key Functions:**\n`;
      analysis.functions.forEach(func => {
        output += `- ${func}\n`;
      });
      output += '\n';
    }
    
    if (analysis.key_addresses.length > 0) {
      output += `**Memory Addresses:**\n`;
      analysis.key_addresses.forEach(addr => {
        output += `- ${addr}\n`;
      });
      output += '\n';
    }
    
    if (analysis.related_systems.length > 0) {
      output += `**Related Systems:**\n`;
      analysis.related_systems.forEach(system => {
        output += `- ${system}\n`;
      });
      output += '\n';
    }
  });
  
  return output;
}