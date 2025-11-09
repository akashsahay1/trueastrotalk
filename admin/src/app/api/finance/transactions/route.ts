import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { ObjectId } from 'mongodb';

const DB_NAME = 'trueastrotalk';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '30');
    const search = url.searchParams.get('search') || '';
    const userId = url.searchParams.get('user_id') || '';
    const transactionType = url.searchParams.get('type') || '';
    const status = url.searchParams.get('status') || '';
    const dateFrom = url.searchParams.get('date_from') || '';
    const dateTo = url.searchParams.get('date_to') || '';
    
    const skip = (page - 1) * limit;
    
    const transactionsCollection = await DatabaseService.getCollection('transactions');
    const usersCollection = await DatabaseService.getCollection('users'); // All users are here
    
    // Build query for filtering
    const mongoQuery: Record<string, unknown> = {};
    
    if (userId) {
      mongoQuery.user_id = userId;
    }
    
    if (transactionType) {
      mongoQuery.transaction_type = transactionType;
    }
    
    if (status) {
      mongoQuery.status = status;
    }
    
    if (dateFrom || dateTo) {
      mongoQuery.created_at = {};
      if (dateFrom) (mongoQuery.created_at as Record<string, unknown>).$gte = dateFrom;
      if (dateTo) (mongoQuery.created_at as Record<string, unknown>).$lte = dateTo;
    }
    
    // Get transactions
    const transactions = await transactionsCollection
      .find(mongoQuery)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    // Enrich transactions with user data
    const enrichedTransactions = [];
    
    for (const transaction of transactions) {
      let userData = null;
      
      // Get user data from users collection regardless of type
      try {
        userData = await usersCollection.findOne({ _id: new ObjectId(transaction.user_id) });
      } catch {
        userData = await usersCollection.findOne({ _id: transaction.user_id });
      }
      
      if (!userData) {
        console.error(`❌ User not found for transaction ${transaction._id}: ${transaction.user_id}`);
      }
      
      // Apply search filter if provided
      if (search && userData) {
        const searchLower = search.toLowerCase();
        const nameMatch = userData.full_name?.toLowerCase().includes(searchLower);
        const emailMatch = userData.email_address?.toLowerCase().includes(searchLower);
        const refMatch = transaction.reference_id?.toLowerCase().includes(searchLower);
        
        if (!nameMatch && !emailMatch && !refMatch) {
          continue;
        }
      } else if (search && !userData) {
        const refMatch = transaction.reference_id?.toLowerCase().includes(search.toLowerCase());
        if (!refMatch) {
          continue;
        }
      }
      
      enrichedTransactions.push({
        ...transaction,
        user_name: userData?.full_name || `User ${transaction.user_id?.slice(-4)}`,
        user_email: userData?.email_address || userData?.email || null,
        user_phone: userData?.phone_number || null
      });
    }
    
    // Get total count for pagination (approximate for search)
    const totalCount = search ? enrichedTransactions.length : await transactionsCollection.countDocuments(mongoQuery);
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    return NextResponse.json({
      success: true,
      data: {
        transactions: enrichedTransactions,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage
        }
      }
    });
    
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}