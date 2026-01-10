import { NextRequest, NextResponse } from 'next/server';
import DatabaseService from '../../../../lib/database';
import {
  SecurityMiddleware,
  InputSanitizer
} from '../../../../lib/security';

// GET - Get pending payout status for astrologer
export async function GET(request: NextRequest) {
  try {
    // Authenticate astrologer
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

    // Only astrologers can access their payout status
    if (authenticatedUser.user_type !== 'astrologer') {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Only astrologers can access payout data'
      }, { status: 403 });
    }

    const astrologerId = authenticatedUser.userId as string;
    const transactionsCollection = await DatabaseService.getCollection('transactions');

    // Check for pending payout request
    const pendingPayout = await transactionsCollection.findOne({
      user_id: astrologerId,
      transaction_type: 'withdrawal',
      status: 'pending'
    });

    if (pendingPayout) {
      return NextResponse.json({
        success: true,
        data: {
          pending_payout: {
            request_id: pendingPayout.transaction_id || pendingPayout._id?.toString(),
            amount: pendingPayout.amount,
            status: pendingPayout.status,
            payment_method: pendingPayout.payment_method,
            requested_at: pendingPayout.created_at
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        pending_payout: null
      }
    });

  } catch (error) {
    console.error('Error fetching payout status:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while fetching payout status'
    }, { status: 500 });
  }
}

// POST - Submit payout request
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Authenticate astrologer
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

    // Only astrologers can request payouts
    if (authenticatedUser.user_type !== 'astrologer') {
      return NextResponse.json({
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Only astrologers can request payouts'
      }, { status: 403 });
    }

    // Parse and sanitize request body
    const body = await request.json();
    const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);

    const { amount } = sanitizedBody;

    // Validate amount
    const withdrawalAmount = Number(amount);
    if (isNaN(withdrawalAmount) || withdrawalAmount < 1000) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_AMOUNT',
        message: 'Minimum payout amount is ₹1000'
      }, { status: 400 });
    }

    if (withdrawalAmount > 50000) {
      return NextResponse.json({
        success: false,
        error: 'AMOUNT_TOO_HIGH',
        message: 'Maximum payout amount is ₹50,000 per request'
      }, { status: 400 });
    }

    const astrologerId = authenticatedUser.userId as string;
    const usersCollection = await DatabaseService.getCollection('users');
    const transactionsCollection = await DatabaseService.getCollection('transactions');

    // Get astrologer details
    const astrologer = await usersCollection.findOne({
      user_id: astrologerId,
      user_type: 'astrologer'
    });

    if (!astrologer) {
      return NextResponse.json({
        success: false,
        error: 'ASTROLOGER_NOT_FOUND',
        message: 'Astrologer profile not found'
      }, { status: 404 });
    }

    // Check for saved payment method
    const hasUpi = astrologer.upi_id && astrologer.upi_id.trim() !== '';
    const hasBank = astrologer.account_number && astrologer.bank_name && astrologer.ifsc_code;

    if (!hasUpi && !hasBank) {
      return NextResponse.json({
        success: false,
        error: 'NO_PAYMENT_METHOD',
        message: 'Please add UPI ID or bank account details in your profile before requesting payout'
      }, { status: 400 });
    }

    // Check available balance
    const availableBalance = Number(astrologer.wallet_balance) || 0;
    const reservedBalance = Number(astrologer.reserved_balance) || 0;
    const effectiveBalance = availableBalance - reservedBalance;

    if (withdrawalAmount > effectiveBalance) {
      return NextResponse.json({
        success: false,
        error: 'INSUFFICIENT_BALANCE',
        message: `Insufficient balance. Available: ₹${effectiveBalance.toFixed(2)}`
      }, { status: 400 });
    }

    // Check for existing pending payout
    const pendingPayout = await transactionsCollection.findOne({
      user_id: astrologerId,
      transaction_type: 'withdrawal',
      status: 'pending'
    });

    if (pendingPayout) {
      return NextResponse.json({
        success: false,
        error: 'PENDING_PAYOUT_EXISTS',
        message: 'You already have a pending payout request. Please wait for it to be processed.'
      }, { status: 400 });
    }

    // Determine payment method (prefer UPI if both exist)
    const paymentMethod = hasUpi ? 'upi' : 'bank_transfer';
    const accountDetails = hasUpi
      ? { upi_id: astrologer.upi_id }
      : {
          account_holder_name: astrologer.account_holder_name,
          account_number: astrologer.account_number,
          bank_name: astrologer.bank_name,
          ifsc_code: astrologer.ifsc_code
        };

    // Create transaction record
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const transaction = {
      transaction_id: transactionId,
      user_id: astrologerId,
      transaction_type: 'withdrawal',
      amount: withdrawalAmount,
      status: 'pending',
      payment_method: paymentMethod,
      account_details: InputSanitizer.sanitizeMongoQuery(accountDetails),
      description: `Payout request - ${paymentMethod.toUpperCase()}`,
      created_at: now,
      updated_at: now,
      request_ip: ip,
      metadata: {
        user_agent: request.headers.get('user-agent') || '',
        astrologer_name: astrologer.full_name,
        astrologer_email: astrologer.email_address
      }
    };

    await transactionsCollection.insertOne(transaction);

    // Reserve the amount
    await usersCollection.updateOne(
      { user_id: astrologerId },
      [
        {
          $set: {
            reserved_balance: {
              $add: [
                { $ifNull: ['$reserved_balance', 0] },
                withdrawalAmount
              ]
            },
            updated_at: now
          }
        }
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Payout request submitted successfully',
      data: {
        request_id: transactionId,
        amount: withdrawalAmount,
        status: 'pending',
        payment_method: paymentMethod,
        estimated_processing_time: '2-3 business days',
        remaining_balance: effectiveBalance - withdrawalAmount
      }
    });

  } catch (error) {
    console.error('Payout request error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while processing payout request'
    }, { status: 500 });
  }
}
