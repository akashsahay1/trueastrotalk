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

// Helper function to convert relative image URLs to full URLs
function getFullImageUrl(request: NextRequest, imageUrl: string | null | undefined): string | null {
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    return null;
  }
  
  // If it's already a full URL (starts with http/https), return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Get the actual host from the request headers
  const host = request.headers.get('host') || 'www.trueastrotalk.com';
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

    // Transform products to include full image URLs
    const productsWithFullUrls = await Promise.all(
      products.map(async (product) => {
        let imageUrl = null;
        
        // Try multiple fields in order of preference
        if (product.image_id) {
          imageUrl = await resolveMediaUrl(request, product.image_id, client.db(DB_NAME));
        }
        
        if (!imageUrl && product.primary_image) {
          // Check if primary_image is a custom media_id or legacy ObjectId
          if (typeof product.primary_image === 'string' && product.primary_image.startsWith('media_')) {
            imageUrl = await resolveMediaUrl(request, product.primary_image, client.db(DB_NAME));
          } else if (typeof product.primary_image === 'string' && product.primary_image.length === 24) {
            imageUrl = await resolveMediaUrl(request, product.primary_image, client.db(DB_NAME));
          } else {
            imageUrl = getFullImageUrl(request, product.primary_image);
          }
        }
        
        if (!imageUrl && product.images && Array.isArray(product.images) && product.images.length > 0) {
          // Use first image from images array
          const firstImage = product.images[0];
          if (typeof firstImage === 'string' && firstImage.startsWith('media_')) {
            imageUrl = await resolveMediaUrl(request, firstImage, client.db(DB_NAME));
          } else if (typeof firstImage === 'string' && firstImage.length === 24) {
            imageUrl = await resolveMediaUrl(request, firstImage, client.db(DB_NAME));
          } else {
            imageUrl = getFullImageUrl(request, firstImage);
          }
        }
        
        // Fallback to image_urls if we still don't have an image
        if (!imageUrl && product.image_urls && Array.isArray(product.image_urls) && product.image_urls.length > 0) {
          // Use first URL from image_urls array
          const firstUrl = product.image_urls[0];
          // image_urls already contains full URLs, just ensure they're properly formatted
          if (typeof firstUrl === 'string') {
            imageUrl = firstUrl.startsWith('http') ? firstUrl : getFullImageUrl(request, firstUrl);
          }
        }
        
        if (!imageUrl && product.image_url) {
          imageUrl = getFullImageUrl(request, product.image_url);
        }
        
        return {
          ...product,
          image_url: imageUrl,
          // Remove old fields to keep response clean
          image_id: undefined
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
    
    // If image_url is provided, validate it's from our uploads folder
    if (image_url && image_url.trim() !== '') {
      // Only accept internal upload paths
      if (!image_url.startsWith('/uploads/')) {
        await client.close();
        return NextResponse.json({
          success: false,
          error: 'Invalid image URL',
          message: 'Only uploaded images are allowed. External URLs are not supported.'
        }, { status: 400 });
      }
      
      // Update the existing media record to associate it with this product
      const db = client.db(DB_NAME);
      const mediaCollection = db.collection('media');
      
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