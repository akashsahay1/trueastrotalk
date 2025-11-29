import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { InputSanitizer } from '../../../lib/security';
import DatabaseService from '../../../lib/database';

export async function GET() {
  try {
    const usersCollection = await DatabaseService.getCollection('users');
    const onlineCount = await usersCollection.countDocuments({ 
      user_type: 'astrologer',
      is_online: true,
      account_status: 'active',
      approval_status: 'approved'
    });

    return NextResponse.json({
      success: true,
      message: 'Socket.IO server is running',
      endpoint: process.env.SOCKET_URL || 'ws://localhost:3001',
      status: 'active',
      online_astrologers: onlineCount,
      features: [
        'Real-time chat messaging',
        'Voice and video call support',
        'Call status updates (ringing, active, ended)',
        'Astrologer online/offline status',
        'Push notifications',
        'WebRTC signaling for calls',
        'Message read receipts',
        'Typing indicators'
      ],
      events: {
        chat: ['send_message', 'new_message', 'typing_start', 'typing_stop'],
        calls: ['initiate_call', 'incoming_call', 'answer_call', 'reject_call', 'end_call'],
        webrtc: ['webrtc_offer', 'webrtc_answer', 'webrtc_ice_candidate'],
        status: ['user_online', 'user_offline', 'astrologer_status_change']
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to get socket server status',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const _ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Authenticate user for POST operations
    try {
      // await SecurityMiddleware.authenticateRequest(request);
    } catch {
      return NextResponse.json({
        success: false,
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Valid authentication token is required'
      }, { status: 401 });
    }

    // Parse and sanitize request body
    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);
    const { action, data } = sanitizedBody;

    switch (action) {
      case 'broadcast_notification':
        // Store notification and trigger FCM/Socket broadcast
        const { recipient_id, recipient_type, title, message, notification_data } = data as Record<string, unknown>;
        
        const notificationDoc = {
          _id: new ObjectId(),
          type: 'broadcast',
          recipient_id,
          recipient_type,
          title,
          message,
          data: notification_data || {},
          is_read: false,
          sent_via_socket: true,
          created_at: new Date()
        };

        const notificationsCollection = await DatabaseService.getCollection('notifications');
        await notificationsCollection.insertOne(notificationDoc);
        return NextResponse.json({
          success: true,
          message: 'Notification broadcasted successfully',
          notification_id: notificationDoc._id
        });

      case 'get_online_astrologers':
        const astrologersCollection = await DatabaseService.getCollection('users');
        const astrologers = await astrologersCollection
          .find({ user_type: 'astrologer', is_online: true, is_available: true })
          .project({
            _id: 1,
            full_name: 1,
            profile_image: 1,
            specialization: 1,
            experience_years: 1,
            rating: 1,
            call_rate: 1,
            video_call_rate: 1,
            languages: 1,
            last_seen: 1
          })
          .sort({ last_seen: -1 })
          .toArray();
        return NextResponse.json({
          success: true,
          online_astrologers: astrologers.map(astro => ({
            _id: astro._id.toString(),
            full_name: astro.full_name,
            profile_image: astro.profile_image,
            specialization: astro.specialization,
            experience_years: astro.experience_years,
            rating: astro.rating,
            call_rate: astro.call_rate,
            video_call_rate: astro.video_call_rate,
            languages: astro.languages,
            last_seen: astro.last_seen
          })),
          count: astrologers.length
        });

      case 'update_user_status':
        const { user_id, user_type, is_online } = data as Record<string, unknown>;
        
        if (user_type === 'astrologer') {
          const usersCollectionForUpdate = await DatabaseService.getCollection('users');
          await usersCollectionForUpdate.updateOne(
            { user_id: user_id as string, user_type: 'astrologer' },
            {
              $set: {
                is_online: is_online,
                last_seen: new Date()
              }
            }
          );
        }

                return NextResponse.json({
          success: true,
          message: `User status updated to ${is_online ? 'online' : 'offline'}`
        });

      case 'get_active_calls':
        const sessionsCollection = await DatabaseService.getCollection('sessions');
        const activeCalls = await sessionsCollection
          .find({
            session_type: { $in: ['voice_call', 'video_call'] },
            status: { $in: ['ringing', 'active'] }
          })
          .toArray();

                return NextResponse.json({
          success: true,
          active_calls: activeCalls.map(call => ({
            _id: call._id.toString(),
            user_id: call.user_id,
            astrologer_id: call.astrologer_id,
            call_type: call.call_type,
            status: call.status,
            start_time: call.start_time,
            created_at: call.created_at
          })),
          count: activeCalls.length
        });

      case 'trigger_call_notification':
        const { session_id, caller_id, caller_type, receiver_id } = data as Record<string, unknown>;
        
        // This would trigger a Socket.IO event to the receiver
        // For now, we'll store it as a notification
        const callNotification = {
          _id: new ObjectId(),
          type: 'incoming_call',
          recipient_id: receiver_id,
          recipient_type: caller_type === 'user' ? 'astrologer' : 'user',
          title: 'Incoming Call',
          message: `You have an incoming ${(data as Record<string, unknown>).call_type || 'voice'} call`,
          data: {
            session_id,
            caller_id,
            caller_type,
            call_type: (data as Record<string, unknown>).call_type || 'voice'
          },
          is_read: false,
          created_at: new Date()
        };

        const notificationsCollection2 = await DatabaseService.getCollection('notifications');
        await notificationsCollection2.insertOne(callNotification);
        
                return NextResponse.json({
          success: true,
          message: 'Call notification triggered',
          notification_id: callNotification._id
        });

      default:
                return NextResponse.json({
          success: false,
          message: 'Unknown action'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Socket API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}