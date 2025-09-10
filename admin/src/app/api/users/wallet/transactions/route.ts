import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const type = url.searchParams.get('type'); // 'credit' or 'debit'

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const transactionsCollection = db.collection('wallet_transactions');

    // Build query for user transactions (debits from user_id or credits to user_id)
    const query: Record<string, unknown> = {
      $or: [
        { user_id: payload.userId as string },
        { recipient_user_id: payload.userId as string }
      ]
    };

    if (type) {
      query.transaction_type = type;
    }

    // Get transactions
    const transactions = await transactionsCollection
      .find(query)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Get total count
    const totalCount = await transactionsCollection.countDocuments(query);
    const hasMore = (offset + limit) < totalCount;

    await client.close();

    // Format transactions for mobile app
    const formattedTransactions = transactions.map(transaction => ({
      _id: transaction._id,
      type: transaction.transaction_type || transaction.type,
      amount: transaction.amount || 0,
      description: transaction.description || transaction.reference_id || 'Transaction',
      created_at: transaction.created_at || transaction.createdAt || new Date().toISOString(),
      payment_id: transaction.payment_id,
      payment_method: transaction.payment_method,
      status: transaction.status || 'completed'
    }));

    return NextResponse.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        has_more: hasMore,
        total_count: totalCount
      }
    });

  } catch(error) {
    console.error('Error fetching wallet transactions:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while retrieving wallet transactions'
    }, { status: 500 });
  }
}