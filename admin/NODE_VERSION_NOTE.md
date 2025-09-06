# Node.js Version Compatibility

## Current Issue: Punycode Deprecation Warnings

**Status**: Known issue with Node.js 23+ and Next.js 15.x

### The Problem
When building with Node.js 23+, you may see deprecation warnings like:
```
DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
```

### Why This Happens
- Node.js 23+ deprecated the built-in `punycode` module
- Next.js 15.x and some dependencies still use the deprecated Node.js module
- This affects static page generation during build time

### Recommended Solutions (in order of preference)

1. **Use Node.js 22 LTS** (Recommended)
   ```bash
   nvm install 22
   nvm use 22
   ```

2. **Use Node.js 20 LTS** (Most Stable)
   ```bash
   nvm install 20
   nvm use 20
   ```

3. **Wait for Ecosystem Updates**
   - Next.js team is working on Node.js 23 compatibility
   - MongoDB driver updates are in progress

### Current Mitigations in Place
- ✅ Added userland `punycode` dependency
- ✅ Webpack alias configuration  
- ✅ NPM overrides for dependency resolution
- ⚠️ Warnings still appear during static generation (Node.js runtime level)

### Impact Assessment
- **Build Success**: ✅ Builds complete successfully
- **Runtime Impact**: ✅ No runtime issues
- **Production Impact**: ✅ No production functionality affected
- **Developer Experience**: ⚠️ Warning noise during builds

### Future Resolution
This issue will be automatically resolved when:
- Next.js 16.x is released with Node.js 23 support
- Dependencies update to use userland punycode
- Node.js ecosystem fully transitions

---
**Note**: These warnings are cosmetic and do not affect application functionality.