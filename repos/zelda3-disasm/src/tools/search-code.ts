import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

export interface CodeSearchParams {
  query: string;
  directory?: string;
  file_type?: string;
}

export interface SearchResult {
  file: string;
  line: number;
  content: string;
  match: string;
}

export interface CodeSearchResult {
  results: SearchResult[];
  total_matches: number;
  files_searched: number;
}

export function searchCode(params: CodeSearchParams): CodeSearchResult {
  const { query, directory = '', file_type = '' } = params;
  
  const baseDir = process.cwd();
  const searchDir = directory ? join(baseDir, directory) : baseDir;
  
  const results: SearchResult[] = [];
  let filesSearched = 0;
  
  // Get all assembly files to search
  const filesToSearch = getFilesToSearch(searchDir, file_type);
  
  const queryRegex = new RegExp(query, 'gi');
  
  for (const filePath of filesToSearch) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const matches = line.match(queryRegex);
        if (matches) {
          matches.forEach(match => {
            results.push({
              file: filePath.replace(baseDir + '/', ''),
              line: index + 1,
              content: line.trim(),
              match: match
            });
          });
        }
      });
      
      filesSearched++;
    } catch (error) {
      // Skip files that can't be read
      continue;
    }
  }
  
  return {
    results: results.slice(0, 100), // Limit results
    total_matches: results.length,
    files_searched: filesSearched
  };
}

function getFilesToSearch(dir: string, fileType: string): string[] {
  const files: string[] = [];
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip hidden directories and common build dirs
        if (!entry.startsWith('.') && !['node_modules', 'dist'].includes(entry)) {
          files.push(...getFilesToSearch(fullPath, fileType));
        }
      } else if (stat.isFile()) {
        const ext = extname(entry).toLowerCase();
        
        // Filter by file type if specified
        if (fileType) {
          if (fileType === 'asm' && ['.asm', '.s'].includes(ext)) {
            files.push(fullPath);
          } else if (fileType === 'inc' && ext === '.inc') {
            files.push(fullPath);
          } else if (fileType === 'cfg' && ext === '.cfg') {
            files.push(fullPath);
          }
        } else {
          // Default: search assembly and include files
          if (['.asm', '.s', '.inc', '.cfg'].includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    }
  } catch (error) {
    // Skip directories that can't be read
  }
  
  return files;
}

export function formatSearchResults(result: CodeSearchResult): string {
  if (result.total_matches === 0) {
    return 'No matches found.';
  }
  
  let output = `Found ${result.total_matches} matches in ${result.files_searched} files:\n\n`;
  
  result.results.forEach(match => {
    output += `📁 ${match.file}:${match.line}\n`;
    output += `   ${match.content}\n\n`;
  });
  
  if (result.total_matches > result.results.length) {
    output += `... and ${result.total_matches - result.results.length} more matches (showing first ${result.results.length})\n`;
  }
  
  return output;
}