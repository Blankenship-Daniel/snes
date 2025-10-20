import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

export interface FindFunctionsParams {
  function_name: string;
  directory?: string;
}

export interface FunctionMatch {
  file: string;
  line: number;
  name: string;
  definition: string;
  context: string[];
}

export interface FindFunctionsResult {
  functions: FunctionMatch[];
  total_found: number;
}

export function findFunctions(params: FindFunctionsParams): FindFunctionsResult {
  const { function_name, directory = '' } = params;
  
  const baseDir = process.cwd();
  const searchDir = directory ? join(baseDir, directory) : baseDir;
  
  const functions: FunctionMatch[] = [];
  
  // Get all assembly files
  const files = getAssemblyFiles(searchDir);
  
  // Look for function definitions and labels
  const functionRegex = new RegExp(`^\\s*([a-zA-Z_][a-zA-Z0-9_]*):?\\s*;?.*${function_name}.*`, 'i');
  const labelRegex = new RegExp(`^\\s*(${function_name}[a-zA-Z0-9_]*):`, 'i');
  const subroutineRegex = new RegExp(`^\\s*([a-zA-Z_][a-zA-Z0-9_]*):.*`, 'i');
  
  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const functionMatch = line.match(functionRegex);
        const labelMatch = line.match(labelRegex);
        const subroutineMatch = line.match(subroutineRegex);
        
        if (functionMatch || labelMatch || (subroutineMatch && line.toLowerCase().includes(function_name.toLowerCase()))) {
          const match = functionMatch || labelMatch || subroutineMatch;
          if (match) {
            // Get context lines around the function
            const contextStart = Math.max(0, index - 2);
            const contextEnd = Math.min(lines.length, index + 5);
            const context = lines.slice(contextStart, contextEnd);
            
            functions.push({
              file: filePath.replace(baseDir + '/', ''),
              line: index + 1,
              name: match[1] || function_name,
              definition: line.trim(),
              context: context
            });
          }
        }
      });
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }
  
  return {
    functions: functions.slice(0, 50), // Limit results
    total_found: functions.length
  };
}

function getAssemblyFiles(dir: string): string[] {
  const files: string[] = [];
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!entry.startsWith('.') && !['node_modules', 'dist'].includes(entry)) {
          files.push(...getAssemblyFiles(fullPath));
        }
      } else if (stat.isFile()) {
        const ext = extname(entry).toLowerCase();
        if (['.asm', '.s', '.inc'].includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Skip directories that can't be read
  }
  
  return files;
}

export function formatFunctionResults(result: FindFunctionsResult): string {
  if (result.total_found === 0) {
    return 'No functions found matching the criteria.';
  }
  
  let output = `Found ${result.total_found} function matches:\n\n`;
  
  result.functions.forEach(func => {
    output += `🔧 ${func.name} in ${func.file}:${func.line}\n`;
    output += `   ${func.definition}\n`;
    
    if (func.context.length > 1) {
      output += `   Context:\n`;
      func.context.forEach((line, index) => {
        const lineNum = func.line - 2 + index;
        const marker = index === 2 ? '→' : ' ';
        output += `   ${lineNum.toString().padStart(4)}${marker} ${line}\n`;
      });
    }
    output += '\n';
  });
  
  if (result.total_found > result.functions.length) {
    output += `... and ${result.total_found - result.functions.length} more matches\n`;
  }
  
  return output;
}