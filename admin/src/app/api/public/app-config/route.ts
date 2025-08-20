import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = 'trueastrotalkDB';

// GET - Public app configuration (safe data only)
export async function GET(request: NextRequest) {
  try {
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
          defaultRate: config.commission?.defaultRate || 25
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