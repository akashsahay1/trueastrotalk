import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { UploadService } from '@/lib/upload-service';
import { envConfig } from '@/lib/env-config';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// Helper function to convert relative image URLs to full URLs
function getFullImageUrl(request: NextRequest, imageUrl: string | null | undefined): string | null {
  if (!imageUrl || imageUrl.trim() === '') {
    return null;
  }
  
  // If it's already a full URL (starts with http/https), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Get the actual host from the request headers
  const host = request.headers.get('host') || 'localhost:4000';
  const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const baseUrl = `${protocol}://${host}`;
  
  // If it's a relative path, construct full URL
  if (imageUrl.startsWith('/')) {
    return `${baseUrl}${imageUrl}`;
  }
  
  // If it doesn't start with /, add / prefix and then construct full URL  
  return `${baseUrl}/${imageUrl}`;
}

// GET - Fetch all products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const active = searchParams.get('active');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const productsCollection = db.collection('products');

    // Build query
    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (active !== null && active !== undefined) query.is_active = active === 'true';

    // Get products with pagination
    const products = await productsCollection.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalProducts = await productsCollection.countDocuments(query);

    await client.close();

    // Transform products to include full image URLs
    const productsWithFullUrls = products.map(product => ({
      ...product,
      image_url: getFullImageUrl(request, product.image_url)
    }));

    return NextResponse.json({
      success: true,
      products: productsWithFullUrls,
      pagination: {
        total: totalProducts,
        page,
        limit,
        totalPages: Math.ceil(totalProducts / limit)
      }
    });

  } catch(error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching products'
    }, { status: 500 });
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, category, stock_quantity, is_active, image_url } = body;

    // Validate required fields
    if (!name || !price || !category || stock_quantity === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Name, price, category, and stock quantity are required'
      }, { status: 400 });
    }

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const productsCollection = db.collection('products');

    // Check if product with same name already exists
    const existingProduct = await productsCollection.findOne({ name });
    if (existingProduct) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Product already exists',
        message: 'A product with this name already exists'
      }, { status: 409 });
    }

    // Create product document
    const productData = {
      name,
      description: description || '',
      price: parseFloat(price),
      category,
      stock_quantity: parseInt(stock_quantity),
      is_active: is_active !== undefined ? is_active : true,
      image_url: image_url || '',
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await productsCollection.insertOne(productData);
    const productId = result.insertedId.toString();
    
    // If image_url is provided and it's not already in our media library, register it
    if (image_url && image_url.trim() !== '') {
      // Check if this is an external image (not from our uploads folder)
      const isExternalImage = !image_url.startsWith('/uploads/');
      
      if (isExternalImage) {
        // Register external image in media library
        await UploadService.registerExternalImage({
          imageUrl: image_url,
          originalName: `Product image for ${name}`,
          fileType: 'product_image',
          uploadedBy: undefined, // Could be extended to track admin user
          associatedRecord: productId
        });
      } else {
        // For internal images, we should update the existing media record
        // to associate it with this product
        const db = client.db(DB_NAME);
        const mediaCollection = db.collection('media_files');
        
        await mediaCollection.updateOne(
          { file_path: image_url },
          { 
            $set: { 
              file_type: 'product_image',
              associated_record: productId,
              updated_at: new Date()
            }
          }
        );
      }
    }
    
    await client.close();

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product_id: productId
    }, { status: 201 });

  } catch(error) {
    console.error(error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while creating the product'
    }, { status: 500 });
  }
}