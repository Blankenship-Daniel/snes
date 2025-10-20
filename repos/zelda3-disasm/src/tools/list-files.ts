import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

export interface ListFilesParams {
  directory?: string;
  filter?: string;
  recursive?: boolean;
}

export interface FileInfo {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
}

export interface ListFilesResult {
  files: FileInfo[];
  total_count: number;
  directory: string;
}

export function listFiles(params: ListFilesParams): ListFilesResult {
  const { directory = '', filter = '', recursive = false } = params;
  
  const baseDir = process.cwd();
  const targetDir = directory ? join(baseDir, directory) : baseDir;
  
  const files: FileInfo[] = [];
  
  try {
    collectFiles(targetDir, baseDir, filter, recursive, files);
  } catch (error) {
    throw new Error(`Failed to list files in ${targetDir}: ${error}`);
  }
  
  return {
    files: files.sort((a, b) => {
      // Directories first, then files
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    }),
    total_count: files.length,
    directory: directory || '.'
  };
}

function collectFiles(
  dir: string, 
  baseDir: string, 
  filter: string, 
  recursive: boolean, 
  files: FileInfo[]
): void {
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip hidden directories and common build dirs
      if (!entry.startsWith('.') && !['node_modules', 'dist'].includes(entry)) {
        files.push({
          name: entry,
          path: fullPath.replace(baseDir + '/', ''),
          type: 'directory'
        });
        
        if (recursive) {
          collectFiles(fullPath, baseDir, filter, recursive, files);
        }
      }
    } else if (stat.isFile()) {
      const ext = extname(entry).toLowerCase().slice(1); // Remove the dot
      
      // Apply filter if specified
      let shouldInclude = true;
      if (filter) {
        shouldInclude = filter === ext || entry.toLowerCase().includes(filter.toLowerCase());
      }
      
      if (shouldInclude) {
        files.push({
          name: entry,
          path: fullPath.replace(baseDir + '/', ''),
          type: 'file',
          size: stat.size,
          extension: ext
        });
      }
    }
  }
}

export function formatFileList(result: ListFilesResult): string {
  let output = `Directory: ${result.directory}\n`;
  output += `Found ${result.total_count} items:\n\n`;
  
  result.files.forEach(file => {
    const icon = file.type === 'directory' ? '📁' : getFileIcon(file.extension);
    const sizeInfo = file.size ? ` (${formatFileSize(file.size)})` : '';
    
    output += `${icon} ${file.name}${sizeInfo}\n`;
  });
  
  return output;
}

function getFileIcon(extension?: string): string {
  switch (extension) {
    case 'asm':
    case 's':
      return '📝';
    case 'inc':
      return '🔗';
    case 'cfg':
      return '⚙️';
    case 'md':
      return '📄';
    case 'json':
      return '📊';
    default:
      return '📄';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}