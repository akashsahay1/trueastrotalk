import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '30');
    const search = url.searchParams.get('search') || '';
    const userType = url.searchParams.get('type') || '';
    
    const skip = (page - 1) * limit;

    const usersCollection = await DatabaseService.getCollection('users');
    const sessionsCollection = await DatabaseService.getCollection('sessions');
    const transactionsCollection = await DatabaseService.getCollection('transactions');
    
    const wallets = [];
    
    // Build query for search
    let mongoQuery: Record<string, unknown> = {};
    if (search) {
      mongoQuery = {
        $or: [
          { full_name: { $regex: search, $options: 'i' } },
          { email_address: { $regex: search, $options: 'i' } },
          { phone_number: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    // Build user type filter for unified users collection
    if (userType) {
      mongoQuery.user_type = userType;
    }
    
    // Get users with wallet data
    const users = await usersCollection
      .find(mongoQuery)
      .limit(limit)
      .skip(skip)
      .toArray();
    
    for (const user of users) {
      const userId = user._id.toString();
      
      // Get user transactions from transactions collection
      const userTransactions = await transactionsCollection
        .find({ user_id: userId })
        .sort({ created_at: -1 })
        .toArray();
      
      // Calculate transaction totals
      const totalCredit = userTransactions
        .filter(t => t.transaction_type === 'credit')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
        
      const totalDebit = userTransactions
        .filter(t => t.transaction_type === 'debit')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      // Get sessions for session count
      const userSessions = await sessionsCollection
        .find({ 
          $or: [
            { customer_id: userId },
            { astrologer_id: userId }
          ]
        })
        .toArray();
      
      const lastTransaction = userTransactions.length > 0 ? 
        userTransactions[0].created_at : 
        user.created_at;
      
      wallets.push({
        _id: user._id,
        user_id: user._id,
        user_name: user.full_name || 'Unknown User',
        user_type: user.user_type || 'customer',
        email: user.email_address,
        phone: user.phone_number,
        wallet_balance: user.wallet_balance || 0,
        total_spent: user.user_type === 'customer' ? totalDebit : 0,
        total_earned: user.user_type === 'astrologer' ? totalCredit : 0,
        total_recharged: user.user_type === 'customer' ? totalCredit : 0,
        total_withdrawn: user.user_type === 'astrologer' ? totalDebit : 0,
        session_count: userSessions.length,
        status: user.account_status || 'active',
        last_transaction: lastTransaction,
        created_at: user.created_at,
        transaction_count: userTransactions.length
      });
    }
    
    // Sort by last transaction date
    wallets.sort((a, b) => new Date(b.last_transaction).getTime() - new Date(a.last_transaction).getTime());
    
    // Apply pagination based on the results we fetched
    // Since we already applied limit/skip to the DB query, don't slice again
    
    // Get total count for pagination
    const totalCount = await usersCollection.countDocuments(mongoQuery);
    
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    return NextResponse.json({
      success: true,
      data: {
        wallets,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage
        }
      }
    });
    
  } catch(error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch wallets' },
      { status: 500 }
    );
  }
}