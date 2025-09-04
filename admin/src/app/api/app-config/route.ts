import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// GET - App configuration for authenticated users only
export async function GET(request: NextRequest) {
  try {
    // Get token from header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required to access app configuration' 
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

    // Verify user is a valid user (customer or astrologer)
    if (!payload.userId || !payload.user_type) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid user',
        message: 'Invalid user session' 
      }, { status: 403 });
    }

    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URL);
    await client.connect();
    
    const db = client.db(DB_NAME);
    const settingsCollection = db.collection('app_settings');

    try {
      // Get current configuration
      const config = await settingsCollection.findOne({ type: 'general' });
      
      if (!config) {
        return NextResponse.json({
          success: false,
          error: 'Configuration not found',
          message: 'App configuration has not been set up yet'
        }, { status: 404 });
      }

      await client.close();

      // Return only safe, public configuration data
      const publicConfig = {
        razorpay: {
          keyId: config.razorpay?.keyId || '',
          environment: config.razorpay?.environment || 'test'
          // Note: keySecret is NOT included for security
        },
        app: {
          name: config.app?.name || 'True Astrotalk',
          version: config.app?.version || '1.0.0',
          minSupportedVersion: config.app?.minSupportedVersion || '1.0.0'
        },
        commission: {
          defaultRate: config.commission?.defaultRate || 25,
          gstRate: config.commission?.gstRate || 18
          // Note: minimumPayout is internal business logic, not needed by app
        }
      };

      return NextResponse.json({
        success: true,
        config: publicConfig
      });

    } catch (error) {
      await client.close();
      throw error;
    }

  } catch(error) {
    console.error('Error loading public configuration:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while loading the app configuration'
    }, { status: 500 });
  }
}