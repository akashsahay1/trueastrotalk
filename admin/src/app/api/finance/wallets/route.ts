import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalk';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '30');
    const search = url.searchParams.get('search') || '';
    const userType = url.searchParams.get('type') || '';
    
    const skip = (page - 1) * limit;
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const customersCollection = db.collection('customers');
    const astrologersCollection = db.collection('astrologers');
    const sessionsCollection = db.collection('sessions');
    
    let wallets = [];
    
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
    
    if (userType === 'customer' || userType === '') {
      // Get customers with wallet data
      const customers = await customersCollection
        .find(mongoQuery)
        .limit(userType === 'customer' ? limit : Math.floor(limit/2))
        .skip(userType === 'customer' ? skip : 0)
        .toArray();
      
      for (const customer of customers) {
        // Calculate total spent from sessions
        const customerSessions = await sessionsCollection
          .find({ customer_id: customer._id.toString() })
          .toArray();
        
        const totalSpent = customerSessions.reduce((sum, session) => sum + (session.total_amount || 0), 0);
        const sessionCount = customerSessions.length;
        
        wallets.push({
          _id: customer._id,
          user_id: customer._id,
          user_name: customer.full_name,
          user_type: 'customer',
          email: customer.email_address,
          phone: customer.phone_number,
          wallet_balance: customer.wallet_balance || 0,
          total_spent: totalSpent,
          total_recharged: (customer.wallet_balance || 0) + totalSpent,
          session_count: sessionCount,
          status: customer.account_status,
          last_transaction: customerSessions.length > 0 ? 
            customerSessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at : 
            customer.created_at,
          created_at: customer.created_at
        });
      }
    }
    
    if (userType === 'astrologer' || userType === '') {
      // Get astrologers with wallet data
      const astrologers = await astrologersCollection
        .find(mongoQuery)
        .limit(userType === 'astrologer' ? limit : Math.floor(limit/2))
        .skip(userType === 'astrologer' ? skip : 0)
        .toArray();
      
      for (const astrologer of astrologers) {
        // Calculate total earned from sessions
        const astrologerSessions = await sessionsCollection
          .find({ astrologer_id: astrologer._id.toString() })
          .toArray();
        
        const totalEarned = astrologerSessions.reduce((sum, session) => {
          const commissionRate = astrologer.commission_rates?.call_rate || 70; // Default 70%
          return sum + ((session.total_amount || 0) * commissionRate / 100);
        }, 0);
        
        const sessionCount = astrologerSessions.length;
        
        wallets.push({
          _id: astrologer._id,
          user_id: astrologer._id,
          user_name: astrologer.full_name,
          user_type: 'astrologer',
          email: astrologer.email_address,
          phone: astrologer.phone_number,
          wallet_balance: astrologer.wallet_balance || 0,
          total_earned: totalEarned,
          total_withdrawn: Math.max(0, totalEarned - (astrologer.wallet_balance || 0)),
          session_count: sessionCount,
          status: astrologer.account_status,
          last_transaction: astrologerSessions.length > 0 ? 
            astrologerSessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at : 
            astrologer.created_at,
          created_at: astrologer.created_at
        });
      }
    }
    
    // Sort by last transaction date
    wallets.sort((a, b) => new Date(b.last_transaction).getTime() - new Date(a.last_transaction).getTime());
    
    // Apply pagination if we got results from both collections
    if (userType === '') {
      wallets = wallets.slice(skip, skip + limit);
    }
    
    // Get total count for pagination
    const customerCount = userType === 'astrologer' ? 0 : await customersCollection.countDocuments(mongoQuery);
    const astrologerCount = userType === 'customer' ? 0 : await astrologersCollection.countDocuments(mongoQuery);
    const totalCount = customerCount + astrologerCount;
    
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    await client.close();
    
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