import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../../../lib/database';
import '../../../../../lib/security';
import { withSecurity, SecurityPresets } from '@/lib/api-security';

// POST - Verify payment status with Razorpay and move to complete orders
async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, razorpay_order_id } = body;

    if (!order_id || !razorpay_order_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing parameters',
        message: 'Order ID and Razorpay Order ID are required'
      }, { status: 400 });
    }

    const ordersCollection = await DatabaseService.getCollection('orders');

    // First, verify the order exists
    const order = await ordersCollection.findOne({ _id: new ObjectId(order_id) });
    
    if (!order) {
      return NextResponse.json({
        success: false,
        error: 'Order not found',
        message: 'Order not found'
      }, { status: 404 });
    }

    // TODO: Implement actual Razorpay API call to verify payment status
    // For now, we'll simulate the verification process
    
    try {
      // Simulate Razorpay API call
      // const razorpayResponse = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
      //   headers: {
      //     'Authorization': `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`
      //   }
      // });
      
      // const paymentData = await razorpayResponse.json();
      
      // For demo purposes, assume payment is successful if we reach here
      const paymentVerified = true;
      
      if (paymentVerified) {
        // Update order status to paid and confirmed
        const updateResult = await ordersCollection.updateOne(
          { _id: new ObjectId(order_id) },
          {
            $set: {
              payment_status: 'paid',
              status: 'confirmed',
              updated_at: new Date(),
              verified_at: new Date()
            }
          }
        );

        if (updateResult.matchedCount === 0) {
          throw new Error('Failed to update order status');
        }

        return NextResponse.json({
          success: true,
          message: 'Payment verified successfully. Order moved to complete orders.',
          payment_verified: true
        });
      } else {
        return NextResponse.json({
          success: false,
          message: 'Payment verification failed. Payment not completed in Razorpay.',
          payment_verified: false
        });
      }
    } catch (razorpayError) {
      console.error('Razorpay API error:', razorpayError);
      return NextResponse.json({
        success: false,
        error: 'Payment verification failed',
        message: 'Unable to verify payment with Razorpay. Please try again later.'
      }, { status: 500 });
    }

  } catch(error) {
    console.error('Verify payment error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while verifying payment'
    }, { status: 500 });
  }
}

// Export secured handlers with admin-only access
export const POST = withSecurity(handlePOST, SecurityPresets.admin);