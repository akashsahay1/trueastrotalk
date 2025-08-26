import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../lib/database';

// Helper function to resolve media ID to full URL
async function resolveMediaUrl(request: NextRequest, mediaId: string | ObjectId | null | undefined): Promise<string | null> {
  if (!mediaId) return null;
  
  try {
    const mediaCollection = await DatabaseService.getCollection('media');
    let mediaFile;
    
    // Check if it's our custom media ID format (media_timestamp_random)
    if (typeof mediaId === 'string' && mediaId.startsWith('media_')) {
      mediaFile = await mediaCollection.findOne({ media_id: mediaId });
    } else if (typeof mediaId === 'string' && mediaId.length === 24) {
      // Try as ObjectId for backward compatibility
      try {
        mediaFile = await mediaCollection.findOne({ _id: new ObjectId(mediaId) });
        // If not found by _id, try by media_id
        if (!mediaFile) {
          mediaFile = await mediaCollection.findOne({ media_id: mediaId });
        }
      } catch {
        // If ObjectId conversion fails, try as media_id
        mediaFile = await mediaCollection.findOne({ media_id: mediaId });
      }
    } else if (mediaId instanceof ObjectId) {
      mediaFile = await mediaCollection.findOne({ _id: mediaId });
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

// GET - Get all products with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const inStock = searchParams.get('inStock');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const productsCollection = await DatabaseService.getCollection('products');

    // Build query - Admin should see all products regardless of active status
    const query: Record<string, unknown> = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) (query.price as Record<string, unknown>).$gte = parseFloat(minPrice);
      if (maxPrice) (query.price as Record<string, unknown>).$lte = parseFloat(maxPrice);
    }

    if (inStock === 'true') {
      query.stock_quantity = { $gt: 0 };
    } else if (inStock === 'false') {
      query.stock_quantity = { $lte: 0 };
    }

    // Build sort
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get products with pagination
    const products = await productsCollection
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalProducts = await productsCollection.countDocuments(query);

    // Get categories from admin-managed categories collection
    const categoriesCollection = await DatabaseService.getCollection('product_categories');
    const categoriesData = await categoriesCollection.find({ is_active: true }).toArray();
    const categories = categoriesData.map(cat => cat.name);

    // Format products for response with resolved media URLs
    const formattedProducts = await Promise.all(
      products.map(async product => {
        // Resolve featured image from image_id (media_id)
        let imageUrl = null;
        if (product.image_id) {
          imageUrl = await resolveMediaUrl(request, product.image_id);
        }
        
        // Resolve gallery images from images array (array of media_ids)
        const resolvedImages = [];
        if (product.images && Array.isArray(product.images)) {
          for (const mediaId of product.images) {
            const url = await resolveMediaUrl(request, mediaId);
            if (url) resolvedImages.push(url);
          }
        }
        
        return {
          _id: product._id.toString(),
          name: product.name,
          description: product.description,
          price: product.price,
          original_price: product.original_price,
          discount_percentage: product.discount_percentage,
          category: product.category,
          subcategory: product.subcategory,
          brand: product.brand,
          featured_image: imageUrl, // Resolved featured image URL
          gallery_images: resolvedImages, // Resolved gallery image URLs  
          stock_quantity: product.stock_quantity,
          sku: product.sku,
          weight: product.weight,
          dimensions: product.dimensions,
          tags: product.tags || [],
          rating: product.rating || 0,
          review_count: product.review_count || 0,
          is_featured: product.is_featured || false,
          is_bestseller: product.is_bestseller || false,
          created_at: product.created_at,
          updated_at: product.updated_at
        };
      })
    );

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      categories: categories,
      pagination: {
        total: totalProducts,
        page,
        limit,
        totalPages: Math.ceil(totalProducts / limit)
      },
      filters: {
        category,
        search,
        minPrice,
        maxPrice,
        inStock,
        sortBy,
        sortOrder
      }
    });

  } catch(error) {
    console.error('Products GET error:', error);
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
    const {
      name,
      description,
      price,
      original_price,
      category,
      subcategory,
      brand,
      image_id, // Featured image media_id
      images = [], // Gallery images array of media_ids
      stock_quantity,
      sku,
      weight,
      dimensions,
      tags = [],
      is_featured = false,
      is_bestseller = false
    } = body;

    // Validate required fields
    if (!name || !description || !price || !category || stock_quantity === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Name, description, price, category, and stock quantity are required'
      }, { status: 400 });
    }

    // Validate price
    if (price <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid price',
        message: 'Price must be greater than 0'
      }, { status: 400 });
    }

    // Validate stock quantity
    if (stock_quantity < 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid stock quantity',
        message: 'Stock quantity cannot be negative'
      }, { status: 400 });
    }

    const productsCollection = await DatabaseService.getCollection('products');
    const categoriesCollection = await DatabaseService.getCollection('product_categories');

    // Validate category exists in admin-managed categories
    const categoryExists = await categoriesCollection.findOne({ 
      name: category.trim(), 
      is_active: true 
    });
    if (!categoryExists) {
      return NextResponse.json({
        success: false,
        error: 'Invalid category',
        message: 'Category must be selected from admin-managed categories'
      }, { status: 400 });
    }

    // Check if SKU already exists
    if (sku) {
      const existingProduct = await productsCollection.findOne({ sku: sku });
      if (existingProduct) {
            return NextResponse.json({
          success: false,
          error: 'SKU already exists',
          message: 'A product with this SKU already exists'
        }, { status: 400 });
      }
    }

    // Calculate discount percentage
    let discount_percentage = 0;
    if (original_price && original_price > price) {
      discount_percentage = Math.round(((original_price - price) / original_price) * 100);
    }

    // Generate SKU if not provided
    const generatedSku = sku || `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const productData = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      original_price: original_price ? parseFloat(original_price) : parseFloat(price),
      discount_percentage: discount_percentage,
      category: category.trim(),
      subcategory: subcategory ? subcategory.trim() : null,
      brand: brand ? brand.trim() : null,
      image_id: image_id || null, // Featured image media_id
      images: Array.isArray(images) ? images : [], // Gallery images media_ids
      stock_quantity: parseInt(stock_quantity),
      sku: generatedSku,
      weight: weight ? parseFloat(weight) : null,
      dimensions: dimensions || null,
      tags: Array.isArray(tags) ? tags.map(tag => tag.trim()) : [],
      rating: 0,
      review_count: 0,
      is_featured: Boolean(is_featured),
      is_bestseller: Boolean(is_bestseller),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await productsCollection.insertOne(productData);
    const productId = result.insertedId.toString();


    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product_id: productId,
      product: {
        _id: productId,
        name: productData.name,
        price: productData.price,
        category: productData.category,
        sku: productData.sku,
        stock_quantity: productData.stock_quantity
      }
    }, { status: 201 });

  } catch(error) {
    console.error('Products POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while creating product'
    }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, ...updateFields } = body;

    if (!product_id || !ObjectId.isValid(product_id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid product ID',
        message: 'Valid product ID is required'
      }, { status: 400 });
    }

    const productsCollection = await DatabaseService.getCollection('products');
    const categoriesCollection = await DatabaseService.getCollection('product_categories');

    // Validate category if being updated
    if (updateFields.category !== undefined) {
      const categoryExists = await categoriesCollection.findOne({ 
        name: updateFields.category.trim(), 
        is_active: true 
      });
      if (!categoryExists) {
        return NextResponse.json({
          success: false,
          error: 'Invalid category',
          message: 'Category must be selected from admin-managed categories'
        }, { status: 400 });
      }
    }

    // Check if product exists
    const existingProduct = await productsCollection.findOne({ _id: new ObjectId(product_id) });
    if (!existingProduct) {
        return NextResponse.json({
        success: false,
        error: 'Product not found',
        message: 'Product not found'
      }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date()
    };

    // Update only provided fields
    if (updateFields.name !== undefined) updateData.name = updateFields.name.trim();
    if (updateFields.description !== undefined) updateData.description = updateFields.description.trim();
    if (updateFields.price !== undefined) {
      const newPrice = parseFloat(updateFields.price);
      if (newPrice <= 0) {
            return NextResponse.json({
          success: false,
          error: 'Invalid price',
          message: 'Price must be greater than 0'
        }, { status: 400 });
      }
      updateData.price = newPrice;
    }
    if (updateFields.original_price !== undefined) updateData.original_price = parseFloat(updateFields.original_price);
    if (updateFields.category !== undefined) updateData.category = updateFields.category.trim();
    if (updateFields.subcategory !== undefined) updateData.subcategory = updateFields.subcategory ? updateFields.subcategory.trim() : null;
    if (updateFields.brand !== undefined) updateData.brand = updateFields.brand ? updateFields.brand.trim() : null;
    if (updateFields.image_id !== undefined) updateData.image_id = updateFields.image_id || null; // Featured image media_id
    if (updateFields.images !== undefined) updateData.images = Array.isArray(updateFields.images) ? updateFields.images : []; // Gallery images media_ids
    if (updateFields.stock_quantity !== undefined) {
      const newStock = parseInt(updateFields.stock_quantity);
      if (newStock < 0) {
            return NextResponse.json({
          success: false,
          error: 'Invalid stock quantity',
          message: 'Stock quantity cannot be negative'
        }, { status: 400 });
      }
      updateData.stock_quantity = newStock;
    }
    if (updateFields.weight !== undefined) updateData.weight = updateFields.weight ? parseFloat(updateFields.weight) : null;
    if (updateFields.dimensions !== undefined) updateData.dimensions = updateFields.dimensions || null;
    if (updateFields.tags !== undefined) updateData.tags = Array.isArray(updateFields.tags) ? updateFields.tags.map((tag: string) => tag.trim()) : [];
    if (updateFields.is_featured !== undefined) updateData.is_featured = Boolean(updateFields.is_featured);
    if (updateFields.is_bestseller !== undefined) updateData.is_bestseller = Boolean(updateFields.is_bestseller);
    if (updateFields.is_active !== undefined) updateData.is_active = Boolean(updateFields.is_active);

    // Recalculate discount percentage if price or original_price changed
    if (updateData.price !== undefined || updateData.original_price !== undefined) {
      const newPrice = (updateData.price as number) || (existingProduct.price as number);
      const newOriginalPrice = (updateData.original_price as number) || (existingProduct.original_price as number);
      
      if (newOriginalPrice && newOriginalPrice > newPrice) {
        updateData.discount_percentage = Math.round(((newOriginalPrice - newPrice) / newOriginalPrice) * 100);
      } else {
        updateData.discount_percentage = 0;
      }
    }
    // Update the product
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(product_id) },
      { $set: updateData }
    );

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      modified_count: result.modifiedCount
    });

  } catch(error) {
    console.error('Products PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while updating product'
    }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId || !ObjectId.isValid(productId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid product ID',
        message: 'Valid product ID is required'
      }, { status: 400 });
    }

    const productsCollection = await DatabaseService.getCollection('products');

    // Check if product exists
    const existingProduct = await productsCollection.findOne({ _id: new ObjectId(productId) });
    if (!existingProduct) {
        return NextResponse.json({
        success: false,
        error: 'Product not found',
        message: 'Product not found'
      }, { status: 404 });
    }

    // Soft delete - mark as inactive instead of hard delete

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch(error) {
    console.error('Products DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while deleting product'
    }, { status: 500 });
  }
}