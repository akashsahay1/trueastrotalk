import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../../lib/database';
import { emailService } from '../../../../lib/email-service';
import '../../../../lib/security';

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

// GET - Admin view of all orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('payment_status');
    const orderType = searchParams.get('type') || 'complete'; // complete, pending, history
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const amountMin = searchParams.get('amount_min');
    const amountMax = searchParams.get('amount_max');
    const customerFilter = searchParams.get('customer');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const ordersCollection = await DatabaseService.getCollection('orders');
    const usersCollection = await DatabaseService.getCollection('users');

    // Build query
    const query: Record<string, unknown> = {};
    
    // Order type filtering with date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    switch (orderType) {
      case 'complete':
        // Complete orders: paid/completed/refunded orders from last 30 days
        query.payment_status = { $in: ['paid', 'completed', 'refunded'] };
        if (!fromDate && !toDate) {
          // Default: last 30 days
          query.created_at = { $gte: thirtyDaysAgo };
        }
        break;
      
      case 'pending':
        // Pending orders: failed or pending payments (any date)
        query.$or = [
          { payment_status: 'pending' },
          { payment_status: 'awaiting_payment' },
          { payment_status: 'failed' }
        ];
        break;
      
      case 'history':
        // History orders: orders older than 30 days (any payment/order status)
        if (!fromDate && !toDate) {
          // Default: older than 30 days
          query.created_at = { $lt: thirtyDaysAgo };
        }
        break;
      
      default:
        // All orders if type not specified
        break;
    }

    // Date range filtering (overrides default date logic above)
    if (fromDate || toDate) {
      const dateFilter: Record<string, Date> = {};
      
      if (fromDate) {
        dateFilter.$gte = new Date(fromDate);
      }
      
      if (toDate) {
        // Include the entire end date
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = endDate;
      }
      
      if (Object.keys(dateFilter).length > 0) {
        query.created_at = dateFilter;
      }
    }
    
    // Admin search functionality
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$and = [
        ...(Array.isArray(query.$and) ? query.$and : []),
        {
          $or: [
            { order_number: searchRegex },
            { 'shipping_address.full_name': searchRegex },
            { 'shipping_address.phone_number': searchRegex },
            { 'items.product_name': searchRegex }
          ]
        }
      ];
    }

    // Status filters
    if (status && status !== 'all') {
      query.status = status;
    }

    // Payment status filter (only if not already set by order type)
    if (paymentStatus && paymentStatus !== 'all' && orderType !== 'complete') {
      query.payment_status = paymentStatus;
    }

    // Amount range filtering
    if (amountMin || amountMax) {
      const amountFilter: Record<string, number> = {};
      
      if (amountMin) {
        amountFilter.$gte = parseFloat(amountMin);
      }
      
      if (amountMax) {
        amountFilter.$lte = parseFloat(amountMax);
      }
      
      if (Object.keys(amountFilter).length > 0) {
        query.total_amount = amountFilter;
      }
    }

    // Customer name/email filtering
    if (customerFilter) {
      // This will be applied later during user lookup since we need to search user info
      // For now, we'll store it to filter after getting user info
    }

    // Get orders with pagination
    const orders = await ordersCollection
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalOrders = await ordersCollection.countDocuments(query);

    // Format orders for admin response
    const formattedOrders = await Promise.all(orders.map(async order => {
      // Get user information
      let userInfo = null;
      if (order.user_id) {
        try {
          const user = await usersCollection.findOne({ user_id: order.user_id });
          if (user) {
            userInfo = {
              name: user.name || user.full_name,
              email: user.email || user.email_address || null,
              phone: user.phone || user.phone_number || null
            };
          }
        } catch (error) {
          console.error(`Failed to fetch user info for user_id ${order.user_id}:`, error);
        }
      }

      // Resolve product names and images for each item
      const itemsWithDetails = await Promise.all((order.items || []).map(async (item: OrderItem) => {
        const updatedItem = { ...item };
        
        if (item.product_id) {
          try {
            const productsCollection = await DatabaseService.getCollection('products');
            // Look up product by custom product_id, not MongoDB ObjectId
            const product = await productsCollection.findOne({ product_id: item.product_id });
            
            if (product) {
              // Resolve product name if missing
              if (!updatedItem.product_name && product.name) {
                updatedItem.product_name = product.name;
              }
              
              // Resolve product image if missing
              if (!updatedItem.product_image && product.image_id) {
                const resolvedImageUrl = await resolveMediaUrl(request, product.image_id);
                if (resolvedImageUrl) {
                  updatedItem.product_image = resolvedImageUrl;
                }
              }
            }
          } catch (error) {
            console.error(`Failed to resolve details for product ${item.product_id}:`, error);
          }
        }
        
        return updatedItem;
      }));

      return {
        _id: order._id.toString(),
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        total_amount: order.total_amount,
        subtotal: order.subtotal,
        shipping_cost: order.shipping_cost,
        tax_amount: order.tax_amount,
        items: itemsWithDetails,
        shipping_address: order.shipping_address,
        tracking_number: order.tracking_number,
        notes: order.notes,
        razorpay_order_id: order.razorpay_order_id,
        payment_id: order.payment_id,
        refund_id: order.refund_id,
        refund_amount: order.refund_amount,
        refund_status: order.refund_status,
        refunded_at: order.refunded_at,
        refund_notes: order.refund_notes,
        cancelled_at: order.cancelled_at,
        cancellation_reason: order.cancellation_reason,
        created_at: order.created_at,
        updated_at: order.updated_at,
        shipped_at: order.shipped_at,
        delivered_at: order.delivered_at,
        user_info: userInfo
      };
    }));

    return NextResponse.json({
      success: true,
      data: {
        orders: formattedOrders,
        total: totalOrders,
        page,
        limit,
        totalPages: Math.ceil(totalOrders / limit)
      }
    });

  } catch(error) {
    console.error('Admin orders GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching orders'
    }, { status: 500 });
  }
}

// PUT - Update order status (admin only)
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

    // Get the current order for email notifications
    const currentOrder = await ordersCollection.findOne({ _id: new ObjectId(order_id) });
    
    if (!currentOrder) {
      return NextResponse.json({
        success: false,
        error: 'Order not found',
        message: 'Order not found'
      }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date()
    };

    const oldStatus = currentOrder.status;

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

    // Send email notifications if status changed
    if (status && status !== oldStatus && currentOrder.user_id) {
      try {
        const usersCollection = await DatabaseService.getCollection('users');
        // Look up user by custom user_id, not MongoDB ObjectId
        const user = await usersCollection.findOne({ user_id: currentOrder.user_id });
        
        if (user && (user.email || user.email_address)) {
          // Send customer notification
          await emailService.sendOrderStatusNotification({
            customerName: user.name || user.full_name || 'Valued Customer',
            customerEmail: user.email || user.email_address,
            orderNumber: currentOrder.order_number,
            oldStatus: oldStatus,
            newStatus: status,
            orderDate: new Date(currentOrder.created_at).toLocaleDateString('en-IN'),
            totalAmount: currentOrder.total_amount,
            trackingNumber: tracking_number || currentOrder.tracking_number,
            items: currentOrder.items || []
          });

          // Send admin notification
          await emailService.sendAdminOrderNotification({
            customerName: user.name || user.full_name || 'Unknown User',
            customerEmail: user.email || user.email_address,
            orderNumber: currentOrder.order_number,
            oldStatus: oldStatus,
            newStatus: status,
            totalAmount: currentOrder.total_amount,
            itemsCount: currentOrder.items?.length || 0,
            trackingNumber: tracking_number || currentOrder.tracking_number
          });
        }
      } catch (error) {
        console.error('Failed to send email notifications for order update:', error);
        // Don't fail the order update if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully'
    });

  } catch(error) {
    console.error('Admin orders PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while updating order'
    }, { status: 500 });
  }
}

// DELETE - Delete single order (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing order ID',
        message: 'Order ID is required'
      }, { status: 400 });
    }

    const ordersCollection = await DatabaseService.getCollection('orders');
    const transactionsCollection = await DatabaseService.getCollection('transactions');

    // Get order details before deletion
    const order = await ordersCollection.findOne({ _id: new ObjectId(order_id as string) });
    
    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found',
        message: 'Order not found'
      }, { status: 404 });
    }

    // Delete related transaction if it exists
    if (order.razorpay_order_id) {
      await transactionsCollection.deleteOne({
        razorpay_order_id: order.razorpay_order_id
      });
      console.log(`🗑️ Deleted related transaction for razorpay_order_id: ${order.razorpay_order_id}`);
    }

    // Delete the order
    await ordersCollection.deleteOne({
      _id: new ObjectId(order_id as string)
    });

    console.log(`🗑️ Deleted order: ${order.order_number}`);

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    });

  } catch(error) {
    console.error('Admin orders DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while deleting order'
    }, { status: 500 });
  }
}