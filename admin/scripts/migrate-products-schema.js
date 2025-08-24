const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// Comprehensive product schema fields with defaults
const getComprehensiveProductSchema = (existingProduct) => {
  return {
    // Core product info (existing)
    _id: existingProduct._id,
    name: existingProduct.name || '',
    description: existingProduct.description || '',
    price: existingProduct.price || 0,
    original_price: existingProduct.original_price || existingProduct.price || 0,
    category: existingProduct.category || '',
    subcategory: existingProduct.subcategory || '',
    stock_quantity: existingProduct.stock_quantity || 0,
    is_active: existingProduct.is_active !== undefined ? existingProduct.is_active : true,
    
    // Image handling (standardize to new format)
    images: existingProduct.images || (existingProduct.image_id ? [existingProduct.image_id] : []),
    primary_image: existingProduct.primary_image || existingProduct.image_id || null,
    image_urls: existingProduct.image_urls || (existingProduct.image_url ? [existingProduct.image_url] : []),
    
    // Product details
    sku: existingProduct.sku || `AST-${Date.now().toString().slice(-6)}`,
    weight: existingProduct.weight || null,
    dimensions: existingProduct.dimensions || {
      length: null,
      width: null,
      height: null
    },
    material: existingProduct.material || '',
    
    // Status and visibility
    status: existingProduct.status || (existingProduct.is_active ? 'active' : 'inactive'),
    is_featured: existingProduct.is_featured || false,
    is_bestseller: existingProduct.is_bestseller || false,
    
    // Ratings and reviews
    rating: existingProduct.rating || "0",
    total_reviews: existingProduct.total_reviews || 0,
    total_sales: existingProduct.total_sales || 0,
    
    // SEO fields
    slug: existingProduct.slug || existingProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    meta_title: existingProduct.meta_title || existingProduct.name,
    meta_description: existingProduct.meta_description || `Buy ${existingProduct.name} online. ${existingProduct.description.substring(0, 100)}...`,
    
    // Tags and categorization
    tags: existingProduct.tags || [],
    
    // Shipping and logistics
    shipping_weight: existingProduct.shipping_weight || existingProduct.weight || 100,
    shipping_cost: existingProduct.shipping_cost || 0,
    free_shipping: existingProduct.free_shipping !== undefined ? existingProduct.free_shipping : false,
    
    // Timestamps
    created_at: existingProduct.created_at || new Date(),
    updated_at: new Date(),
    
    // Additional product info
    brand: existingProduct.brand || 'TrueAstroTalk',
    warranty: existingProduct.warranty || null,
    return_policy: existingProduct.return_policy || '7 days return policy',
    care_instructions: existingProduct.care_instructions || null,
  };
};

async function migrateProductsSchema() {
  let client;
  
  try {
    console.log('🚀 Starting product schema migration...\n');
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URL);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const productsCollection = db.collection('products');
    
    // Get all products
    const allProducts = await productsCollection.find({}).toArray();
    console.log(`📦 Found ${allProducts.length} products to migrate\n`);
    
    // Analyze current schemas
    console.log('📊 CURRENT SCHEMA ANALYSIS:');
    console.log('============================');
    
    const schemaStats = {};
    allProducts.forEach(product => {
      const fieldCount = Object.keys(product).length;
      const hasComprehensiveFields = product.hasOwnProperty('sku') && product.hasOwnProperty('brand');
      const schemaType = hasComprehensiveFields ? 'comprehensive' : 'basic';
      
      if (!schemaStats[schemaType]) {
        schemaStats[schemaType] = { count: 0, fieldCounts: [] };
      }
      schemaStats[schemaType].count++;
      schemaStats[schemaType].fieldCounts.push(fieldCount);
      
      console.log(`  ${product.name}: ${schemaType} (${fieldCount} fields)`);
    });
    
    console.log(`\nSchema Summary:`);
    Object.keys(schemaStats).forEach(type => {
      const stats = schemaStats[type];
      console.log(`  ${type}: ${stats.count} products (avg ${Math.round(stats.fieldCounts.reduce((a,b) => a+b, 0) / stats.fieldCounts.length)} fields)`);
    });
    
    // Migration process
    console.log('\n🔄 MIGRATION PROCESS:');
    console.log('=====================');
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const product of allProducts) {
      const hasComprehensiveFields = product.hasOwnProperty('sku') && product.hasOwnProperty('brand');
      
      if (hasComprehensiveFields) {
        console.log(`  ⏭️  Skipped: ${product.name} (already comprehensive)`);
        skippedCount++;
        continue;
      }
      
      // Migrate to comprehensive schema
      const migratedProduct = getComprehensiveProductSchema(product);
      
      // Remove old image fields to avoid duplication
      const fieldsToRemove = ['image_id', 'image_url'];
      const updateDoc = {
        $set: migratedProduct,
        $unset: {}
      };
      
      fieldsToRemove.forEach(field => {
        if (product.hasOwnProperty(field)) {
          updateDoc.$unset[field] = '';
        }
      });
      
      await productsCollection.updateOne(
        { _id: product._id },
        updateDoc
      );
      
      console.log(`  ✅ Migrated: ${product.name}`);
      console.log(`    - Added ${Object.keys(migratedProduct).length - Object.keys(product).length} new fields`);
      console.log(`    - SKU: ${migratedProduct.sku}`);
      console.log(`    - Images: ${migratedProduct.images.length} IDs, ${migratedProduct.image_urls.length} URLs`);
      
      migratedCount++;
    }
    
    console.log(`\n📊 MIGRATION SUMMARY:`);
    console.log(`=====================`);
    console.log(`✅ Migrated: ${migratedCount} products`);
    console.log(`⏭️  Skipped: ${skippedCount} products (already comprehensive)`);
    console.log(`📦 Total: ${allProducts.length} products`);
    
    // Verification
    console.log('\n🔍 POST-MIGRATION VERIFICATION:');
    console.log('================================');
    
    const verificationProducts = await productsCollection.find({}).toArray();
    const sampleFields = ['name', 'price', 'sku', 'brand', 'images', 'image_urls', 'status', 'is_featured'];
    
    console.log('Sample products after migration:');
    verificationProducts.slice(0, 3).forEach(product => {
      console.log(`\n${product.name}:`);
      sampleFields.forEach(field => {
        const value = product[field];
        const displayValue = Array.isArray(value) ? `[${value.length} items]` : value;
        console.log(`  ${field}: ${displayValue}`);
      });
    });
    
    // Check for consistency
    const allFieldCounts = verificationProducts.map(p => Object.keys(p).length);
    const minFields = Math.min(...allFieldCounts);
    const maxFields = Math.max(...allFieldCounts);
    
    console.log(`\nField count consistency:`);
    console.log(`  Min fields: ${minFields}`);
    console.log(`  Max fields: ${maxFields}`);
    console.log(`  Range: ${maxFields - minFields}`);
    
    if (maxFields - minFields <= 5) {
      console.log('✅ Schema is now consistent across all products!');
    } else {
      console.log('⚠️  Some variation in field counts still exists (normal due to optional fields)');
    }
    
  } catch (error) {
    console.error('❌ Migration Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\n👋 Disconnected from MongoDB');
    }
  }
}

// Run the migration
if (require.main === module) {
  migrateProductsSchema();
}

module.exports = { migrateProductsSchema, getComprehensiveProductSchema };