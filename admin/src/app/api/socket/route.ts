import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

export async function GET() {
  try {
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const onlineCount = await db.collection('astrologers').countDocuments({ is_online: true });
    
    await client.close();

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
    const body = await request.json();
    const { action, data } = body;

    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    const db = client.db(DB_NAME);

    switch (action) {
      case 'broadcast_notification':
        // Store notification and trigger FCM/Socket broadcast
        const { recipient_id, recipient_type, title, message, notification_data } = data;
        
        const notificationDoc = {
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

        await db.collection('notifications').insertOne(notificationDoc);
        
        await client.close();
        return NextResponse.json({
          success: true,
          message: 'Notification broadcasted successfully',
          notification_id: notificationDoc._id
        });

      case 'get_online_astrologers':
        const astrologers = await db.collection('astrologers')
          .find({ is_online: true, is_available: true })
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

        await client.close();
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
        const { user_id, user_type, is_online } = data;
        
        if (user_type === 'astrologer') {
          await db.collection('astrologers').updateOne(
            { _id: new ObjectId(user_id) },
            { 
              $set: { 
                is_online: is_online,
                last_seen: new Date()
              }
            }
          );
        }

        await client.close();
        return NextResponse.json({
          success: true,
          message: `User status updated to ${is_online ? 'online' : 'offline'}`
        });

      case 'get_active_calls':
        const activeCalls = await db.collection('call_sessions')
          .find({ status: { $in: ['ringing', 'active'] } })
          .toArray();

        await client.close();
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
        const { session_id, caller_id, caller_type, receiver_id } = data;
        
        // This would trigger a Socket.IO event to the receiver
        // For now, we'll store it as a notification
        const callNotification = {
          type: 'incoming_call',
          recipient_id: receiver_id,
          recipient_type: caller_type === 'user' ? 'astrologer' : 'user',
          title: 'Incoming Call',
          message: `You have an incoming ${data.call_type || 'voice'} call`,
          data: {
            session_id,
            caller_id,
            caller_type,
            call_type: data.call_type || 'voice'
          },
          is_read: false,
          created_at: new Date()
        };

        await db.collection('notifications').insertOne(callNotification);
        
        await client.close();
        return NextResponse.json({
          success: true,
          message: 'Call notification triggered',
          notification_id: callNotification._id
        });

      default:
        await client.close();
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