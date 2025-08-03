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
    const dateFrom = url.searchParams.get('date_from') || '';
    const dateTo = url.searchParams.get('date_to') || '';
    
    const skip = (page - 1) * limit;
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const astrologersCollection = db.collection('astrologers');
    const sessionsCollection = db.collection('sessions');
    
    // Build query for search
    let mongoQuery: Record<string, unknown> = {};
    if (search) {
      mongoQuery = {
        full_name: { $regex: search, $options: 'i' }
      };
    }
    
    // Get astrologers
    const astrologers = await astrologersCollection
      .find(mongoQuery)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const commissions = [];
    
    for (const astrologer of astrologers) {
      // Build session query with date filter
      const sessionQuery: Record<string, unknown> = { astrologer_id: astrologer._id.toString() };
      
      if (dateFrom || dateTo) {
        (sessionQuery as Record<string, unknown>).created_at = {};
        if (dateFrom) ((sessionQuery as Record<string, unknown>).created_at as Record<string, unknown>).$gte = dateFrom;
        if (dateTo) ((sessionQuery as Record<string, unknown>).created_at as Record<string, unknown>).$lte = dateTo;
      }
      
      // Get sessions for this astrologer
      const astrologerSessions = await sessionsCollection
        .find(sessionQuery)
        .toArray();
      
      // Calculate commissions by session type
      const callSessions = astrologerSessions.filter(s => s.session_id?.startsWith('TASC#'));
      const chatSessions = astrologerSessions.filter(s => s.session_id?.startsWith('TASCH#'));
      const videoSessions = astrologerSessions.filter(s => s.session_id?.startsWith('TASV#'));
      
      const callRevenue = callSessions.reduce((sum, s) => sum + (s.total_amount || 0), 0);
      const chatRevenue = chatSessions.reduce((sum, s) => sum + (s.total_amount || 0), 0);
      const videoRevenue = videoSessions.reduce((sum, s) => sum + (s.total_amount || 0), 0);
      
      const callCommission = callRevenue * (astrologer.commission_rates?.call_rate || 70) / 100;
      const chatCommission = chatRevenue * (astrologer.commission_rates?.chat_rate || 65) / 100;
      const videoCommission = videoRevenue * (astrologer.commission_rates?.video_rate || 75) / 100;
      
      const totalRevenue = callRevenue + chatRevenue + videoRevenue;
      const totalCommission = callCommission + chatCommission + videoCommission;
      const platformFee = totalRevenue - totalCommission;
      
      commissions.push({
        _id: astrologer._id,
        astrologer_id: astrologer._id,
        astrologer_name: astrologer.full_name,
        email: astrologer.email_address,
        phone: astrologer.phone_number,
        status: astrologer.account_status,
        commission_rates: astrologer.commission_rates,
        sessions: {
          call: {
            count: callSessions.length,
            revenue: callRevenue,
            commission: callCommission,
            rate: astrologer.commission_rates?.call_rate || 70
          },
          chat: {
            count: chatSessions.length,
            revenue: chatRevenue,
            commission: chatCommission,
            rate: astrologer.commission_rates?.chat_rate || 65
          },
          video: {
            count: videoSessions.length,
            revenue: videoRevenue,
            commission: videoCommission,
            rate: astrologer.commission_rates?.video_rate || 75
          }
        },
        total_sessions: astrologerSessions.length,
        total_revenue: totalRevenue,
        total_commission: totalCommission,
        platform_fee: platformFee,
        wallet_balance: astrologer.wallet_balance || 0,
        last_session: astrologerSessions.length > 0 ? 
          astrologerSessions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at : 
          null,
        created_at: astrologer.created_at
      });
    }
    
    // Sort by total commission desc
    commissions.sort((a, b) => b.total_commission - a.total_commission);
    
    // Get total count for pagination
    const totalCount = await astrologersCollection.countDocuments(mongoQuery);
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      data: {
        commissions,
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
      { success: false, error: 'Failed to fetch commissions' },
      { status: 500 }
    );
  }
}