import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { UploadService } from '@/lib/upload-service';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// Helper function to resolve media ID to full URL
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveMediaUrl(request: NextRequest, mediaId: string | ObjectId | null | undefined, db: any): Promise<string | null> {
  if (!mediaId) return null;
  
  try {
    let mediaFile;
    
    // Check if it's our custom media ID format (media_timestamp_random)
    if (typeof mediaId === 'string' && mediaId.startsWith('media_')) {
      mediaFile = await db.collection('media').findOne({ media_id: mediaId });
    } else if (typeof mediaId === 'string' && mediaId.length === 24) {
      // Fallback: try as ObjectId for backward compatibility
      try {
        mediaFile = await db.collection('media').findOne({ _id: new ObjectId(mediaId) });
        // If not found by _id, try by media_id (in case it's actually a media_id)
        if (!mediaFile) {
          mediaFile = await db.collection('media').findOne({ media_id: mediaId });
        }
      } catch {
        // If ObjectId conversion fails, try as media_id
        mediaFile = await db.collection('media').findOne({ media_id: mediaId });
      }
    } else {
      // Try to find by _id if it's an ObjectId instance
      mediaFile = await db.collection('media').findOne({ _id: mediaId });
    }
    
    if (!mediaFile || !mediaFile.file_path) return null;
    
    // Get the actual host from the request headers
    const host = request.headers.get('host') || 'www.trueastrotalk.com';
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = `${protocol}://${host}`;
    
    return `${baseUrl}${mediaFile.file_path}`;
  } catch (error) {
    console.error('Error resolving media URL:', error);
    return null;
  }
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

    // Transform products to include full image URLs
    const productsWithFullUrls = await Promise.all(
      products.map(async (product) => {
        // Resolve featured image from image_id (media_id)
        const imageUrl = product.image_id ? 
          await resolveMediaUrl(request, product.image_id, client.db(DB_NAME)) : null;
        
        // Resolve gallery images from images array (array of media_ids)
        const galleryImages = [];
        if (product.images && Array.isArray(product.images)) {
          for (const mediaId of product.images) {
            const url = await resolveMediaUrl(request, mediaId, client.db(DB_NAME));
            if (url) galleryImages.push(url);
          }
        }
        
        return {
          ...product,
          featured_image: imageUrl, // Resolved featured image URL
          gallery_images: galleryImages, // Resolved gallery image URLs
          // Keep the media_ids for reference
          image_id: product.image_id,
          images: product.images || []
        };
      })
    );

    await client.close();

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
    const { name, description, price, category, stock_quantity, is_active, image_id } = body;

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
      image_id: image_id || null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await productsCollection.insertOne(productData);
    const productId = result.insertedId.toString();
    
    // If image_id is provided, validate it exists in media collection
    if (image_id && image_id.trim() !== '') {
      const mediaCollection = db.collection('media');
      
      let mediaExists = null;
      if (image_id.startsWith('media_')) {
        // Check for media_id format
        mediaExists = await mediaCollection.findOne({ media_id: image_id });
      } else if (ObjectId.isValid(image_id)) {
        // Check for ObjectId format
        mediaExists = await mediaCollection.findOne({ _id: new ObjectId(image_id) });
      }
      
      if (!mediaExists) {
        await client.close();
        return NextResponse.json({
          success: false,
          error: 'Invalid image ID',
          message: 'The provided image ID does not exist in media library.'
        }, { status: 400 });
      }
      
      // Update the media record to associate it with this product
      await mediaCollection.updateOne(
        image_id.startsWith('media_') ? { media_id: image_id } : { _id: new ObjectId(image_id) },
        { 
          $set: { 
            file_type: 'product_image',
            associated_record: productId,
            updated_at: new Date()
          } 
        }
      );
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