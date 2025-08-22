const fs = require('fs');
const path = require('path');

// Files that need specific fixes based on lint output
const specificFixes = {
  'src/app/api/chat/route.ts': [
    { remove: 'JWTSecurity' },
    { remove: 'ValidationSchemas' }
  ],
  'src/app/api/notifications/route.ts': [
    { pattern: 'Record<string, unknown>', replace: 'Record<string, unknown>' },
    { pattern: 'let updateQuery =', replace: 'const updateQuery =' }
  ],
  'src/app/api/orders/route.ts': [
    { remove: 'JWTSecurity' },
    { remove: 'SecurityMiddleware' },
    { remove: 'InputSanitizer' },
    { remove: 'ValidationSchemas' }
  ],
  'src/app/api/payments/razorpay/create-order/route.ts': [
    { remove: 'JWTSecurity' },
    { remove: 'ValidationSchemas' }
  ],
  'src/app/api/payments/razorpay/verify/route.ts': [
    { remove: 'JWTSecurity' }
  ],
  'src/app/api/socket/route.ts': [
    { remove: 'JWTSecurity' },
    { pattern: 'authenticatedUser = ', replace: '// authenticatedUser = ' }
  ]
};

function removeUnusedImport(content, importName) {
  // Remove from import list
  const importRegex = new RegExp(`import\\s*{([^}]*)}\\s*from`, 'g');
  content = content.replace(importRegex, (match, imports) => {
    const cleanedImports = imports
      .split(',')
      .map(imp => imp.trim())
      .filter(imp => !imp.includes(importName))
      .join(', ');
    
    if (cleanedImports.trim() === '') {
      return 'import'; // Will be cleaned up later
    }
    return `import { ${cleanedImports} } from`;
  });

  // Remove empty import lines
  content = content.replace(/import\s*from[^;]*;?\n?/g, '');
  
  return content;
}

function fixUnusedResults(content) {
  // Remove unused result assignments at the end of functions
  content = content.replace(/\s*const result = [^;]+;\s*\n\s*await client\.close\(\);/g, '\n    await client.close();');
  content = content.replace(/\s*result = [^;]+;\s*\n\s*await client\.close\(\);/g, '\n    await client.close();');
  
  return content;
}

console.log('Running final comprehensive fixes...');

Object.entries(specificFixes).forEach(([filePath, fixes]) => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;
    
    fixes.forEach(fix => {
      if (fix.remove) {
        const newContent = removeUnusedImport(content, fix.remove);
        if (newContent !== content) {
          content = newContent;
          changed = true;
        }
      }
      
      if (fix.pattern && fix.replace) {
        if (content.includes(fix.pattern)) {
          content = content.replace(new RegExp(fix.pattern, 'g'), fix.replace);
          changed = true;
        }
      }
    });
    
    // Apply general fixes
    const fixedContent = fixUnusedResults(content);
    if (fixedContent !== content) {
      content = fixedContent;
      changed = true;
    }
    
    if (changed) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`⚪ No changes: ${filePath}`);
    }
  } else {
    console.log(`❌ File not found: ${filePath}`);
  }
});

// Fix products routes
const productRoutes = [
  'src/app/api/products/[id]/route.ts',
  'src/app/api/products/route.ts'
];

productRoutes.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    const fixedContent = fixUnusedResults(content);
    
    if (fixedContent !== content) {
      fs.writeFileSync(fullPath, fixedContent);
      console.log(`✅ Fixed unused results: ${filePath}`);
    }
  }
});

console.log('Final fixes completed!');