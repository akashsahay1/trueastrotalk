import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '30');
    const search = url.searchParams.get('search') || '';
    const dateFrom = url.searchParams.get('date_from') || '';
    const dateTo = url.searchParams.get('date_to') || '';

    const skip = (page - 1) * limit;

    const usersCollection = await DatabaseService.getCollection('users');
    const sessionsCollection = await DatabaseService.getCollection('sessions');
    const settingsCollection = await DatabaseService.getCollection('app_settings');

    // Get default commission rate from app settings
    const settings = await settingsCollection.findOne({ type: 'general' });
    const defaultCommissionRate = (settings as Record<string, unknown>)?.commission
      ? ((settings as Record<string, unknown>).commission as Record<string, unknown>).defaultRate as number
      : 0;

    // Build query for search - only get astrologers from users collection
    const mongoQuery: Record<string, unknown> = { user_type: 'astrologer' };
    if (search) {
      mongoQuery.full_name = { $regex: search, $options: 'i' };
    }

    // Get astrologers
    const astrologers = await usersCollection
      .find(mongoQuery)
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const commissions = [];
    
    for (const astrologer of astrologers) {
      // Build session query - only completed sessions count for revenue
      const sessionQuery: Record<string, unknown> = {
        astrologer_id: astrologer.user_id,
        status: 'completed'
      };

      if (dateFrom || dateTo) {
        (sessionQuery as Record<string, unknown>).created_at = {};
        if (dateFrom) ((sessionQuery as Record<string, unknown>).created_at as Record<string, unknown>).$gte = dateFrom;
        if (dateTo) ((sessionQuery as Record<string, unknown>).created_at as Record<string, unknown>).$lte = dateTo;
      }

      // Get completed sessions for this astrologer
      const astrologerSessions = await sessionsCollection
        .find(sessionQuery)
        .toArray();
      
      // Calculate commissions by session type (using session_type field)
      const callSessions = astrologerSessions.filter(s => s.session_type === 'call' || s.session_type === 'audio_call');
      const chatSessions = astrologerSessions.filter(s => s.session_type === 'chat');
      const videoSessions = astrologerSessions.filter(s => s.session_type === 'video_call' || s.session_type === 'video');
      
      const callRevenue = callSessions.reduce((sum, s) => sum + (s.total_amount || 0), 0);
      const chatRevenue = chatSessions.reduce((sum, s) => sum + (s.total_amount || 0), 0);
      const videoRevenue = videoSessions.reduce((sum, s) => sum + (s.total_amount || 0), 0);
      
      // commission_percentage is the PLATFORM's cut (e.g., 20% means platform takes 20%, astrologer gets 80%)
      const callPlatformRate = astrologer.commission_percentage?.call ?? defaultCommissionRate;
      const chatPlatformRate = astrologer.commission_percentage?.chat ?? defaultCommissionRate;
      const videoPlatformRate = astrologer.commission_percentage?.video ?? defaultCommissionRate;

      // Platform commission (what platform keeps)
      const callPlatformCommission = callRevenue * callPlatformRate / 100;
      const chatPlatformCommission = chatRevenue * chatPlatformRate / 100;
      const videoPlatformCommission = videoRevenue * videoPlatformRate / 100;

      // Astrologer earnings (what astrologer gets = revenue - platform commission)
      const callAstrologerEarnings = callRevenue - callPlatformCommission;
      const chatAstrologerEarnings = chatRevenue - chatPlatformCommission;
      const videoAstrologerEarnings = videoRevenue - videoPlatformCommission;

      const totalRevenue = callRevenue + chatRevenue + videoRevenue;
      const totalPlatformCommission = callPlatformCommission + chatPlatformCommission + videoPlatformCommission;
      const totalAstrologerEarnings = totalRevenue - totalPlatformCommission;
      
      commissions.push({
        _id: astrologer._id,
        astrologer_id: astrologer.user_id, // Use custom user_id to match transactions
        astrologer_name: astrologer.full_name,
        email: astrologer.email_address,
        phone: astrologer.phone_number,
        status: astrologer.account_status,
        // Platform commission rates (what platform takes)
        commission_percentage: astrologer.commission_percentage,
        commission_rates: {
          call_rate: callPlatformRate,
          chat_rate: chatPlatformRate,
          video_rate: videoPlatformRate
        },
        sessions: {
          call: {
            count: callSessions.length,
            revenue: callRevenue,
            astrologer_earnings: callAstrologerEarnings,
            platform_commission: callPlatformCommission,
            platform_rate: callPlatformRate
          },
          chat: {
            count: chatSessions.length,
            revenue: chatRevenue,
            astrologer_earnings: chatAstrologerEarnings,
            platform_commission: chatPlatformCommission,
            platform_rate: chatPlatformRate
          },
          video: {
            count: videoSessions.length,
            revenue: videoRevenue,
            astrologer_earnings: videoAstrologerEarnings,
            platform_commission: videoPlatformCommission,
            platform_rate: videoPlatformRate
          }
        },
        total_sessions: astrologerSessions.length,
        total_revenue: totalRevenue,
        total_astrologer_earnings: totalAstrologerEarnings,  // What astrologer gets (80%)
        total_platform_commission: totalPlatformCommission,   // What platform keeps (20%)
        // Keep old field names for backward compatibility
        total_commission: totalAstrologerEarnings,
        platform_fee: totalPlatformCommission,
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
    const totalCount = await usersCollection.countDocuments(mongoQuery);
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
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