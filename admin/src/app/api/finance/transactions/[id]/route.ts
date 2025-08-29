import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// PATCH - Update transaction status (admin only, for dispute resolution)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.user_type !== 'administrator') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { status, admin_action, admin_notes } = body;
    const transactionId = params.id;

    if (!transactionId) {
      return NextResponse.json({
        success: false,
        error: 'Missing transaction ID'
      }, { status: 400 });
    }

    if (!status || !admin_action) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: status, admin_action'
      }, { status: 400 });
    }

    // Validate status
    if (!['completed', 'failed', 'cancelled'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status. Must be: completed, failed, or cancelled'
      }, { status: 400 });
    }

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const transactionsCollection = db.collection('transactions');

    // Get the current transaction
    const currentTransaction = await transactionsCollection.findOne({
      _id: new ObjectId(transactionId)
    });

    if (!currentTransaction) {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 });
    }

    // Only allow updates for pending transactions
    if (currentTransaction.status !== 'pending') {
      await client.close();
      return NextResponse.json({
        success: false,
        error: 'Only pending transactions can be updated'
      }, { status: 400 });
    }

    // Build update data
    const updateData = {
      status: status,
      admin_action: admin_action,
      admin_notes: admin_notes,
      admin_updated_at: new Date(),
      updated_at: new Date()
    };

    // Update the transaction
    const result = await transactionsCollection.updateOne(
      { _id: new ObjectId(transactionId) },
      { $set: updateData }
    );

    await client.close();

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Transaction ${admin_action}d successfully`,
      transaction_id: transactionId,
      new_status: status,
      admin_action: admin_action
    });

  } catch (error) {
    console.error('Transaction update error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET - Get individual transaction details (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.user_type !== 'administrator') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const transactionId = params.id;

    if (!transactionId) {
      return NextResponse.json({
        success: false,
        error: 'Missing transaction ID'
      }, { status: 400 });
    }

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const transactionsCollection = db.collection('transactions');

    // Get the transaction with user details
    const transaction = await transactionsCollection.findOne({
      _id: new ObjectId(transactionId)
    });

    await client.close();

    if (!transaction) {
      return NextResponse.json({
        success: false,
        error: 'Transaction not found'
      }, { status: 404 });
    }

    // Format response
    const formattedTransaction = {
      ...transaction,
      _id: transaction._id.toString(),
      user_id: transaction.user_id?.toString(),
      created_at: transaction.created_at.toISOString(),
      updated_at: transaction.updated_at?.toISOString()
    };

    return NextResponse.json({
      success: true,
      data: {
        transaction: formattedTransaction
      }
    });

  } catch (error) {
    console.error('Get transaction error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}