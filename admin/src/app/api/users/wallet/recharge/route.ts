import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

/**
 * Verify Razorpay payment and get payment details including actual payment method
 */
async function verifyRazorpayPayment(
  paymentId: string,
  razorpayKeyId: string,
  razorpayKeySecret: string
): Promise<{
  verified: boolean;
  method: string;
  amount: number;
  status: string;
  error?: string;
}> {
  try {
    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');

    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        verified: false,
        method: 'unknown',
        amount: 0,
        status: 'failed',
        error: error.error?.description || 'Payment verification failed'
      };
    }

    const payment = await response.json();

    // Map Razorpay method to user-friendly names
    let paymentMethod = 'Unknown';
    switch (payment.method) {
      case 'card':
        paymentMethod = 'Card';
        break;
      case 'upi':
        paymentMethod = 'UPI';
        break;
      case 'netbanking':
        paymentMethod = 'Netbanking';
        break;
      case 'wallet':
        // If wallet, get specific wallet name (paytm, freecharge, etc.)
        paymentMethod = payment.wallet ? payment.wallet.toUpperCase() : 'Wallet';
        break;
      case 'emi':
        paymentMethod = 'EMI';
        break;
      case 'cardless_emi':
        paymentMethod = 'Cardless EMI';
        break;
      case 'paylater':
        paymentMethod = 'Pay Later';
        break;
      default:
        paymentMethod = payment.method || 'Unknown';
    }

    return {
      verified: payment.status === 'captured' || payment.status === 'authorized',
      method: paymentMethod,
      amount: payment.amount / 100, // Razorpay amount is in paise
      status: payment.status
    };
  } catch (error) {
    console.error('Razorpay verification error:', error);
    return {
      verified: false,
      method: 'unknown',
      amount: 0,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
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

    // Verify user is either a customer or astrologer
    if (payload.user_type !== 'customer' && payload.user_type !== 'astrologer') {
      return NextResponse.json({ 
        success: false,
        error: 'Forbidden',
        message: 'Access denied. Valid user account required.' 
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { amount, payment_id } = body;

    // Validate input
    if (!amount || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid amount',
        message: 'Amount must be greater than 0'
      }, { status: 400 });
    }

    // Payment ID is required for Razorpay verification
    if (!payment_id) {
      return NextResponse.json({
        success: false,
        error: 'Invalid payment',
        message: 'Payment ID is required'
      }, { status: 400 });
    }

    // Basic payment ID validation for Razorpay
    if (!payment_id.startsWith('pay_')) {
      return NextResponse.json({
        success: false,
        error: 'Invalid payment ID',
        message: 'Invalid Razorpay payment ID format'
      }, { status: 400 });
    }

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();

    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    const transactionsCollection = db.collection('transactions');
    const settingsCollection = db.collection('app_settings');

    try {
      // Get Razorpay credentials from database
      const config = await settingsCollection.findOne({ type: 'general' });

      const configObj = config as Record<string, unknown>;
      const razorpayConfig = configObj?.razorpay as Record<string, unknown>;
      if (!razorpayConfig?.keyId || !razorpayConfig?.keySecret) {
        console.error('Missing Razorpay credentials in database configuration');
        await client.close();
        return NextResponse.json({
          success: false,
          error: 'PAYMENT_SERVICE_UNAVAILABLE',
          message: 'Payment service is temporarily unavailable. Please configure Razorpay credentials in admin settings.'
        }, { status: 503 });
      }

      const RAZORPAY_KEY_ID = razorpayConfig.keyId as string;
      const RAZORPAY_KEY_SECRET = razorpayConfig.keySecret as string;

      console.log(`🔑 Using Razorpay credentials from database: ${RAZORPAY_KEY_ID.substring(0, 15)}...`);

      // Verify payment with Razorpay and get actual payment method
      console.log(`🔍 Verifying Razorpay payment: ${payment_id}`);
      const razorpayVerification = await verifyRazorpayPayment(payment_id, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET);

      if (!razorpayVerification.verified) {
        console.error('❌ Payment verification failed:', razorpayVerification.error);
        await client.close();
        return NextResponse.json({
          success: false,
          error: 'PAYMENT_VERIFICATION_FAILED',
          message: razorpayVerification.error || 'Unable to verify payment with Razorpay. Please contact support.'
        }, { status: 400 });
      }

      // Verify amount matches
      if (Math.abs(razorpayVerification.amount - parseFloat(amount)) > 0.01) {
        console.error('❌ Amount mismatch:', {
          requested: amount,
          verified: razorpayVerification.amount
        });
        await client.close();
        return NextResponse.json({
          success: false,
          error: 'Amount mismatch',
          message: 'Payment amount does not match the requested amount'
        }, { status: 400 });
      }

      const actualPaymentMethod = razorpayVerification.method;
      console.log(`✅ Payment verified: ${actualPaymentMethod}`);
      // Check for duplicate payment ID (prevent double processing)
      if (payment_id) {
        const existingCompletedTransaction = await transactionsCollection.findOne({
          payment_id,
          status: 'completed'
        });
        if (existingCompletedTransaction) {
          return NextResponse.json({
            success: false,
            error: 'Duplicate payment',
            message: 'This payment has already been processed'
          }, { status: 400 });
        }
      }

      // Get current user - using custom user_id field instead of _id
      const user = await usersCollection.findOne(
        { user_id: payload.userId as string },
        { projection: { wallet_balance: 1, full_name: 1, email_address: 1, user_id: 1 } }
      );

      if (!user) {
        throw new Error('User not found');
      }

      const currentBalance = user.wallet_balance || 0;
      const newBalance = currentBalance + parseFloat(amount);

      // Update user wallet balance - using custom user_id field
      await usersCollection.updateOne(
        { user_id: payload.userId as string },
        {
          $set: { wallet_balance: newBalance },
          $currentDate: { updated_at: true }
        }
      );

      // Find existing pending transaction and update it, or create new one
      const pendingTransaction = await transactionsCollection.findOne({
        user_id: payload.userId as string,
        amount: parseFloat(amount),
        status: 'pending',
        payment_method: 'razorpay'
      });

      if (pendingTransaction) {
        // Update existing pending transaction
        await transactionsCollection.updateOne(
          { _id: pendingTransaction._id },
          {
            $set: {
              payment_method: actualPaymentMethod,
              payment_id,
              status: 'completed',
              description: 'Wallet Recharge',
              updated_at: new Date().toISOString()
            }
          }
        );
        console.log(`✅ Updated existing transaction: ${pendingTransaction._id}`);
      } else {
        // Create new transaction record (fallback for legacy payments)
        const transaction = {
          user_id: payload.userId as string,
          user_type: 'customer',
          transaction_type: 'credit',
          type: 'recharge',
          amount: parseFloat(amount),
          description: 'Wallet Recharge',
          payment_method: actualPaymentMethod,
          payment_id,
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        await transactionsCollection.insertOne(transaction);
        console.log(`✅ Created new transaction for legacy payment`);
      }
      await client.close();

      console.log(`✅ Wallet recharged successfully: ₹${amount} via ${actualPaymentMethod}`);

      return NextResponse.json({
        success: true,
        message: 'Wallet recharged successfully',
        data: {
          amount: parseFloat(amount),
          payment_id,
          payment_method: actualPaymentMethod
        }
      });

    } catch (error) {
      await client.close();
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