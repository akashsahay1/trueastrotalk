import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { jwtVerify } from 'jose';
import { withSecurity, SecurityPresets } from '@/lib/api-security';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// GET - Load configuration
async function handleGET(request: NextRequest) {
  try {
    // Get token from cookies (httpOnly cookie)
    const token = request.cookies.get('auth-token')?.value;

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

    // Verify user is admin
    if (payload.user_type !== 'administrator') {
      return NextResponse.json({ 
        success: false,
        error: 'Forbidden',
        message: 'Access denied. Admin access required.' 
      }, { status: 403 });
    }

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const settingsCollection = db.collection('app_settings');

    try {
      // Get current configuration
      let config = await settingsCollection.findOne({ type: 'general' });
      
      if (!config) {
        // Create default configuration if none exists
        const newConfig = {
          type: 'general',
          razorpay: {
            keyId: '',
            keySecret: '',
            environment: 'test'
          },
          app: {
            name: 'True Astrotalk',
            version: '1.0.0',
            minSupportedVersion: '1.0.0'
          },
          commission: {
            defaultRate: 25,
            gstRate: 18,
            minimumPayout: 1000
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const result = await settingsCollection.insertOne(newConfig);
        config = { ...newConfig, _id: result.insertedId };
      }

      await client.close();

      // Create response config with only the needed properties
      const responseConfig = {
        razorpay: config.razorpay,
        app: config.app,
        commission: config.commission
      };

      return NextResponse.json({
        success: true,
        config: responseConfig
      });

    } catch (error) {
      await client.close();
      throw error;
    }

  } catch(error) {
    console.error('Error loading configuration:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while loading the configuration'
    }, { status: 500 });
  }
}

// POST - Save configuration
async function handlePOST(request: NextRequest) {
  try {
    // Get token from cookies (httpOnly cookie)
    const token = request.cookies.get('auth-token')?.value;

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

    // Verify user is admin
    if (payload.user_type !== 'administrator') {
      return NextResponse.json({ 
        success: false,
        error: 'Forbidden',
        message: 'Access denied. Admin access required.' 
      }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.razorpay?.keyId || !body.razorpay?.keySecret) {
      return NextResponse.json({ 
        success: false,
        error: 'Validation error',
        message: 'Razorpay Key ID and Secret are required' 
      }, { status: 400 });
    }

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const settingsCollection = db.collection('app_settings');

    try {
      // Update configuration
      const configData = {
        type: 'general',
        razorpay: {
          keyId: body.razorpay.keyId,
          keySecret: body.razorpay.keySecret,
          environment: body.razorpay.environment || 'test'
        },
        app: {
          name: body.app?.name || 'True Astrotalk',
          version: body.app?.version || '1.0.0',
          minSupportedVersion: body.app?.minSupportedVersion || '1.0.0'
        },
        commission: {
          defaultRate: body.commission?.defaultRate || 25,
          gstRate: body.commission?.gstRate || 18,
          minimumPayout: body.commission?.minimumPayout || 1000
        },
        updated_at: new Date().toISOString()
      };

      await settingsCollection.updateOne(
        { type: 'general' },
        { 
          $set: configData,
          $setOnInsert: { created_at: new Date().toISOString() }
        },
        { upsert: true }
      );

      await client.close();

      return NextResponse.json({
        success: true,
        message: 'Configuration saved successfully'
      });

    } catch (error) {
      await client.close();
      throw error;
    }

  } catch(error) {
    console.error('Error saving configuration:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while saving the configuration'
    }, { status: 500 });
  }
}

// Export secured handlers with admin-only access
export const GET = withSecurity(handleGET, SecurityPresets.admin);
export const POST = withSecurity(handlePOST, SecurityPresets.admin);