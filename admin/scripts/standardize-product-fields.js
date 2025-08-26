#!/usr/bin/env node

/**
 * Script to standardize all product documents to have the same fields
 * Missing fields will be added with appropriate default values (null, empty string, 0, etc.)
 */

const { MongoClient } = require('mongodb');

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// Define the standard product schema with default values
const PRODUCT_SCHEMA = {
  // Basic Information
  name: '',
  description: '',
  price: 0,
  original_price: 0,
  
  // Categorization
  category: '',
  subcategory: '',
  brand: 'TrueAstroTalk',
  
  // Inventory
  sku: '',
  stock_quantity: 0,
  weight: null,
  dimensions: {
    length: null,
    width: null,
    height: null
  },
  
  // Product Details
  material: '',
  tags: [],
  
  // Status Flags
  status: 'active',
  is_active: true,
  is_featured: false,
  is_bestseller: false,
  
  // Media
  image_id: null,
  images: [],
  
  // SEO
  slug: '',
  meta_title: '',
  meta_description: '',
  
  // Ratings & Reviews
  rating: '0',
  total_reviews: 0,
  total_sales: 0,
  
  // Shipping
  shipping_weight: 0,
  shipping_cost: 0,
  free_shipping: false,
  
  // Policies
  warranty: null,
  return_policy: '7 days return policy',
  care_instructions: null,
  
  // Timestamps
  created_at: new Date(),
  updated_at: new Date()
};

async function standardizeProducts(db) {
  console.log('📦 Starting product field standardization...\n');
  
  const productsCollection = db.collection('products');
  const products = await productsCollection.find({}).toArray();
  
  console.log(`Found ${products.length} products to standardize\n`);
  
  let updatedCount = 0;
  let fieldsAddedTotal = 0;
  
  for (const product of products) {
    const updates = {};
    let fieldsAdded = 0;
    
    // Check each field in the schema
    for (const [field, defaultValue] of Object.entries(PRODUCT_SCHEMA)) {
      if (!(field in product)) {
        // Field is missing, add it with default value
        if (field === 'created_at' && !product.created_at) {
          // Use existing updated_at or current date for created_at if missing
          updates[field] = product.updated_at || new Date();
        } else if (field === 'updated_at') {
          // Always update the updated_at to current time
          updates[field] = new Date();
        } else if (field === 'slug' && !product.slug) {
          // Generate slug from name if missing
          updates[field] = product.name ? product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : '';
        } else if (field === 'meta_title' && !product.meta_title) {
          // Use product name as meta_title if missing
          updates[field] = product.name || '';
        } else if (field === 'meta_description' && !product.meta_description) {
          // Generate basic meta description if missing
          updates[field] = product.description ? 
            `Buy ${product.name} online. ${product.description.substring(0, 100)}...` : '';
        } else if (field === 'sku' && !product.sku) {
          // Generate SKU if missing
          updates[field] = `AST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        } else {
          // Use the default value from schema
          updates[field] = defaultValue;
        }
        fieldsAdded++;
      } else if (field === 'dimensions') {
        // Special handling for dimensions - ensure it has all sub-fields
        const dims = product.dimensions || {};
        if (!dims.length || !dims.width || !dims.height) {
          updates.dimensions = {
            length: dims.length || null,
            width: dims.width || null,
            height: dims.height || null
          };
          fieldsAdded++;
        }
      } else if (field === 'tags' && !Array.isArray(product.tags)) {
        // Ensure tags is always an array
        updates.tags = [];
        fieldsAdded++;
      } else if (field === 'images' && !Array.isArray(product.images)) {
        // Ensure images is always an array
        updates.images = [];
        fieldsAdded++;
      }
    }
    
    // Apply updates if there are any
    if (Object.keys(updates).length > 0) {
      await productsCollection.updateOne(
        { _id: product._id },
        { $set: updates }
      );
      
      console.log(`✅ Updated "${product.name}"`);
      console.log(`   Added ${fieldsAdded} missing fields`);
      
      updatedCount++;
      fieldsAddedTotal += fieldsAdded;
    } else {
      console.log(`⏭️  Skipped "${product.name}" - all fields present`);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Products updated: ${updatedCount}`);
  console.log(`   Total fields added: ${fieldsAddedTotal}`);
  console.log(`   Products already complete: ${products.length - updatedCount}`);
}

async function verifyStandardization(db) {
  console.log('\n🔍 Verifying field standardization...\n');
  
  const productsCollection = db.collection('products');
  const schemaFields = Object.keys(PRODUCT_SCHEMA).sort();
  
  // Check a few random products
  const sampleProducts = await productsCollection.aggregate([
    { $sample: { size: 3 } }
  ]).toArray();
  
  console.log('Sample products field check:');
  for (const product of sampleProducts) {
    const productFields = Object.keys(product).filter(k => k !== '_id').sort();
    const missingFields = schemaFields.filter(f => !productFields.includes(f));
    
    console.log(`\n"${product.name}":`);
    console.log(`  Total fields: ${productFields.length + 1} (including _id)`);
    
    if (missingFields.length > 0) {
      console.log(`  ❌ Missing fields: ${missingFields.join(', ')}`);
    } else {
      console.log(`  ✅ All standard fields present`);
    }
  }
  
  // Check if any product is missing any field
  console.log('\n📈 Field coverage analysis:');
  for (const field of schemaFields) {
    const count = await productsCollection.countDocuments({
      [field]: { $exists: true }
    });
    
    if (count < 51) { // Assuming 51 total products
      console.log(`  ⚠️  "${field}": ${count}/51 products have this field`);
    }
  }
  
  // Count products with all fields
  const queryObj = {};
  schemaFields.forEach(field => {
    queryObj[field] = { $exists: true };
  });
  
  const completeProducts = await productsCollection.countDocuments(queryObj);
  console.log(`\n✅ Products with all standard fields: ${completeProducts}/51`);
}

async function main() {
  const client = new MongoClient(MONGODB_URL);
  
  try {
    console.log('🚀 Starting product field standardization...');
    console.log(`   MongoDB: ${MONGODB_URL}`);
    console.log(`   Database: ${DB_NAME}\n`);
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Step 1: Standardize all products
    await standardizeProducts(db);
    
    // Step 2: Verify standardization
    await verifyStandardization(db);
    
    console.log('\n✅ Field standardization completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Standardization failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the standardization
main().catch(console.error);