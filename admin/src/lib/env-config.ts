/**
 * Unified Environment Configuration
 * This file automatically detects the environment and provides the correct values
 * No more multiple .env files - just one .env file with all configurations
 */

const APP_ENVIRONMENT = process.env.APP_ENVIRONMENT || 'local';
const isLocal = APP_ENVIRONMENT === 'local';
const isProduction = APP_ENVIRONMENT === 'production';

// Main environment configuration object
export const envConfig = {
  // Environment detection
  APP_ENVIRONMENT,
  isLocal,
  isProduction,

  // Database
  MONGODB_URL: process.env.MONGODB_URL || 'mongodb://localhost:27017',
  DB_NAME: process.env.DB_NAME || 'trueastrotalkDB',

  // Authentication & Security
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'your-nextauth-secret',
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret',

  // URLs (Single place, auto-detects based on environment)
  NEXTAUTH_URL: isLocal 
    ? (process.env.NEXTAUTH_URL || 'http://localhost:3000') 
    : (process.env.NEXTAUTH_URL || 'https://www.trueastrotalk.com'),
  API_BASE_URL: isLocal 
    ? (process.env.API_BASE_URL || 'http://localhost:3000/api') 
    : (process.env.API_BASE_URL || 'https://www.trueastrotalk.com/api'),

  // Server
  PORT: parseInt(process.env.PORT || '3000'),

  // File Upload
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'public/uploads',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB

  // Payment Gateway
  RAZORPAY: {
    KEY_ID: process.env.RAZORPAY_KEY_ID || '',
    KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  },

  // Email Configuration
  SMTP: {
    HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.SMTP_PORT || '587'),
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
  },

  // Firebase
  FIREBASE_SERVER_KEY: process.env.FIREBASE_SERVER_KEY || '',

  // Business Configuration
  COMMISSION_RATE: parseFloat(process.env.DEFAULT_COMMISSION_RATE || '0.25'),
  MINIMUM_PAYOUT_THRESHOLD: parseInt(process.env.MINIMUM_PAYOUT_THRESHOLD || '1000'),

  // CORS (Single place, auto-detects based on environment)
  ALLOWED_ORIGINS: (isLocal 
    ? (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
    : (process.env.ALLOWED_ORIGINS || 'https://www.trueastrotalk.com,https://trueastrotalk.com')
  ).split(','),

  // Logging (Single place, auto-detects based on environment)
  LOG_LEVEL: isLocal 
    ? (process.env.LOG_LEVEL || 'debug')
    : (process.env.LOG_LEVEL || 'info'),

  // Google OAuth
  GOOGLE: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  },

  // Additional Services
  TWILIO: {
    ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
    AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  },
  
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
};

// Helper functions for common operations
export const envHelpers = {
  /**
   * Get database connection string
   */
  getDatabaseUrl: () => {
    return `${envConfig.MONGODB_URL}/${envConfig.DB_NAME}`;
  },

  /**
   * Get full API URL
   */
  getApiUrl: (endpoint: string) => {
    return `${envConfig.API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  },

  /**
   * Check if specific service is configured
   */
  isServiceConfigured: (service: 'razorpay' | 'smtp' | 'firebase' | 'google' | 'twilio' | 'sendgrid') => {
    switch (service) {
      case 'razorpay':
        return !!(envConfig.RAZORPAY.KEY_ID && envConfig.RAZORPAY.KEY_SECRET);
      case 'smtp':
        return !!(envConfig.SMTP.USER && envConfig.SMTP.PASS);
      case 'firebase':
        return !!envConfig.FIREBASE_SERVER_KEY;
      case 'google':
        return !!(envConfig.GOOGLE.CLIENT_ID && envConfig.GOOGLE.CLIENT_SECRET);
      case 'twilio':
        return !!(envConfig.TWILIO.ACCOUNT_SID && envConfig.TWILIO.AUTH_TOKEN);
      case 'sendgrid':
        return !!envConfig.SENDGRID_API_KEY;
      default:
        return false;
    }
  },

  /**
   * Get environment-specific configuration summary
   */
  getConfigSummary: () => {
    return {
      environment: envConfig.APP_ENVIRONMENT,
      isLocal: envConfig.isLocal,
      isProduction: envConfig.isProduction,
      database: envConfig.MONGODB_URL.includes('localhost') ? 'Local MongoDB' : 'Remote MongoDB',
      baseUrl: envConfig.API_BASE_URL,
      services: {
        razorpay: envHelpers.isServiceConfigured('razorpay'),
        smtp: envHelpers.isServiceConfigured('smtp'),
        firebase: envHelpers.isServiceConfigured('firebase'),
        google: envHelpers.isServiceConfigured('google'),
        twilio: envHelpers.isServiceConfigured('twilio'),
        sendgrid: envHelpers.isServiceConfigured('sendgrid'),
      }
    };
  }
};

// Export individual values for convenience (backward compatibility)
export const {
  APP_ENVIRONMENT,
  MONGODB_URL,
  DB_NAME,
  JWT_SECRET,
  NEXTAUTH_SECRET,
  NEXTAUTH_URL,
  API_BASE_URL,
  PORT
} = envConfig;

// Log configuration summary in local environment
if (isLocal) {
  console.log('🔧 Environment Configuration:', envHelpers.getConfigSummary());
}