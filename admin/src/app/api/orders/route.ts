import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../lib/database';
import '../../../lib/security';
import { generateOrderId } from '../../../lib/custom-id';

// Type definitions
interface OrderItem {
  product_id: string;
  product_name: string;
  product_image?: string | null;
  price: number;
  quantity: number;
}

// Helper function to resolve media URL from media collection
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

    if (mediaFile && mediaFile.file_path) {
      // Get the actual host from the request headers
      const host = request.headers.get('host') || 'www.trueastrotalk.com';
      const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
      const baseUrl = `${protocol}://${host}`;
      
      return `${baseUrl}${mediaFile.file_path}`;
    }
    
    return null;
  } catch (error) {
    console.error('Error resolving media URL:', error);
    return null;
  }
}

// Generate secure order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `TA-${timestamp.slice(-6)}-${randomChars}-${random}`;
}

// GET - Get orders (user-specific or admin view)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const adminView = searchParams.get('admin') === 'true';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('payment_status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // For non-admin requests, userId is required
    if (!adminView && !userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing user ID',
        message: 'User ID is required'
      }, { status: 400 });
    }

    const ordersCollection = await DatabaseService.getCollection('orders');
    const usersCollection = await DatabaseService.getCollection('users');

    // Build query
    const query: Record<string, unknown> = {};
    
    // If not admin view, filter by user
    if (!adminView && userId) {
      query.user_id = userId;
    }

    // Admin search functionality
    if (adminView && search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { order_number: searchRegex },
        { 'shipping_address.full_name': searchRegex },
        { 'shipping_address.phone_number': searchRegex },
        { 'items.product_name': searchRegex }
      ];
    }

    // Status filters
    if (status && status !== 'all') {
      query.status = status;
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query.payment_status = paymentStatus;
    }

    // Get orders with pagination
    const orders = await ordersCollection
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalOrders = await ordersCollection.countDocuments(query);

    // For admin view, also get user information for each order
    const formattedOrders = await Promise.all(orders.map(async order => {
      // Get user information for admin view
      let userInfo = null;
      if (adminView && order.user_id) {
        try {
          const user = await usersCollection.findOne({ _id: new ObjectId(order.user_id) });
          if (user) {
            userInfo = {
              name: user.name || user.full_name || 'Unknown User',
              email: user.email || null,
              phone: user.phone || user.phone_number || null
            };
          }
        } catch (error) {
          console.error(`Failed to fetch user info for user_id ${order.user_id}:`, error);
        }
      }
      // Resolve product images for each item if needed
      const itemsWithImages = await Promise.all((order.items || []).map(async (item: OrderItem) => {
        if (!item.product_image && item.product_id) {
          // If no product_image stored, try to get it from products collection
          try {
            const productsCollection = await DatabaseService.getCollection('products');
            const product = await productsCollection.findOne({ _id: new ObjectId(item.product_id) });
            
            if (product && product.image_id) {
              const resolvedImageUrl = await resolveMediaUrl(request, product.image_id);
              if (resolvedImageUrl) {
                console.log(`🖼️ Order fetch: Resolved missing image for ${item.product_name}: ${product.image_id} -> ${resolvedImageUrl}`);
                return { ...item, product_image: resolvedImageUrl };
              }
            }
          } catch (error) {
            console.error(`Failed to resolve image for product ${item.product_id}:`, error);
          }
        }
        return item;
      }));

      const baseOrder = {
        _id: order._id.toString(),
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        total_amount: order.total_amount,
        subtotal: order.subtotal,
        shipping_cost: order.shipping_cost,
        tax_amount: order.tax_amount,
        items: itemsWithImages,
        shipping_address: order.shipping_address,
        tracking_number: order.tracking_number,
        notes: order.notes,
        created_at: order.created_at,
        updated_at: order.updated_at,
        shipped_at: order.shipped_at,
        delivered_at: order.delivered_at
      };

      // Add user info for admin view
      if (adminView && userInfo) {
        return {
          ...baseOrder,
          user_info: userInfo
        };
      }

      return baseOrder;
    }));


    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      pagination: {
        total: totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit)
      }
    });

  } catch(error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching orders'
    }, { status: 500 });
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      user_id, 
      items, 
      shipping_address, 
      payment_method = 'cod',
      notes = '',
      apply_shipping = true
    } = body;

    if (!user_id || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'User ID and items are required'
      }, { status: 400 });
    }

    if (!shipping_address || !shipping_address.full_name || !shipping_address.address_line_1) {
      return NextResponse.json({
        success: false,
        error: 'Invalid shipping address',
        message: 'Complete shipping address is required'
      }, { status: 400 });
    }

    const ordersCollection = await DatabaseService.getCollection('orders');
    const productsCollection = await DatabaseService.getCollection('products');
    const cartCollection = await DatabaseService.getCollection('cart_items');

    // Validate items and calculate totals
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await productsCollection.findOne({ 
        _id: new ObjectId(item.product_id),
        is_active: true 
      });

      if (!product) {
            return NextResponse.json({
          success: false,
          error: 'Product not found',
          message: `Product ${item.product_id} not found or not available`
        }, { status: 400 });
      }

      // Check stock availability
      if (Number(product.stock_quantity) < Number(item.quantity)) {
            return NextResponse.json({
          success: false,
          error: 'Insufficient stock',
          message: `Only ${product.stock_quantity} items available for ${product.name}`
        }, { status: 400 });
      }

      const itemTotal = Number(product.price) * Number(item.quantity);
      subtotal += itemTotal;

      // Resolve product image from image_id (media_id)
      let imageUrl = null;
      if (product.image_id) {
        imageUrl = await resolveMediaUrl(request, product.image_id);
        console.log(`🖼️ Order creation: Product ${product.name} image resolved: ${product.image_id} -> ${imageUrl}`);
      } else {
        console.log(`🖼️ Order creation: Product ${product.name} has no image_id`);
      }

      validatedItems.push({
        product_id: item.product_id,
        product_name: product.name,
        product_image: imageUrl, // Use resolved media URL
        product_price: Number(product.price), // Frontend expects product_price
        price: Number(product.price), // Keep price for compatibility
        quantity: Number(item.quantity),
        total_price: itemTotal, // Frontend expects total_price
        total: itemTotal, // Keep total for compatibility
        category: product.category
      });
    }

    // Calculate shipping and tax
    const shippingCost = apply_shipping && subtotal < 500 ? 50 : 0; // Free shipping above ₹500
    const taxRate = 0.18; // 18% GST
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + shippingCost + taxAmount;

    // Generate order
    const orderData = {
      order_id: generateOrderId(),
      user_id: user_id,
      order_number: generateOrderNumber(),
      status: 'pending',
      payment_status: payment_method === 'cod' ? 'pending' : 'awaiting_payment',
      payment_method: payment_method,
      subtotal: Math.round(subtotal * 100) / 100,
      shipping_cost: shippingCost,
      tax_amount: Math.round(taxAmount * 100) / 100,
      total_amount: Math.round(totalAmount * 100) / 100,
      items: validatedItems,
      shipping_address: {
        full_name: shipping_address.full_name,
        phone_number: shipping_address.phone_number,
        address_line_1: shipping_address.address_line_1,
        address_line_2: shipping_address.address_line_2 || '',
        city: shipping_address.city,
        state: shipping_address.state,
        postal_code: shipping_address.postal_code,
        country: shipping_address.country || 'India'
      },
      notes: notes,
      tracking_number: null,
      created_at: new Date(),
      updated_at: new Date(),
      shipped_at: null,
      delivered_at: null
    };

    const result = await ordersCollection.insertOne(orderData);
    const orderId = result.insertedId.toString();

    // Update product stock
    for (const item of validatedItems) {
      await productsCollection.updateOne(
        { _id: new ObjectId(item.product_id as string) },
        { 
          $inc: { stock_quantity: -(item.quantity as number) },
          $set: { updated_at: new Date() }
        } as Record<string, unknown>
      );
    }

    // Clear user's cart
    await cartCollection.deleteMany({ user_id: user_id });


    // Return the complete order object for the frontend
    const completeOrder = {
      _id: orderId,
      ...orderData,
      // Convert Date objects to ISO strings for frontend compatibility
      created_at: (orderData.created_at as Date).toISOString(),
      updated_at: (orderData.updated_at as Date).toISOString(),
      shipped_at: orderData.shipped_at ? (orderData.shipped_at as Date).toISOString() : null,
      delivered_at: orderData.delivered_at ? (orderData.delivered_at as Date).toISOString() : null
    };

    return NextResponse.json({
      success: true,
      message: 'Order created successfully',
      order: completeOrder,
      order_id: orderId
    }, { status: 201 });

  } catch(error) {
    console.error('Orders POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while creating order'
    }, { status: 500 });
  }
}

// PUT - Update order status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, status, payment_status, tracking_number } = body;

    if (!order_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing order ID',
        message: 'Order ID is required'
      }, { status: 400 });
    }

    const ordersCollection = await DatabaseService.getCollection('orders');

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date()
    };

    if (status) {
      updateData.status = status;
      
      // Set timestamps based on status
      if (status === 'shipped' && !await ordersCollection.findOne({ _id: new ObjectId(order_id), shipped_at: { $exists: true, $ne: null } })) {
        updateData.shipped_at = new Date();
      }
      if (status === 'delivered' && !await ordersCollection.findOne({ _id: new ObjectId(order_id), delivered_at: { $exists: true, $ne: null } })) {
        updateData.delivered_at = new Date();
      }
    }

    if (payment_status) {
      updateData.payment_status = payment_status;
    }

    if (tracking_number) {
      updateData.tracking_number = tracking_number;
    }

    // Update the order
    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(order_id as string) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Order not found',
        message: 'Order not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully'
    });

  } catch(error) {
    console.error('Orders PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while updating order'
    }, { status: 500 });
  }
}