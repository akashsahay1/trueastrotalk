import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// Use the test credentials for now - in production, these should be in environment variables
const RAZORPAY_KEY_ID = 'rzp_test_R7IL3PyOUDwWSV';
const RAZORPAY_KEY_SECRET = 'RnofksJTdP40tR43UI39q14X';

export async function POST(request: NextRequest) {
  try {
    // Get token from header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'No authentication token provided' 
      }, { status: 401 });
    }

    let payload;
    try {
      const result = await jwtVerify(token, JWT_SECRET);
      payload = result.payload;
    } catch {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid token',
        message: 'Authentication token is invalid or expired' 
      }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { amount, currency = 'INR', receipt } = body;

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid amount',
        message: 'Amount must be greater than 0' 
      }, { status: 400 });
    }

    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Create Razorpay order
    const orderData = {
      amount: amountInPaise,
      currency,
      receipt: receipt || `wallet_${payload.userId}_${Date.now()}`,
      notes: {
        user_id: payload.userId as string,
        user_type: payload.user_type as string,
        purpose: 'wallet_recharge'
      }
    };

    // Create the order using Razorpay API
    console.log('Creating Razorpay order with data:', orderData);
    
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`
      },
      body: JSON.stringify(orderData)
    });

    console.log('Razorpay response status:', razorpayResponse.status);

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.json();
      console.error('Razorpay order creation failed:', errorData);
      console.error('Request data was:', orderData);
      console.error('Response status:', razorpayResponse.status);
      return NextResponse.json({
        success: false,
        error: 'Payment service error',
        message: `Failed to create payment order: ${errorData.error?.description || 'Unknown error'}`
      }, { status: 500 });
    }

    const razorpayOrder = await razorpayResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        status: razorpayOrder.status
      }
    });

  } catch(error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while creating the payment order'
    }, { status: 500 });
  }
}