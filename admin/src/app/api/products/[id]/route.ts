import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../../lib/database';

// GET - Get single product details
export async function GET(
  request: NextRequest,
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
    const reviewsCollection = await DatabaseService.getCollection('product_reviews');

    // Get product
    const product = await productsCollection.findOne({ 
      _id: new ObjectId(productId),
      is_active: true 
    });

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found',
        message: 'Product not found or inactive'
      }, { status: 404 });
    }

    // Get reviews for this product
    const reviews = await reviewsCollection
      .find({ product_id: productId })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();

    // Get related products from same category
    const relatedProducts = await productsCollection
      .find({ 
        category: product.category,
        _id: { $ne: new ObjectId(productId) },
        is_active: true 
      })
      .limit(6)
      .toArray();

    // Format product for response
    const formattedProduct = {
      _id: product._id.toString(),
      name: product.name,
      description: product.description,
      price: product.price,
      original_price: product.original_price,
      discount_percentage: product.discount_percentage,
      category: product.category,
      subcategory: product.subcategory,
      brand: product.brand,
      images: product.images || [],
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
      related_products: relatedProducts.map(related => ({
        _id: related._id.toString(),
        name: related.name,
        price: related.price,
        original_price: related.original_price,
        discount_percentage: related.discount_percentage,
        images: Array.isArray(related.images) ? related.images.slice(0, 1) : [],
        rating: related.rating || 0,
        review_count: related.review_count || 0
      }))
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
  request: NextRequest,
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