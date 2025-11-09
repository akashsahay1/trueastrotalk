import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import DatabaseService from '../../../../../lib/database';
import { SecurityMiddleware, InputSanitizer } from '../../../../../lib/security';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Authenticate user
    let user;
    try {
      user = await SecurityMiddleware.authenticateRequest(request);
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
    
    const { 
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount,
      purpose = 'wallet_recharge'
    } = sanitizedBody;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({
        success: false,
        error: 'MISSING_PAYMENT_DATA',
        message: 'Required payment verification data is missing'
      }, { status: 400 });
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'INVALID_AMOUNT',
        message: 'Valid amount is required for verification'
      }, { status: 400 });
    }

    // Get the user's actual user_id from database (not from JWT which might contain MongoDB ObjectId)
    const usersCollectionForUserId = await DatabaseService.getCollection('users');
    let actualUserId = user.userId as string;
    
    // If the JWT userId looks like a MongoDB ObjectId, fetch the actual user_id
    if (typeof user.userId === 'string' && user.userId.length === 24) {
      try {
        const userData = await usersCollectionForUserId.findOne({ _id: new ObjectId(user.userId as string) });
        if (userData && userData.user_id) {
          actualUserId = userData.user_id;
        }
      } catch {
      }
    }

    // Get transaction from unified transactions collection
    const transactionsCollection = await DatabaseService.getCollection('transactions');
    const paymentTransaction = await transactionsCollection.findOne({
      razorpay_order_id: razorpay_order_id,
      user_id: actualUserId,
      status: 'pending'
    });

    if (!paymentTransaction) {
      return NextResponse.json({
        success: false,
        error: 'PAYMENT_TRANSACTION_NOT_FOUND',
        message: 'Payment transaction not found or already processed'
      }, { status: 404 });
    }

    // Verify amount matches
    if (Math.abs((paymentTransaction.amount as number) - amount) > 0.01) {
      return NextResponse.json({
        success: false,
        error: 'AMOUNT_MISMATCH',
        message: 'Payment amount does not match order amount'
      }, { status: 400 });
    }

    // Get Razorpay credentials from database
    const settingsCollection = await DatabaseService.getCollection('app_settings');
    const config = await settingsCollection.findOne({ type: 'general' });
    
    const configObj = config as Record<string, unknown>;
    const razorpayConfig = configObj?.razorpay as Record<string, unknown>;
    if (!razorpayConfig?.keyId || !razorpayConfig?.keySecret) {
      console.error('Missing Razorpay credentials during verification');
      return NextResponse.json({
        success: false,
        error: 'PAYMENT_SERVICE_ERROR',
        message: 'Payment verification service is temporarily unavailable'
      }, { status: 503 });
    }

    // Get Razorpay secret (stored as plain text in database)
    let RAZORPAY_KEY_SECRET;
    try {
      RAZORPAY_KEY_SECRET = razorpayConfig.keySecret as string;
    } catch (credentialError) {
      console.error('Failed to get Razorpay secret during verification:', credentialError);
      return NextResponse.json({
        success: false,
        error: 'PAYMENT_SERVICE_ERROR',
        message: 'Payment verification service configuration error'
      }, { status: 500 });
    }

    // Verify Razorpay signature
    const body_string = (razorpay_order_id as string) + '|' + (razorpay_payment_id as string);
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body_string)
      .digest('hex');

    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(razorpay_signature as string, 'hex')
    );

    if (!isSignatureValid) {
      
      // Mark transaction as failed
      await transactionsCollection.updateOne(
        { _id: paymentTransaction._id },
        { 
          $set: { 
            status: 'failed',
            failure_reason: 'Invalid signature',
            updated_at: new Date().toISOString(),
            payment_id: razorpay_payment_id
          }
        }
      );

      return NextResponse.json({
        success: false,
        error: 'PAYMENT_VERIFICATION_FAILED',
        message: 'Payment verification failed. Please contact support if amount was deducted.'
      }, { status: 400 });
    }

    // Verify payment with Razorpay API
    const razorpayApiUrl = `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`;
    const authHeader = `Basic ${Buffer.from(`${razorpayConfig.keyId}:${RAZORPAY_KEY_SECRET}`).toString('base64')}`;

    let paymentDetails: Record<string, unknown> | null = null;
    try {
      const response = await fetch(razorpayApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Razorpay API error: ${response.status}`);
      }

      paymentDetails = await response.json();
    } catch (apiError) {
      console.error('Razorpay API verification failed:', apiError);
      
      // Still proceed with local verification if API is down
      // but log the issue for manual review
    }

    // Additional verification if API call succeeded
    if (paymentDetails) {
      if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
        
        await transactionsCollection.updateOne(
          { _id: paymentTransaction._id },
          { 
            $set: { 
              status: 'failed',
              failure_reason: `Payment status: ${paymentDetails.status}`,
              updated_at: new Date().toISOString(),
              payment_id: razorpay_payment_id,
              razorpay_payment_details: paymentDetails
            }
          }
        );

        return NextResponse.json({
          success: false,
          error: 'PAYMENT_NOT_CAPTURED',
          message: `Payment ${paymentDetails.status}. Please try again or contact support.`
        }, { status: 400 });
      }

      // Verify amount in API response
      const apiAmountInPaise = paymentDetails.amount;
      const expectedAmountInPaise = Math.round(amount * 100);
      
      if (apiAmountInPaise !== expectedAmountInPaise) {
        
        await transactionsCollection.updateOne(
          { _id: paymentTransaction._id },
          { 
            $set: { 
              status: 'failed',
              failure_reason: 'Amount mismatch with Razorpay API',
              updated_at: new Date().toISOString(),
              payment_id: razorpay_payment_id,
              razorpay_payment_details: paymentDetails
            }
          }
        );

        return NextResponse.json({
          success: false,
          error: 'AMOUNT_VERIFICATION_FAILED',
          message: 'Payment amount verification failed. Please contact support.'
        }, { status: 400 });
      }
    }

    // Payment verification successful - process the payment
    const usersCollection = await DatabaseService.getCollection('users');
    
    // Update transaction status to completed
    await transactionsCollection.updateOne(
      { _id: paymentTransaction._id },
      { 
        $set: { 
          status: 'completed',
          payment_id: razorpay_payment_id,
          razorpay_signature: razorpay_signature,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(paymentDetails && { razorpay_payment_details: paymentDetails })
        }
      }
    );

    // Process based on purpose
    if (purpose === 'wallet_recharge') {
      // Add amount to user wallet - find by custom user_id, not MongoDB ObjectId
      await usersCollection.updateOne(
        { user_id: actualUserId },
        { 
          $inc: { wallet_balance: amount },
          $set: { updated_at: new Date() }
        } as Record<string, unknown>
      );
    } else if (purpose === 'product_purchase') {
      // Update order status and payment status
      const ordersCollection = await DatabaseService.getCollection('orders');
      
      // Find the order by razorpay_order_id first
      let order = await ordersCollection.findOne({
        razorpay_order_id: razorpay_order_id,
        user_id: actualUserId
      });
      
      // If not found by razorpay_order_id, try to find by user_id, amount and pending status
      if (!order) {
        order = await ordersCollection.findOne({
          user_id: actualUserId,
          total_amount: amount,
          payment_status: { $in: ['pending', 'pending_payment'] },
          created_at: {
            $gte: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Within last 30 minutes
          }
        });
        
        if (order) {
          // Update the order with razorpay_order_id for future reference
          await ordersCollection.updateOne(
            { _id: order._id },
            { $set: { razorpay_order_id: razorpay_order_id } }
          );
        }
      }
      
      if (order) {
        // Update order with payment details and confirmed status
        await ordersCollection.updateOne(
          { _id: order._id },
          {
            $set: {
              payment_status: 'paid',
              payment_id: razorpay_payment_id,
              status: 'confirmed',
              confirmed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }
        );
      } else {
        console.error(`❌ Order not found for razorpay_order_id: ${razorpay_order_id}`);
      }
    }
    // Note: Transaction record is already created and updated above
    // No need for additional transaction record creation


    return NextResponse.json({
      success: true,
      message: 'Payment verified and processed successfully',
      data: {
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        amount: amount,
        purpose: purpose,
        status: 'completed',
        verified_at: new Date()
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Payment verification failed due to server error. Please contact support.'
    }, { status: 500 });
  }
}