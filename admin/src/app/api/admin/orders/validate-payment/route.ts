import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../../../lib/database';
import '../../../../../lib/security';
import { withSecurity, SecurityPresets, AuthenticatedNextRequest, getRequestBody } from '@/lib/api-security';

async function handlePOST(request: AuthenticatedNextRequest) {
  try {
    const body = await getRequestBody<{ order_id: string }>(request);
    if (!body) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body'
      }, { status: 400 });
    }
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

    // Get the order
    const order = await ordersCollection.findOne({ _id: new ObjectId(order_id) });
    
    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found',
        message: 'Order not found'
      }, { status: 404 });
    }

    // Check if order already has paid status
    if (order.payment_status === 'paid') {
      return NextResponse.json({
        success: true,
        message: 'Payment already validated and confirmed',
        data: {
          is_valid: true,
          payment_status: 'paid',
          already_confirmed: true
        }
      });
    }

    // Only validate Razorpay orders
    if (order.payment_method !== 'razorpay') {
      return NextResponse.json({
        success: false,
        error: 'Invalid payment method',
        message: 'Only Razorpay payments can be validated'
      }, { status: 400 });
    }

    // Check if there's a completed transaction for this order
    let completedTransaction = null;

    // Try to find by razorpay_order_id if available
    if (order.razorpay_order_id) {
      completedTransaction = await transactionsCollection.findOne({
        razorpay_order_id: order.razorpay_order_id,
        status: 'completed'
      });
    }

    // If not found by razorpay_order_id, try by user_id and amount
    if (!completedTransaction) {
      const orderDate = new Date(order.created_at);
      const dateRange = {
        $gte: new Date(orderDate.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours before
        $lte: new Date(orderDate.getTime() + 2 * 60 * 60 * 1000).toISOString()  // 2 hours after
      };
      
      completedTransaction = await transactionsCollection.findOne({
        user_id: order.user_id,
        amount: order.total_amount,
        purpose: 'product_purchase',
        status: 'completed',
        created_at: dateRange
      });
    }

    if (completedTransaction) {
      // Found completed transaction - update order status
      const updateData: Record<string, unknown> = {
        payment_status: 'paid',
        payment_id: completedTransaction.payment_id,
        status: 'confirmed',
        confirmed_at: completedTransaction.verified_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Update razorpay_order_id if not present
      if (!order.razorpay_order_id && completedTransaction.razorpay_order_id) {
        updateData.razorpay_order_id = completedTransaction.razorpay_order_id;
      }

      await ordersCollection.updateOne(
        { _id: order._id },
        { $set: updateData }
      );

      return NextResponse.json({
        success: true,
        message: 'Payment validated successfully! Order has been automatically updated to paid status.',
        data: {
          is_valid: true,
          payment_status: 'paid',
          payment_id: completedTransaction.payment_id,
          auto_updated: true
        }
      });

    } else {
      // No completed transaction found - check with Razorpay API if we have the necessary details
      if (order.razorpay_order_id) {
        try {
          // Get Razorpay credentials
          const settingsCollection = await DatabaseService.getCollection('app_settings');
          const config = await settingsCollection.findOne({ type: 'general' });
          
          const configObj = config as Record<string, unknown>;
          const razorpayConfig = configObj?.razorpay as Record<string, unknown>;
          
          if (razorpayConfig?.keyId && razorpayConfig?.keySecret) {
            // Check order status with Razorpay API
            const razorpayApiUrl = `https://api.razorpay.com/v1/orders/${order.razorpay_order_id}`;
            const authHeader = `Basic ${Buffer.from(`${razorpayConfig.keyId}:${razorpayConfig.keySecret}`).toString('base64')}`;

            const response = await fetch(razorpayApiUrl, {
              method: 'GET',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const razorpayOrder = await response.json();
              
              return NextResponse.json({
                success: true,
                message: `Razorpay order status: ${razorpayOrder.status}. ${razorpayOrder.status === 'paid' ? 'Payment completed but not processed in our system yet.' : 'Payment is still pending.'}`,
                data: {
                  is_valid: razorpayOrder.status === 'paid',
                  payment_status: order.payment_status,
                  razorpay_status: razorpayOrder.status,
                  razorpay_amount: razorpayOrder.amount,
                  razorpay_amount_paid: razorpayOrder.amount_paid || 0
                }
              });
            }
          }
        } catch (apiError) {
          console.error('Razorpay API validation failed:', apiError);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'No completed payment found for this order. Payment may still be pending or failed.',
        data: {
          is_valid: false,
          payment_status: order.payment_status,
          has_razorpay_order_id: !!order.razorpay_order_id
        }
      });
    }

  } catch(error) {
    console.error('Payment validation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while validating payment'
    }, { status: 500 });
  }
}

// Export secured handlers with admin-only access
export const POST = withSecurity(handlePOST, SecurityPresets.admin);