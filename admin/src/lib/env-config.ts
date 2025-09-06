/**
 * Environment Configuration
 * Fail-fast approach - no fallbacks for critical config
 */

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, fallback: string = ''): string {
  return process.env[key] || fallback;
}

// Main environment configuration object
export const envConfig = {
  // Database - REQUIRED
  MONGODB_URL: getRequiredEnv('MONGODB_URL'),
  DB_NAME: getRequiredEnv('DB_NAME'),

  // Authentication & Security - REQUIRED
  JWT_SECRET: getRequiredEnv('JWT_SECRET'),
  NEXTAUTH_SECRET: getRequiredEnv('NEXTAUTH_SECRET'),
  SESSION_SECRET: getRequiredEnv('SESSION_SECRET'),

  // Server - With reasonable defaults
  PORT: parseInt(getOptionalEnv('PORT', '4001')),
  SOCKET_PORT: parseInt(getOptionalEnv('SOCKET_PORT', '4002')),

  // File Upload - With reasonable defaults
  UPLOAD_DIR: getOptionalEnv('UPLOAD_DIR', 'public/uploads'),
  MAX_FILE_SIZE: parseInt(getOptionalEnv('MAX_FILE_SIZE', '5242880')), // 5MB

  // Email Configuration - REQUIRED for production
  SEND_FROM: getRequiredEnv('SEND_FROM'),
  SENDGRID_API_KEY: getRequiredEnv('SENDGRID_API_KEY'),
  SMTP: {
    host: getOptionalEnv('SMTP_HOST'),
    port: parseInt(getOptionalEnv('SMTP_PORT', '587')),
    user: getOptionalEnv('SMTP_USER'),
    password: getOptionalEnv('SMTP_PASSWORD')
  },

  // URLs
  NEXTAUTH_URL: getOptionalEnv('NEXTAUTH_URL', 'http://localhost:4001'),

  // Payment - REQUIRED for transactions
  RAZORPAY_KEY_ID: getRequiredEnv('RAZORPAY_KEY_ID'),
  RAZORPAY_KEY_SECRET: getRequiredEnv('RAZORPAY_KEY_SECRET'),

  // Firebase - Optional (for push notifications)
  FIREBASE_SERVER_KEY: getOptionalEnv('FIREBASE_SERVER_KEY'),

  // Business Configuration - With defaults
  COMMISSION_RATE: parseFloat(getOptionalEnv('DEFAULT_COMMISSION_RATE', '0.25')),
  MINIMUM_PAYOUT_THRESHOLD: parseInt(getOptionalEnv('MINIMUM_PAYOUT_THRESHOLD', '1000')),
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
   * Check if specific service is configured
   */
  isServiceConfigured: (service: 'firebase' | 'sendgrid' | 'razorpay') => {
    switch (service) {
      case 'firebase':
        return !!envConfig.FIREBASE_SERVER_KEY;
      case 'sendgrid':
        return !!envConfig.SENDGRID_API_KEY;
      case 'razorpay':
        return !!(envConfig.RAZORPAY_KEY_ID && envConfig.RAZORPAY_KEY_SECRET);
      default:
        return false;
    }
  },

  /**
   * Get configuration summary
   */
  getConfigSummary: () => {
    return {
      database: envConfig.MONGODB_URL.includes('localhost') ? 'Local MongoDB' : 'Remote MongoDB',
      port: envConfig.PORT,
      socketPort: envConfig.SOCKET_PORT,
      services: {
        firebase: envHelpers.isServiceConfigured('firebase'),
        sendgrid: envHelpers.isServiceConfigured('sendgrid'),
        razorpay: envHelpers.isServiceConfigured('razorpay'),
      }
    };
  }
};

// Export individual values for convenience (backward compatibility)
export const {
  MONGODB_URL,
  DB_NAME,
  JWT_SECRET,
  NEXTAUTH_SECRET,
  PORT
} = envConfig;