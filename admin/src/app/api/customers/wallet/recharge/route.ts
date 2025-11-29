import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { jwtVerify } from 'jose';
import crypto from 'crypto';
import { InputSanitizer } from '@/lib/security';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

// Razorpay API configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

/**
 * Verify Razorpay payment signature
 */
function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!RAZORPAY_KEY_SECRET) {
    console.warn('Razorpay key secret not configured - skipping signature verification');
    return true; // Allow in development when not configured
  }

  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Fetch payment details from Razorpay API
 */
async function fetchRazorpayPayment(paymentId: string): Promise<{
  success: boolean;
  payment?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    order_id?: string;
  };
  error?: string;
}> {
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.warn('Razorpay credentials not configured - skipping API verification');
    return { success: true }; // Allow in development when not configured
  }

  try {
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error?.description || 'Failed to verify payment with Razorpay'
      };
    }

    const payment = await response.json();
    return {
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount / 100, // Razorpay amounts are in paise
        currency: payment.currency,
        status: payment.status,
        order_id: payment.order_id,
      }
    };
  } catch (error) {
    console.error('Razorpay API error:', error);
    return {
      success: false,
      error: 'Failed to connect to Razorpay'
    };
  }
}

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

    // Verify user is a customer
    if (payload.user_type !== 'customer') {
      return NextResponse.json({ 
        success: false,
        error: 'Forbidden',
        message: 'Access denied. Customer account required.' 
      }, { status: 403 });
    }

    // Parse and sanitize request body
    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);
    const amount = sanitizedBody.amount as number | undefined;
    const payment_method = sanitizedBody.payment_method as string | undefined;
    const payment_id = sanitizedBody.payment_id as string | undefined;

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid amount',
        message: 'Amount must be greater than 0'
      }, { status: 400 });
    }

    if (!payment_method) {
      return NextResponse.json({
        success: false,
        error: 'Invalid payment method',
        message: 'Payment method is required'
      }, { status: 400 });
    }

    // For Razorpay payments, payment_id is required
    if (payment_method === 'razorpay' && !payment_id) {
      return NextResponse.json({
        success: false,
        error: 'Invalid payment',
        message: 'Payment ID is required for Razorpay payments'
      }, { status: 400 });
    }

    // Basic payment ID validation for Razorpay
    if (payment_method === 'razorpay' && payment_id && !payment_id.startsWith('pay_')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid payment ID',
        message: 'Invalid Razorpay payment ID format'
      }, { status: 400 });
    }

    // Verify Razorpay payment with their API
    if (payment_method === 'razorpay' && payment_id) {
      const razorpay_order_id = sanitizedBody.razorpay_order_id as string | undefined;
      const razorpay_signature = sanitizedBody.razorpay_signature as string | undefined;

      // If signature is provided, verify it
      if (razorpay_order_id && razorpay_signature) {
        const isValidSignature = verifyRazorpaySignature(
          razorpay_order_id,
          payment_id,
          razorpay_signature
        );

        if (!isValidSignature) {
          return NextResponse.json({
            success: false,
            error: 'Payment verification failed',
            message: 'Invalid payment signature. This could indicate a tampered payment.'
          }, { status: 400 });
        }
      }

      // Verify payment details with Razorpay API
      const verificationResult = await fetchRazorpayPayment(payment_id);

      if (!verificationResult.success) {
        return NextResponse.json({
          success: false,
          error: 'Payment verification failed',
          message: verificationResult.error || 'Could not verify payment with Razorpay'
        }, { status: 400 });
      }

      // If we got payment details, verify the amount and status
      if (verificationResult.payment) {
        const { payment: razorpayPayment } = verificationResult;

        // Check payment status
        if (razorpayPayment.status !== 'captured' && razorpayPayment.status !== 'authorized') {
          return NextResponse.json({
            success: false,
            error: 'Payment not completed',
            message: `Payment status is '${razorpayPayment.status}'. Only captured or authorized payments can be credited.`
          }, { status: 400 });
        }

        // Verify amount matches
        const requestedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (Math.abs(razorpayPayment.amount - requestedAmount) > 0.01) {
          console.error(`Amount mismatch: requested ${requestedAmount}, Razorpay says ${razorpayPayment.amount}`);
          return NextResponse.json({
            success: false,
            error: 'Amount mismatch',
            message: 'The payment amount does not match the recharge request'
          }, { status: 400 });
        }
      }
    }

    // Connect to MongoDB
    const usersCollection = await DatabaseService.getCollection('users');
    const transactionsCollection = await DatabaseService.getCollection('transactions');

    try {
      // Check for duplicate payment ID (prevent double processing)
      if (payment_id) {
        const existingTransaction = await transactionsCollection.findOne({ payment_id });
        if (existingTransaction) {
          return NextResponse.json({ 
            success: false,
            error: 'Duplicate payment',
            message: 'This payment has already been processed' 
          }, { status: 400 });
        }
      }

      // Get current user using custom user_id (not MongoDB _id)
      const user = await usersCollection.findOne(
        { user_id: payload.userId as string },
        { projection: { wallet_balance: 1, full_name: 1, email_address: 1, user_id: 1 } }
      );

      if (!user) {
        throw new Error('User not found');
      }

      const currentBalance = user.wallet_balance || 0;
      const amountValue = typeof amount === 'string' ? parseFloat(amount) : amount;
      const newBalance = currentBalance + amountValue;

      // Update user wallet balance using custom user_id
      await usersCollection.updateOne(
        { user_id: payload.userId as string },
        {
          $set: { wallet_balance: newBalance },
          $currentDate: { updated_at: true }
        }
      );

      // Create transaction record
      const transaction = {
        user_id: payload.userId as string,
        user_type: 'customer',
        transaction_type: 'credit',
        type: 'recharge',
        amount: amountValue,
        description: 'Wallet recharge',
        payment_method,
        payment_id,
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await transactionsCollection.insertOne(transaction);
      return NextResponse.json({
        success: true,
        message: 'Wallet recharged successfully',
        new_balance: newBalance,
        data: {
          amount: amountValue,
          payment_id,
          payment_method,
          previous_balance: currentBalance,
          new_balance: newBalance
        }
      });

    } catch (error) {
      throw error;
    }

  } catch(error) {
    console.error('Error processing wallet recharge:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while processing the recharge'
    }, { status: 500 });
  }
}