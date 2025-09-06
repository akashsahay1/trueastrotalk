import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '../../../../../lib/database';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, refundAmount, notes } = body;

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        message: 'Order ID is required'
      }, { status: 400 });
    }

    // Get order details
    const ordersCollection = await DatabaseService.getCollection('orders');
    const order = await ordersCollection.findOne({ _id: new ObjectId(orderId) });

    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found',
        message: 'Order not found'
      }, { status: 404 });
    }

    if (order.payment_status !== 'paid') {
      return NextResponse.json({
        success: false,
        error: 'Cannot refund',
        message: 'Order payment is not in paid status'
      }, { status: 400 });
    }

    if (!order.payment_id) {
      return NextResponse.json({
        success: false,
        error: 'Cannot refund',
        message: 'No Razorpay payment ID found for this order'
      }, { status: 400 });
    }

    // Get Razorpay credentials
    const settingsCollection = await DatabaseService.getCollection('app_settings');
    const config = await settingsCollection.findOne({ type: 'general' });
    
    const razorpayKeyId = config?.razorpay_key_id || config?.razorpay?.keyId;
    const razorpayKeySecret = config?.razorpay_key_secret || config?.razorpay?.keySecret;
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json({
        success: false,
        error: 'Configuration error',
        message: 'Razorpay credentials not configured'
      }, { status: 500 });
    }

    // Calculate refund amount (default to full amount if not specified)
    const refundAmountInPaise = refundAmount ? Math.round(refundAmount * 100) : Math.round(order.total_amount * 100);

    // Create refund in Razorpay
    const razorpayAuth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
    
    const razorpayResponse = await fetch(`https://api.razorpay.com/v1/payments/${order.payment_id}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: refundAmountInPaise,
        notes: {
          order_id: order._id.toString(),
          refund_reason: notes || 'Manual refund from admin panel',
          refunded_by: 'admin'
        }
      })
    });

    const razorpayResult = await razorpayResponse.json();

    if (!razorpayResponse.ok) {
      console.error('Razorpay refund failed:', razorpayResult);
      return NextResponse.json({
        success: false,
        error: 'Razorpay refund failed',
        message: razorpayResult.error?.description || 'Failed to process refund'
      }, { status: 400 });
    }

    // Update order in database
    await ordersCollection.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          payment_status: 'refunded',
          refund_id: razorpayResult.id,
          refund_amount: refundAmountInPaise / 100,
          refund_status: razorpayResult.status,
          refunded_at: new Date(),
          refund_notes: notes,
          updated_at: new Date()
        }
      }
    );

    // Create refund transaction record
    const transactionsCollection = await DatabaseService.getCollection('transactions');
    await transactionsCollection.insertOne({
      _id: new ObjectId(),
      user_id: order.user_id,
      user_type: 'customer',
      transaction_type: 'refund',
      amount: refundAmountInPaise / 100,
      currency: 'INR',
      status: 'completed',
      payment_method: 'razorpay',
      gateway_transaction_id: razorpayResult.id,
      order_id: order._id.toString(),
      description: `Refund for order ${order.order_number}`,
      created_at: new Date(),
      updated_at: new Date(),
      notes: notes || 'Manual refund from admin panel'
    });

    return NextResponse.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refund_id: razorpayResult.id,
        refund_amount: refundAmountInPaise / 100,
        status: razorpayResult.status
      }
    });

  } catch (error) {
    console.error('Refund processing error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while processing refund'
    }, { status: 500 });
  }
}