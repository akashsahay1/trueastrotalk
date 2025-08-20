import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

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

    // Parse request body
    const body = await request.json();
    const { amount, payment_method, payment_id } = body;

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
    if (payment_method === 'razorpay' && !payment_id.startsWith('pay_')) {
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

      // Get current user
      const user = await usersCollection.findOne(
        { _id: new ObjectId(payload.userId as string) },
        { projection: { wallet_balance: 1, full_name: 1, email_address: 1 } }
      );

      if (!user) {
        throw new Error('User not found');
      }

      const currentBalance = user.wallet_balance || 0;
      const newBalance = currentBalance + parseFloat(amount);

      // Update user wallet balance
      await usersCollection.updateOne(
        { _id: new ObjectId(payload.userId as string) },
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
        amount: parseFloat(amount),
        description: 'Wallet recharge',
        payment_method,
        payment_id,
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await transactionsCollection.insertOne(transaction);
      await client.close();

      return NextResponse.json({
        success: true,
        message: 'Wallet recharged successfully',
        data: {
          amount: parseFloat(amount),
          payment_id,
          payment_method
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