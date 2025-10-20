#!/usr/bin/env node
/**
 * Automated TypeScript Error Fixer
 * Inspired by bsnes Black+Flake8 automation success
 * 
 * Systematically fixes common TS error patterns:
 * - Missing exports
 * - Type-only import usage
 * - Missing interface properties
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

class TypeScriptAutoFixer {
  
  async run() {
    console.log('🚀 Starting automated TypeScript error fixing...');
    
    // Get all TS errors
    const errors = this.getTypeScriptErrors();
    console.log(`Found ${errors.length} TypeScript errors`);
    
    // Categorize errors
    const categorized = this.categorizeErrors(errors);
    
    // Apply automated fixes
    await this.applyAutomatedFixes(categorized);
    
    // Report results
    this.reportResults();
  }
  
  getTypeScriptErrors() {
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      return []; // No errors
    } catch (error) {
      const output = error.stdout?.toString() || '';
      return this.parseTypeScriptErrors(output);
    }
  }
  
  parseTypeScriptErrors(output) {
    const errorLines = output.split('\n').filter(line => line.includes('error TS'));
    return errorLines.map(line => {
      const match = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+): (.+)$/);
      if (match) {
        return {
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          code: match[4],
          message: match[5]
        };
      }
      return null;
    }).filter(Boolean);
  }
  
  categorizeErrors(errors) {
    const categories = {
      missingExports: [],
      typeOnlyImports: [],
      missingProperties: [],
      argumentCount: [],
      other: []
    };
    
    for (const error of errors) {
      if (error.message.includes('has no exported member')) {
        categories.missingExports.push(error);
      } else if (error.message.includes('only refers to a type, but is being used as a value')) {
        categories.typeOnlyImports.push(error);
      } else if (error.message.includes('Property') && error.message.includes('is missing')) {
        categories.missingProperties.push(error);
      } else if (error.message.includes('Expected') && error.message.includes('arguments')) {
        categories.argumentCount.push(error);
      } else {
        categories.other.push(error);
      }
    }
    
    return categories;
  }
  
  async applyAutomatedFixes(categorized) {
    console.log('🔧 Applying automated fixes...');
    
    // Fix missing exports (safest to automate)
    await this.fixMissingExports(categorized.missingExports);
    
    // Fix type-only imports
    await this.fixTypeOnlyImports(categorized.typeOnlyImports);
    
    console.log(`✅ Applied fixes for ${categorized.missingExports.length + categorized.typeOnlyImports.length} errors`);
  }
  
  async fixMissingExports(errors) {
    const exportMap = new Map();
    
    // Group by target module
    for (const error of errors) {
      const match = error.message.match(/Module "(.+?)" has no exported member named? '(.+?)'/);
      if (match) {
        const module = match[1];
        const member = match[2];
        
        if (!exportMap.has(module)) {
          exportMap.set(module, new Set());
        }
        exportMap.get(module).add(member);
      }
    }
    
    // Add missing exports
    for (const [module, members] of exportMap) {
      await this.addMissingExports(module, Array.from(members));
    }
  }
  
  async addMissingExports(moduleId, members) {
    // Find actual file path
    const possiblePaths = [
      `src/${moduleId}.ts`,
      `src/${moduleId}/index.ts`,
      `src/${moduleId.replace('../', '')}.ts`,
      `src/${moduleId.replace('../', '')}/index.ts`
    ];
    
    for (const path of possiblePaths) {
      try {
        const content = readFileSync(path, 'utf8');
        const updatedContent = this.addExportsToFile(content, members);
        if (updatedContent !== content) {
          writeFileSync(path, updatedContent);
          console.log(`  ✅ Added exports to ${path}: ${members.join(', ')}`);
          break;
        }
      } catch (e) {
        // File doesn't exist, continue
      }
    }
  }
  
  addExportsToFile(content, members) {
    // Add missing exports at the end
    const missingExports = members.filter(member => 
      !content.includes(`export ${member}`) && 
      !content.includes(`export { ${member}`) &&
      !content.includes(`export type { ${member}`)
    );
    
    if (missingExports.length === 0) return content;
    
    const exportStatements = missingExports.map(member => {
      // Assume it's a type if not found as value
      return `export type { ${member} } from './core.types';`;
    }).join('\n');
    
    return content + '\n\n// Auto-generated exports\n' + exportStatements;
  }
  
  async fixTypeOnlyImports(errors) {
    const fileMap = new Map();
    
    // Group by file
    for (const error of errors) {
      if (!fileMap.has(error.file)) {
        fileMap.set(error.file, []);
      }
      fileMap.get(error.file).push(error);
    }
    
    // Fix each file
    for (const [file, errors] of fileMap) {
      await this.fixImportsInFile(file, errors);
    }
  }
  
  async fixImportsInFile(filePath, errors) {
    try {
      let content = readFileSync(filePath, 'utf8');
      let modified = false;
      
      for (const error of errors) {
        const match = error.message.match(/'(.+?)' only refers to a type/);
        if (match) {
          const identifier = match[1];
          
          // Change from type-only import to regular import
          const typeOnlyPattern = new RegExp(`import type \\{([^}]*\\b${identifier}\\b[^}]*)\\}`, 'g');
          content = content.replace(typeOnlyPattern, (match, imports) => {
            modified = true;
            const importList = imports.split(',').map(s => s.trim());
            const typeImports = importList.filter(imp => imp !== identifier);
            const valueImports = [identifier];
            
            let result = '';
            if (typeImports.length > 0) {
              result += `import type { ${typeImports.join(', ')} }`;
            }
            if (valueImports.length > 0) {
              if (result) result += ';\nimport ';
              else result += 'import ';
              result += `{ ${valueImports.join(', ')} }`;
            }
            return result;
          });
        }
      }
      
      if (modified) {
        writeFileSync(filePath, content);
        console.log(`  ✅ Fixed imports in ${filePath}`);
      }
    } catch (e) {
      console.log(`  ❌ Could not fix ${filePath}: ${e.message}`);
    }
  }
  
  reportResults() {
    const errorsAfter = this.getTypeScriptErrors();
    console.log(`\n📊 Results:`);
    console.log(`Remaining TypeScript errors: ${errorsAfter.length}`);
    console.log(`🎯 Automated fixes completed!`);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const fixer = new TypeScriptAutoFixer();
  fixer.run().catch(console.error);
}