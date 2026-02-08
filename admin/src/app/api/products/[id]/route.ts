import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../../lib/database';

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

// GET - Get single product details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;

    if (!productId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid product ID',
        message: 'Valid product ID is required'
      }, { status: 400 });
    }

    const productsCollection = await DatabaseService.getCollection('products');
    const reviewsCollection = await DatabaseService.getCollection('product_reviews');

    // Get product - support both custom product_id and MongoDB ObjectId
    let product;
    if (productId.startsWith('product_')) {
      // Custom product_id format (e.g., "product_1756540783734_wxtlznqe")
      product = await productsCollection.findOne({
        product_id: productId,
        is_active: true
      });
    } else if (ObjectId.isValid(productId)) {
      // MongoDB ObjectId format
      product = await productsCollection.findOne({
        _id: new ObjectId(productId),
        is_active: true
      });
    } else {
      // Try as custom product_id anyway
      product = await productsCollection.findOne({
        product_id: productId,
        is_active: true
      });
    }

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found',
        message: 'Product not found or inactive'
      }, { status: 404 });
    }

    // Get reviews for this product (use the product's custom product_id)
    const reviews = await reviewsCollection
      .find({ product_id: product.product_id })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();

    // Get related products from same category (exclude current product by its _id)
    const relatedProducts = await productsCollection
      .find({
        category: product.category,
        _id: { $ne: product._id },
        is_active: true
      })
      .limit(6)
      .toArray();

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

    // Resolve related products images
    const resolvedRelatedProducts = await Promise.all(
      relatedProducts.map(async related => {
        let relatedImageUrl = null;
        if (related.image_id) {
          relatedImageUrl = await resolveMediaUrl(request, related.image_id);
        }
        
        return {
          _id: related._id.toString(),
          product_id: related.product_id, // Include custom product_id
          name: related.name,
          price: related.price,
          original_price: related.original_price,
          discount_percentage: related.discount_percentage,
          featured_image: relatedImageUrl,
          rating: related.rating || 0,
          review_count: related.review_count || 0
        };
      })
    );

    // Format product for response
    const formattedProduct = {
      _id: product._id.toString(),
      product_id: product.product_id, // Include custom product_id
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
      images: resolvedImages, // Keep backward compatibility
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
      updated_at: product.updated_at,
      reviews: reviews.map(review => ({
        _id: review._id.toString(),
        user_name: review.user_name,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        created_at: review.created_at
      })),
      related_products: resolvedRelatedProducts
    };

    return NextResponse.json({
      success: true,
      product: formattedProduct
    });

  } catch(error) {
    console.error('Product details GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching product details'
    }, { status: 500 });
  }
}

// PUT - Update specific product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;
    const body = await request.json();

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

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date()
    };

    // Update only provided fields
    Object.keys(body).forEach(key => {
      if (key !== 'product_id' && body[key] !== undefined) {
        switch (key) {
          case 'name':
          case 'description':
          case 'category':
          case 'subcategory':
          case 'brand':
            updateData[key] = body[key] ? body[key].trim() : null;
            break;
          case 'price':
          case 'original_price':
          case 'weight':
            if (body[key] !== null) {
              const value = parseFloat(body[key]);
              if (key === 'price' && value <= 0) {
                throw new Error('Price must be greater than 0');
              }
              updateData[key] = value;
            }
            break;
          case 'stock_quantity':
            const stock = parseInt(body[key]);
            if (stock < 0) {
              throw new Error('Stock quantity cannot be negative');
            }
            updateData[key] = stock;
            break;
          case 'images':
          case 'tags':
            updateData[key] = Array.isArray(body[key]) ? body[key] : [];
            break;
          case 'is_featured':
          case 'is_bestseller':
          case 'is_active':
            updateData[key] = Boolean(body[key]);
            break;
          default:
            updateData[key] = body[key];
        }
      }
    });

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
      { _id: new ObjectId(productId) },
      { $set: updateData }
    );

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      modified_count: result.modifiedCount
    });

  } catch(error) {
    console.error('Product update PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'An error occurred while updating product'
    }, { status: 500 });
  }
}

// DELETE - Delete specific product
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.id;

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

    // Soft delete - mark as inactive
    const result = await productsCollection.updateOne(
      { _id: new ObjectId(productId) },
      { 
        $set: { 
          is_active: false, 
          deleted_at: new Date(),
          updated_at: new Date() 
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
      modified_count: result.modifiedCount
    });

  } catch(error) {
    console.error('Product delete error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while deleting product'
    }, { status: 500 });
  }
}