import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { SecurityMiddleware } from '@/lib/security';

/**
 * POST /api/admin/migrate-transactions
 * One-time migration to add missing reference_id and transaction_id to existing transactions
 * Only accessible by administrators
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user (only admins can run migrations)
    let authenticatedUser;
    try {
      authenticatedUser = await SecurityMiddleware.authenticateRequest(request);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Valid authentication token is required'
      }, { status: 401 });
    }

    // Only administrators can run migrations
    if (authenticatedUser.user_type !== 'administrator') {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Only administrators can run migrations'
      }, { status: 403 });
    }

    const transactionsCollection = await DatabaseService.getCollection('transactions');

    // Find all transactions without reference_id
    const transactionsWithoutRef = await transactionsCollection.find({
      $or: [
        { reference_id: { $exists: false } },
        { reference_id: null },
        { reference_id: '' }
      ]
    }).toArray();

    console.log(`Found ${transactionsWithoutRef.length} transactions without reference_id`);

    let updatedCount = 0;

    for (const transaction of transactionsWithoutRef) {
      // Generate reference_id based on transaction type
      let prefix = 'TXN';
      if (transaction.transaction_type === 'credit') {
        if (transaction.type === 'recharge' || transaction.description?.toLowerCase().includes('recharge')) {
          prefix = 'RCH';
        } else {
          prefix = 'ERN'; // Earnings
        }
      } else if (transaction.transaction_type === 'debit') {
        prefix = 'PAY'; // Payment
      } else if (transaction.transaction_type === 'withdrawal') {
        prefix = 'WD'; // Withdrawal
      } else if (transaction.transaction_type === 'commission') {
        prefix = 'COM'; // Commission
      }

      // Use created_at timestamp if available, otherwise use current time
      const timestamp = transaction.created_at
        ? new Date(transaction.created_at).getTime()
        : Date.now();

      const referenceId = `${prefix}${timestamp}`;
      const transactionId = transaction.transaction_id || `txn_${timestamp}_${Math.random().toString(36).substr(2, 6)}`;

      await transactionsCollection.updateOne(
        { _id: transaction._id },
        {
          $set: {
            reference_id: referenceId,
            transaction_id: transactionId
          }
        }
      );

      updatedCount++;
    }

    console.log(`Migration complete. Updated ${updatedCount} transactions`);

    return NextResponse.json({
      success: true,
      message: `Migration complete. Updated ${updatedCount} transactions with reference_id`,
      data: {
        totalFound: transactionsWithoutRef.length,
        updated: updatedCount
      }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: error instanceof Error ? error.message : 'Migration failed'
    }, { status: 500 });
  }
}
