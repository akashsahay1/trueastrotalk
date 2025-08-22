const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all TypeScript files that need fixing
const getFilesToFix = () => {
  try {
    const output = execSync('npm run build 2>&1 | grep "Warning:\\|Error:" | grep "\\.ts" | head -50', { cwd: __dirname }).toString();
    const lines = output.split('\n').filter(line => line.includes('.ts'));
    const fileSet = new Set();
    
    lines.forEach(line => {
      const match = line.match(/\.\/src\/(.*\.ts)/);
      if (match) {
        fileSet.add('src/' + match[1]);
      }
    });
    
    return Array.from(fileSet);
  } catch (error) {
    console.log('Could not get files from build output, using fallback list');
    return [
      'src/app/api/orders/[id]/route.ts',
      'src/app/api/notifications/preferences/route.ts', 
      'src/app/api/notifications/push/route.ts',
      'src/app/api/notifications/route.ts',
      'src/lib/validation.ts',
      'src/lib/error-handler.ts',
      'src/lib/security.ts'
    ];
  }
};

console.log('Starting comprehensive warning fixes...');

const files = getFilesToFix();
console.log(`Found ${files.length} files to fix:`, files);

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let originalContent = content;
    
    // Fix unused variables in catch blocks
    content = content.replace(/} catch \([^)]+\) {/g, '} catch {');
    
    // Fix unused result assignments
    content = content.replace(/\s+const result = [^;]+;[\s\n]+$/gm, '');
    content = content.replace(/\s+result = [^;]+;[\s\n]+/g, '');
    
    // Remove unused imports - be more selective
    const lines = content.split('\n');
    const filteredLines = lines.filter(line => {
      // Only remove clearly unused imports
      if (line.includes('import') && line.includes('from')) {
        // Check if any of the imports are actually used in the file
        const importMatch = line.match(/import\s*{([^}]+)}/);
        if (importMatch) {
          const imports = importMatch[1].split(',').map(s => s.trim());
          const usedImports = imports.filter(imp => {
            const cleaned = imp.replace(/\s+as\s+\w+/, ''); // Remove alias
            return content.includes(cleaned) && content.split('\n').filter(l => l !== line && l.includes(cleaned)).length > 0;
          });
          
          if (usedImports.length === 0) {
            return false; // Remove entire import line
          } else if (usedImports.length !== imports.length) {
            // Keep only used imports
            line = line.replace(importMatch[1], usedImports.join(', '));
            return true;
          }
        }
      }
      return true;
    });
    content = filteredLines.join('\n');
    
    // Fix prefer-const issues
    content = content.replace(/let (query|updateQuery|result)\s*=/g, 'const $1 =');
    
    // Fix any type annotations with more specific ones
    content = content.replace(/:\s*any\b/g, ': unknown');
    content = content.replace(/any\[\]/g, 'unknown[]');
    content = content.replace(/Record<string,\s*any>/g, 'Record<string, unknown>');
    
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`⚪ No changes: ${filePath}`);
    }
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

console.log('Comprehensive warning fixes completed!');