import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { ObjectId } from 'mongodb';

// GET - Get user's cart
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing user ID',
        message: 'User ID is required'
      }, { status: 400 });
    }

    const cartCollection = await DatabaseService.getCollection('cart_items');
    const productsCollection = await DatabaseService.getCollection('products');

    // Get cart items for user
    const cartItems = await cartCollection.find({ user_id: userId }).toArray();
    
    // Get product details for each cart item
    const cartWithProducts = await Promise.all(
      cartItems.map(async (cartItem) => {
        const product = await productsCollection.findOne({ 
          _id: new ObjectId(cartItem.product_id) 
        });
        
        return {
          cart_item_id: cartItem._id.toString(),
          product_id: cartItem.product_id,
          quantity: cartItem.quantity,
          added_at: cartItem.added_at,
          product: product ? {
            _id: product._id.toString(),
            product_id: product.product_id, // Include custom product_id
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            image_url: product.image_url,
            stock_quantity: product.stock_quantity,
            is_active: product.is_active
          } : null
        };
      })
    );

    // Filter out items where product was not found (deleted products)
    const validCartItems = cartWithProducts.filter(item => item.product !== null);
    
    // Calculate totals
    const subtotal = validCartItems.reduce((total, item) => {
      return total + (item.product!.price * item.quantity);
    }, 0);
    return NextResponse.json({
      success: true,
      cart: {
        items: validCartItems,
        totals: {
          subtotal: subtotal,
          item_count: validCartItems.reduce((count, item) => count + item.quantity, 0),
          unique_items: validCartItems.length
        }
      }
    });

  } catch(error) {
    console.error('Cart GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching cart'
    }, { status: 500 });
  }
}

// POST - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, product_id, quantity = 1 } = body;

    if (!user_id || !product_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'User ID and Product ID are required'
      }, { status: 400 });
    }

    const cartCollection = await DatabaseService.getCollection('cart_items');
    const productsCollection = await DatabaseService.getCollection('products');

    // Check if product exists and is active
    const product = await productsCollection.findOne({ 
      _id: new ObjectId(product_id),
      is_active: true 
    });

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found',
        message: 'Product not found or not available'
      }, { status: 404 });
    }

    // Check stock availability
    if (product.stock_quantity < quantity) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient stock',
        message: `Only ${product.stock_quantity} items available in stock`
      }, { status: 400 });
    }

    // Check if item already exists in cart
    const existingCartItem = await cartCollection.findOne({
      user_id: user_id,
      product_id: product_id
    });

    if (existingCartItem) {
      // Update quantity
      const newQuantity = existingCartItem.quantity + quantity;
      
      // Check if new quantity exceeds stock
      if (newQuantity > product.stock_quantity) {
        return NextResponse.json({
          success: false,
          error: 'Insufficient stock',
          message: `Cannot add ${quantity} items. Only ${product.stock_quantity - existingCartItem.quantity} more items available`
        }, { status: 400 });
      }

      await cartCollection.updateOne(
        { _id: existingCartItem._id },
        { 
          $set: { 
            quantity: newQuantity,
            updated_at: new Date()
          }
        }
      );
      return NextResponse.json({
        success: true,
        message: 'Cart updated successfully'
      });
    } else {
      // Add new item to cart
      const cartItemData = {
        user_id: user_id,
        product_id: product_id,
        quantity: quantity,
        added_at: new Date(),
        updated_at: new Date()
      };

      await cartCollection.insertOne(cartItemData);
      return NextResponse.json({
        success: true,
        message: 'Item added to cart successfully'
      }, { status: 201 });
    }

  } catch(error) {
    console.error('Cart POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while adding item to cart'
    }, { status: 500 });
  }
}

// PUT - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, product_id, quantity } = body;

    if (!user_id || !product_id || quantity === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'User ID, Product ID, and quantity are required'
      }, { status: 400 });
    }

    if (quantity < 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid quantity',
        message: 'Quantity cannot be negative'
      }, { status: 400 });
    }

    const cartCollection = await DatabaseService.getCollection('cart_items');
    const productsCollection = await DatabaseService.getCollection('products');

    if (quantity === 0) {
      // Remove item from cart
      const result = await cartCollection.deleteOne({
        user_id: user_id,
        product_id: product_id
      });
      if (result.deletedCount > 0) {
        return NextResponse.json({
          success: true,
          message: 'Item removed from cart'
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Item not found',
          message: 'Cart item not found'
        }, { status: 404 });
      }
    }

    // Check product stock
    const product = await productsCollection.findOne({ 
      _id: new ObjectId(product_id),
      is_active: true 
    });

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found',
        message: 'Product not found or not available'
      }, { status: 404 });
    }

    if (product.stock_quantity < quantity) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient stock',
        message: `Only ${product.stock_quantity} items available in stock`
      }, { status: 400 });
    }

    // Update cart item
    const result = await cartCollection.updateOne(
      { 
        user_id: user_id,
        product_id: product_id 
      },
      { 
        $set: { 
          quantity: quantity,
          updated_at: new Date()
        }
      }
    );
    if (result.matchedCount > 0) {
      return NextResponse.json({
        success: true,
        message: 'Cart updated successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Item not found',
        message: 'Cart item not found'
      }, { status: 404 });
    }

  } catch(error) {
    console.error('Cart PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while updating cart'
    }, { status: 500 });
  }
}

// DELETE - Clear entire cart or remove specific item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing user ID',
        message: 'User ID is required'
      }, { status: 400 });
    }

    const cartCollection = await DatabaseService.getCollection('cart_items');

    let result;
    let message;

    if (productId) {
      // Remove specific item
      result = await cartCollection.deleteOne({
        user_id: userId,
        product_id: productId
      });
      message = 'Item removed from cart';
    } else {
      // Clear entire cart
      result = await cartCollection.deleteMany({
        user_id: userId
      });
      message = 'Cart cleared successfully';
    }
    return NextResponse.json({
      success: true,
      message: message,
      deleted_count: result.deletedCount
    });

  } catch(error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while clearing cart'
    }, { status: 500 });
  }
}