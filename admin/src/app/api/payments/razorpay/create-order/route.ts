import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../../../lib/database';
import { SecurityMiddleware, InputSanitizer } from '../../../../../lib/security';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`💳 Payment order creation request from IP: ${ip}`);

    // Authenticate user
    let user;
    try {
      user = await SecurityMiddleware.authenticateRequest(request);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Valid authentication token is required'
      }, { status: 401 });
    }

    // Parse and sanitize request body
    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);
    
    const { 
      amount, 
      currency = 'INR', 
      receipt,
      purpose = 'wallet_recharge',
      order_type = 'wallet'
    } = sanitizedBody;

    // Comprehensive input validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_AMOUNT',
        message: 'Amount must be a positive number greater than 0'
      }, { status: 400 });
    }

    // Validate amount limits (₹10 to ₹50,000)
    if (amount < 10 || amount > 50000) {
      return NextResponse.json({
        success: false,
        error: 'AMOUNT_OUT_OF_RANGE',
        message: 'Amount must be between ₹10 and ₹50,000'
      }, { status: 400 });
    }

    // Validate currency
    if (currency !== 'INR') {
      return NextResponse.json({
        success: false,
        error: 'INVALID_CURRENCY',
        message: 'Only INR currency is supported'
      }, { status: 400 });
    }

    // Validate purpose
    const validPurposes = ['wallet_recharge', 'consultation_payment', 'product_purchase'];
    if (!validPurposes.includes(purpose as string)) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_PURPOSE',
        message: 'Invalid payment purpose'
      }, { status: 400 });
    }

    // Get user from database to verify account status
    const usersCollection = await DatabaseService.getCollection('users');
    const dbUser = await usersCollection.findOne({
      user_id: user.userId as string,
      account_status: { $ne: 'banned' }
    });

    if (!dbUser) {
      return NextResponse.json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'User account not found or suspended'
      }, { status: 404 });
    }

    if (dbUser.account_status !== 'active') {
      return NextResponse.json({
        success: false,
        error: 'ACCOUNT_INACTIVE',
        message: 'Account must be active to make payments'
      }, { status: 403 });
    }

    // Get encrypted Razorpay credentials from database
    const settingsCollection = await DatabaseService.getCollection('app_settings');
    const config = await settingsCollection.findOne({ type: 'general' });
    
    const configObj = config as Record<string, unknown>;
    const razorpayConfig = configObj?.razorpay as Record<string, unknown>;
    if (!razorpayConfig?.keyId || !razorpayConfig?.keySecret) {
      console.error('Missing Razorpay credentials in database configuration');
      return NextResponse.json({
        success: false,
        error: 'PAYMENT_SERVICE_UNAVAILABLE',
        message: 'Payment service is temporarily unavailable'
      }, { status: 503 });
    }

    // Get Razorpay credentials (stored as plain text in database)
    let RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET;
    try {
      RAZORPAY_KEY_ID = razorpayConfig.keyId as string;
      RAZORPAY_KEY_SECRET = razorpayConfig.keySecret as string;
    } catch (credentialError) {
      console.error('Failed to get Razorpay credentials:', credentialError);
      return NextResponse.json({
        success: false,
        error: 'PAYMENT_SERVICE_ERROR',
        message: 'Payment service configuration error'
      }, { status: 500 });
    }

    // Convert amount to paise (Razorpay expects amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Generate secure receipt ID
    const secureReceipt = receipt || `${purpose}_${user.userId}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    // Create Razorpay order with comprehensive data
    const orderData = {
      amount: amountInPaise,
      currency,
      receipt: secureReceipt,
      notes: {
        user_id: user.userId,
        user_email: user.email,
        user_type: user.user_type,
        purpose,
        order_type,
        created_at: new Date().toISOString(),
        ip_address: ip
      }
    };

    // Log payment attempt (excluding sensitive data)
    console.log(`💳 Creating Razorpay order for user ${user.userId}: ₹${amount} for ${purpose}`);
    
    // Create the order using Razorpay API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let razorpayResponse;
    try {
      razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`,
          'User-Agent': 'TrueAstroTalk-API/1.0'
        },
        body: JSON.stringify(orderData),
        signal: controller.signal
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Razorpay API request failed:', fetchError);
      return NextResponse.json({
        success: false,
        error: 'PAYMENT_SERVICE_TIMEOUT',
        message: 'Payment service is currently unavailable. Please try again.'
      }, { status: 503 });
    }

    clearTimeout(timeoutId);

    if (!razorpayResponse.ok) {
      const errorData = await razorpayResponse.json().catch(() => ({}));
      console.error('Razorpay order creation failed:', {
        status: razorpayResponse.status,
        error: errorData,
        amount: amountInPaise,
        user: user.userId
      });
      
      return NextResponse.json({
        success: false,
        error: 'PAYMENT_ORDER_FAILED',
        message: 'Failed to create payment order. Please try again.'
      }, { status: 500 });
    }

    const razorpayOrder = await razorpayResponse.json();

    // Use the user_id from JWT (which should be the custom user_id)
    const actualUserId = user.userId as string;

    // Store transaction in unified transactions collection
    const transactionsCollection = await DatabaseService.getCollection('transactions');
    const transactionRecord = {
      _id: new ObjectId(),
      user_id: actualUserId,
      user_type: user.user_type as string,
      transaction_type: purpose === 'wallet_recharge' ? 'credit' : 'debit',
      amount: amount,
      currency,
      status: 'pending',
      payment_method: 'razorpay',
      payment_id: null, // Will be updated after successful payment
      razorpay_order_id: razorpayOrder.id,
      reference_id: secureReceipt,
      description: `${(purpose as string).replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} - ${order_type}`,
      purpose,
      order_type,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by_ip: ip,
      user_agent: request.headers.get('user-agent') || '',
      metadata: {
        user_email: user.email,
        amount_paise: amountInPaise
      }
    };

    await transactionsCollection.insertOne(transactionRecord);

    console.log(`✅ Payment order created successfully: ${razorpayOrder.id} for user ${user.userId}`);

    // Return sanitized response (no sensitive data)
    return NextResponse.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        status: razorpayOrder.status,
        created_at: razorpayOrder.created_at
      }
    });

  } catch (error) {
    console.error('Payment order creation error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An internal error occurred. Please try again later.'
    }, { status: 500 });
  }
}