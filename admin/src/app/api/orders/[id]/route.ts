import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../../lib/database';
import '../../../../lib/security';

// GET - Get order details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid order ID',
        message: 'Valid order ID is required'
      }, { status: 400 });
    }

    const ordersCollection = await DatabaseService.getCollection('orders');
    const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found',
        message: 'Order not found'
      }, { status: 404 });
    }

    // Format order for response
    const formattedOrder = {
      _id: order._id.toString(),
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      payment_method: order.payment_method,
      total_amount: order.total_amount,
      subtotal: order.subtotal,
      shipping_cost: order.shipping_cost,
      tax_amount: order.tax_amount,
      items: order.items,
      shipping_address: order.shipping_address,
      tracking_number: order.tracking_number,
      notes: order.notes,
      razorpay_order_id: order.razorpay_order_id,
      payment_id: order.payment_id,
      created_at: order.created_at,
      updated_at: order.updated_at,
      shipped_at: order.shipped_at,
      delivered_at: order.delivered_at
    };

    return NextResponse.json({
      success: true,
      order: formattedOrder
    });

  } catch(error) {
    console.error('Order details GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while fetching order details'
    }, { status: 500 });
  }
}

// PUT - Update specific order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;
    const body = await request.json();

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid order ID',
        message: 'Valid order ID is required'
      }, { status: 400 });
    }

    const { status, payment_status, tracking_number, notes, razorpay_order_id, payment_id } = body;

    const ordersCollection = await DatabaseService.getCollection('orders');

    // Check if order exists
    const existingOrder = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
    if (!existingOrder) {
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

    if (status) {
      updateData.status = status;
      
      // Set timestamps based on status
      if (status === 'shipped' && !existingOrder.shipped_at) {
        updateData.shipped_at = new Date();
      }
      if (status === 'delivered' && !existingOrder.delivered_at) {
        updateData.delivered_at = new Date();
      }
    }

    if (payment_status) {
      updateData.payment_status = payment_status;
    }

    if (tracking_number !== undefined) {
      updateData.tracking_number = tracking_number;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (razorpay_order_id) {
      updateData.razorpay_order_id = razorpay_order_id;
    }

    if (payment_id) {
      updateData.payment_id = payment_id;
    }

    const result = await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
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
      message: 'Order updated successfully',
      updated_fields: Object.keys(updateData)
    });

  } catch(error) {
    console.error('Order update PUT error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while updating order'
    }, { status: 500 });
  }
}

// DELETE - Cancel order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    if (!orderId || !ObjectId.isValid(orderId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid order ID',
        message: 'Valid order ID is required'
      }, { status: 400 });
    }

    const ordersCollection = await DatabaseService.getCollection('orders');
    const productsCollection = await DatabaseService.getCollection('products');

    // Get order details
    const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });
    
    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found',
        message: 'Order not found'
      }, { status: 404 });
    }

    // Check if order can be cancelled
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return NextResponse.json({
        success: false,
        error: 'Cannot cancel order',
        message: `Order cannot be cancelled as it is already ${order.status}`
      }, { status: 400 });
    }

    // Update order status to cancelled
    await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      { 
        $set: { 
          status: 'cancelled',
          updated_at: new Date()
        }
      }
    );

    // Restore product stock
    for (const item of order.items) {
      await productsCollection.updateOne(
        { product_id: item.product_id }, // Use custom product_id, not MongoDB ObjectId
        { 
          $inc: { stock_quantity: item.quantity },
          $set: { updated_at: new Date() }
        } as Record<string, unknown>
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully'
    });

  } catch(error) {
    console.error('Order cancel DELETE error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while cancelling order'
    }, { status: 500 });
  }
}