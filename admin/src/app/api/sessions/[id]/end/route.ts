import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';
import { ObjectId } from 'mongodb';
import { jwtVerify } from 'jose';
import NotificationService from '@/lib/notifications';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

/**
 * PATCH /api/sessions/[id]/end
 * End a session and finalize billing
 * Called by mobile app when a call/chat session ends
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
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

    const { id: sessionId } = await params;

    // Parse request body
    const body = await request.json();
    const { durationMinutes, totalAmount } = body;

    if (durationMinutes === undefined || totalAmount === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: durationMinutes, totalAmount'
      }, { status: 400 });
    }

    // Connect to MongoDB
    const sessionsCollection = await DatabaseService.getCollection('sessions');
    const usersCollection = await DatabaseService.getCollection('users');

    // Find the session - try by _id first, then by session_id
    let session = null;

    // Try finding by ObjectId if valid
    if (ObjectId.isValid(sessionId)) {
      session = await sessionsCollection.findOne({ _id: new ObjectId(sessionId) });
    }

    // If not found, try by session_id field
    if (!session) {
      session = await sessionsCollection.findOne({ session_id: sessionId });
    }

    if (!session) {
      console.error(`Session not found: ${sessionId}`);
      return NextResponse.json({
        success: false,
        error: `Session not found: ${sessionId}`
      }, { status: 404 });
    }

    // Determine session type
    const sessionType = session.session_type || 'video_call';

    // Get current session billing info to calculate amount to deduct
    const currentAmount = session.total_amount || 0;
    const amountToDeduct = totalAmount - currentAmount;

    console.log(`📞 [SESSION END] Session: ${sessionId}, Duration: ${durationMinutes}min, Total: ₹${totalAmount}, ToDeduct: ₹${amountToDeduct}`);

    // Only deduct if there's a positive amount to charge
    if (amountToDeduct > 0) {
      // Get user's current wallet balance
      const user = await usersCollection.findOne(
        { user_id: session.user_id },
        { projection: { wallet_balance: 1, full_name: 1 } }
      );

      if (!user) {
        return NextResponse.json({
          success: false,
          error: 'User not found'
        }, { status: 404 });
      }

      const currentBalance = user.wallet_balance || 0;

      // Check if user has sufficient balance
      if (currentBalance < amountToDeduct) {
        console.warn(`⚠️ Insufficient balance for user ${session.user_id}: Required ₹${amountToDeduct}, Available ₹${currentBalance}`);
        // Continue anyway to mark session as ended - don't fail the session end
      } else {
        // Deduct amount from user's wallet
        const newBalance = currentBalance - amountToDeduct;
        await usersCollection.updateOne(
          { user_id: session.user_id },
          {
            $set: { wallet_balance: newBalance },
            $currentDate: { updated_at: true }
          }
        );
        console.log(`💰 Deducted ₹${amountToDeduct} from customer ${session.user_id}. New balance: ₹${newBalance}`);
      }

      // Credit astrologer's wallet (80% of the amount, 20% platform commission)
      const astrologerShare = amountToDeduct * 0.8;

      const astrologer = await usersCollection.findOne(
        { user_id: session.astrologer_id },
        { projection: { wallet_balance: 1, full_name: 1 } }
      );

      if (astrologer) {
        const astrologerCurrentBalance = astrologer.wallet_balance || 0;
        const astrologerNewBalance = astrologerCurrentBalance + astrologerShare;

        await usersCollection.updateOne(
          { user_id: session.astrologer_id },
          {
            $set: { wallet_balance: astrologerNewBalance },
            $currentDate: { updated_at: true }
          }
        );
        console.log(`💰 Credited ₹${astrologerShare} to astrologer ${session.astrologer_id}. New balance: ₹${astrologerNewBalance}`);

        // Create/Update transaction records
        const transactionsCollection = await DatabaseService.getCollection('transactions');

        // Customer debit transaction
        await transactionsCollection.updateOne(
          {
            user_id: session.user_id,
            transaction_type: 'debit',
            session_id: sessionId,
            service_type: sessionType
          },
          {
            $set: {
              amount: totalAmount,
              description: `Payment for ${sessionType} session (${durationMinutes} minutes)`,
              status: 'completed',
              updated_at: new Date()
            },
            $setOnInsert: {
              created_at: new Date()
            }
          },
          { upsert: true }
        );

        // Astrologer credit transaction
        const astrologerTotalShare = totalAmount * 0.8;
        await transactionsCollection.updateOne(
          {
            user_id: session.astrologer_id,
            recipient_user_id: session.astrologer_id,
            transaction_type: 'credit',
            session_id: sessionId,
            service_type: sessionType
          },
          {
            $set: {
              amount: astrologerTotalShare,
              description: `Earnings from ${sessionType} session (${durationMinutes} minutes)`,
              status: 'completed',
              updated_at: new Date()
            },
            $setOnInsert: {
              created_at: new Date()
            }
          },
          { upsert: true }
        );

        // Platform commission transaction
        const totalPlatformCommission = totalAmount * 0.2;
        await transactionsCollection.updateOne(
          {
            transaction_type: 'commission',
            session_id: sessionId,
            service_type: sessionType
          },
          {
            $set: {
              amount: totalPlatformCommission,
              description: `Platform commission for ${sessionType} session (${durationMinutes} minutes)`,
              status: 'completed',
              updated_at: new Date()
            },
            $setOnInsert: {
              created_at: new Date()
            }
          },
          { upsert: true }
        );

        console.log(`📝 Transaction records created for session ${sessionId}`);

        // Send notifications
        try {
          await NotificationService.sendSessionPaymentDebitNotification(
            session.user_id as string,
            sessionType,
            totalAmount,
            durationMinutes
          );

          await NotificationService.sendSessionPaymentCreditNotification(
            session.astrologer_id as string,
            sessionType,
            astrologerTotalShare,
            durationMinutes
          );
        } catch (notificationError) {
          console.error('Failed to send payment notifications:', notificationError);
        }
      }
    }

    // Update session to completed
    await sessionsCollection.updateOne(
      { _id: session._id },
      {
        $set: {
          duration_minutes: durationMinutes,
          total_amount: totalAmount,
          status: 'completed',
          ended_at: new Date(),
          billing_updated_at: new Date()
        }
      }
    );

    console.log(`✅ [SESSION END] Session ${sessionId} marked as completed`);

    return NextResponse.json({
      success: true,
      message: 'Session ended successfully',
      sessionId,
      durationMinutes,
      totalAmount,
      amountDeducted: amountToDeduct > 0 ? amountToDeduct : 0
    });

  } catch(error) {
    console.error('Error ending session:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
