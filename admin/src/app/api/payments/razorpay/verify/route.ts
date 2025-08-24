import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import DatabaseService from '../../../../../lib/database';
import { SecurityMiddleware, InputSanitizer, EncryptionSecurity } from '../../../../../lib/security';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    console.log(`✅ Payment verification request from IP: ${ip}`);

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

    // Get payment order from database
    const paymentsCollection = await DatabaseService.getCollection('payment_orders');
    const paymentOrder = await paymentsCollection.findOne({
      razorpay_order_id: razorpay_order_id,
      user_id: new ObjectId(user.userId as string),
      status: 'created'
    });

    if (!paymentOrder) {
      console.log(`❌ Payment order not found: ${razorpay_order_id} for user ${user.userId}`);
      return NextResponse.json({
        success: false,
        error: 'PAYMENT_ORDER_NOT_FOUND',
        message: 'Payment order not found or already processed'
      }, { status: 404 });
    }

    // Verify amount matches
    if (Math.abs((paymentOrder.amount as number) - amount) > 0.01) {
      console.log(`❌ Amount mismatch for order ${razorpay_order_id}: expected ${paymentOrder.amount}, got ${amount}`);
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
    if (!razorpayConfig?.keyId || !razorpayConfig?.encryptedKeySecret) {
      console.error('Missing Razorpay credentials during verification');
      return NextResponse.json({
        success: false,
        error: 'PAYMENT_SERVICE_ERROR',
        message: 'Payment verification service is temporarily unavailable'
      }, { status: 503 });
    }

    // Get Razorpay secret (temporarily without decryption)
    let RAZORPAY_KEY_SECRET;
    try {
      // Temporarily use direct value (fix encryption later)
      RAZORPAY_KEY_SECRET = razorpayConfig.encryptedKeySecret as string;
      
      // Skip decryption for now
      /*
      const encryptionPassword = process.env.ENCRYPTION_PASSWORD;
      if (!encryptionPassword) {
        throw new Error('ENCRYPTION_PASSWORD not configured');
      }
      
      RAZORPAY_KEY_SECRET = EncryptionSecurity.decrypt(
        razorpayConfig.encryptedKeySecret as string,
        encryptionPassword
      );
      */
    } catch (decryptError) {
      console.error('Failed to decrypt Razorpay secret during verification:', decryptError);
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
      console.log(`❌ Invalid signature for payment ${razorpay_payment_id}`);
      
      // Mark payment as failed
      await paymentsCollection.updateOne(
        { _id: paymentOrder._id },
        { 
          $set: { 
            status: 'failed',
            failure_reason: 'Invalid signature',
            updated_at: new Date(),
            razorpay_payment_id: razorpay_payment_id
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
      console.log(`⚠️ Proceeding with local verification for payment ${razorpay_payment_id} due to API error`);
    }

    // Additional verification if API call succeeded
    if (paymentDetails) {
      if (paymentDetails.status !== 'captured' && paymentDetails.status !== 'authorized') {
        console.log(`❌ Payment ${razorpay_payment_id} status is ${paymentDetails.status}`);
        
        await paymentsCollection.updateOne(
          { _id: paymentOrder._id },
          { 
            $set: { 
              status: 'failed',
              failure_reason: `Payment status: ${paymentDetails.status}`,
              updated_at: new Date(),
              razorpay_payment_id: razorpay_payment_id,
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
        console.log(`❌ API amount mismatch for payment ${razorpay_payment_id}: expected ${expectedAmountInPaise}, got ${apiAmountInPaise}`);
        
        await paymentsCollection.updateOne(
          { _id: paymentOrder._id },
          { 
            $set: { 
              status: 'failed',
              failure_reason: 'Amount mismatch with Razorpay API',
              updated_at: new Date(),
              razorpay_payment_id: razorpay_payment_id,
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
    const transactionsCollection = await DatabaseService.getCollection('wallet_transactions');
    
    // Update payment order status
    await paymentsCollection.updateOne(
      { _id: paymentOrder._id },
      { 
        $set: { 
          status: 'completed',
          razorpay_payment_id: razorpay_payment_id,
          razorpay_signature: razorpay_signature,
          verified_at: new Date(),
          updated_at: new Date(),
          ...(paymentDetails && { razorpay_payment_details: paymentDetails })
        }
      }
    );

    // Process based on purpose
    if (purpose === 'wallet_recharge') {
      // Add amount to user wallet
      await usersCollection.updateOne(
        { _id: new ObjectId(user.userId as string) },
        { 
          $inc: { wallet_balance: amount },
          $set: { updated_at: new Date() }
        } as Record<string, unknown>
      );

      // Create wallet transaction record
      await transactionsCollection.insertOne({
        _id: new ObjectId(),
        user_id: new ObjectId(user.userId as string),
        transaction_type: 'credit',
        amount: amount,
        purpose: 'wallet_recharge',
        payment_method: 'razorpay',
        razorpay_order_id: razorpay_order_id,
        razorpay_payment_id: razorpay_payment_id,
        status: 'completed',
        created_at: new Date(),
        metadata: {
          ip_address: ip,
          user_agent: request.headers.get('user-agent') || ''
        }
      });
    }

    console.log(`✅ Payment verified and processed successfully: ${razorpay_payment_id} for user ${user.userId}`);

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