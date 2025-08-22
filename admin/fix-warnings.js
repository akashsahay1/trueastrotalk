const fs = require('fs');
const path = require('path');

// Files to fix
const files = [
  'src/app/api/chat/messages/route.ts',
  'src/app/api/chat/route.ts',
  'src/app/api/notifications/preferences/route.ts',
  'src/app/api/notifications/push/route.ts',
  'src/app/api/notifications/route.ts',
  'src/app/api/orders/[id]/route.ts',
  'src/app/api/orders/route.ts',
  'src/app/api/payments/razorpay/create-order/route.ts',
  'src/app/api/payments/razorpay/verify/route.ts',
  'src/app/api/products/[id]/route.ts',
  'src/app/api/products/route.ts',
  'src/app/api/socket/route.ts',
  'src/app/api/users/profile/route.ts',
];

// Common fixes
const fixes = [
  // Remove unused imports
  { pattern: /^import.*JWTSecurity.*from.*$\n?/gm, replacement: '' },
  { pattern: /^import.*SecurityMiddleware.*from.*$\n?/gm, replacement: '' },
  { pattern: /^import.*ValidationSchemas.*from.*$\n?/gm, replacement: '' },
  { pattern: /^import.*NotificationService.*from.*$\n?/gm, replacement: '' },
  { pattern: /^import.*NotificationType.*from.*$\n?/gm, replacement: '' },
  { pattern: /^import.*NotificationPriority.*from.*$\n?/gm, replacement: '' },
  { pattern: /^import.*NotificationChannel.*from.*$\n?/gm, replacement: '' },
  { pattern: /^import.*DatabaseService.*from.*$\n?/gm, replacement: '' },
  { pattern: /^import.*InputSanitizer.*from.*$\n?/gm, replacement: '' },
  
  // Fix unused variables
  { pattern: /} catch \(authError\) {/g, replacement: '} catch {' },
  { pattern: /} catch \(error\) {/g, replacement: '} catch {' },
  { pattern: /} catch \(tokenError\) {/g, replacement: '} catch {' },
  
  // Fix let to const where appropriate
  { pattern: /let result =/g, replacement: 'const result =' },
  { pattern: /let updateQuery =/g, replacement: 'const updateQuery =' },
  { pattern: /let query =/g, replacement: 'const query =' },
];

console.log('Starting warning fixes...');

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;
    
    fixes.forEach(fix => {
      if (fix.pattern.test(content)) {
        content = content.replace(fix.pattern, fix.replacement);
        changed = true;
      }
    });
    
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

console.log('Warning fixes completed!');