import { readFileSync } from 'fs';
import { join } from 'path';

export interface ReadSourceParams {
  file_path: string;
  start_line?: number;
  end_line?: number;
}

export interface ReadSourceResult {
  content: string;
  total_lines: number;
  file_path: string;
}

export function readSourceFile(params: ReadSourceParams): ReadSourceResult {
  const { file_path, start_line = 1, end_line } = params;
  
  const baseDir = process.cwd();
  const fullPath = join(baseDir, file_path);
  
  try {
    const content = readFileSync(fullPath, 'utf-8');
    const lines = content.split('\n');
    
    const startIdx = Math.max(0, start_line - 1);
    const endIdx = end_line ? Math.min(lines.length, end_line) : lines.length;
    
    const selectedLines = lines.slice(startIdx, endIdx);
    const numberedLines = selectedLines.map((line, index) => {
      const lineNum = startIdx + index + 1;
      return `${lineNum.toString().padStart(6)}→${line}`;
    });
    
    return {
      content: numberedLines.join('\n'),
      total_lines: lines.length,
      file_path: file_path
    };
  } catch (error) {
    throw new Error(`Failed to read file ${file_path}: ${error}`);
  }
}

export function formatSourceFileContent(result: ReadSourceResult): string {
  return `File: ${result.file_path} (${result.total_lines} total lines)\n\n${result.content}`;
}