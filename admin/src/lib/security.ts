import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import DatabaseService from './database';
// import { jwtVerify } from 'jose';

// Security configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const SALT_ROUNDS = 12;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET environment variables are required');
}

if (JWT_SECRET.length < 32 || JWT_REFRESH_SECRET.length < 32) {
  throw new Error('JWT secrets must be at least 32 characters long');
}

/**
 * Password security utilities
 */
export class PasswordSecurity {
  /**
   * Hash password using bcrypt with salt
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate secure random password
   */
  static generateSecurePassword(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (password.length < 8) {
      issues.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      issues.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      issues.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      issues.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      issues.push('Password must contain at least one special character');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

/**
 * JWT Token utilities
 */
export class JWTSecurity {
  /**
   * Generate access token (long-lived for better UX)
   */
  static generateAccessToken(payload: Record<string, unknown>): string {
    return jwt.sign(payload, JWT_SECRET!, {
      expiresIn: '90d', // 90 days - users stay logged in
      algorithm: 'HS256',
      issuer: 'trueastrotalk-api',
      audience: 'trueastrotalk-app'
    });
  }

  /**
   * Generate refresh token (long-lived)
   */
  static generateRefreshToken(payload: Record<string, unknown>): string {
    return jwt.sign(payload, JWT_REFRESH_SECRET!, {
      expiresIn: '180d', // 180 days - 6 months
      algorithm: 'HS256',
      issuer: 'trueastrotalk-api',
      audience: 'trueastrotalk-app'
    });
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token: string): Record<string, unknown> | null {
    try {
      const payload = jwt.verify(token, JWT_SECRET!, {
        algorithms: ['HS256'],
        issuer: 'trueastrotalk-api',
        audience: 'trueastrotalk-app'
      });
      
      // JWT verify can return string or JwtPayload, we only want objects
      if (typeof payload === 'object' && payload !== null) {
        return payload as Record<string, unknown>;
      }
      
      return null;
    } catch {
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): Record<string, unknown> | null {
    try {
      const payload = jwt.verify(token, JWT_REFRESH_SECRET!, {
        algorithms: ['HS256'],
        issuer: 'trueastrotalk-api',
        audience: 'trueastrotalk-app'
      });
      
      // JWT verify can return string or JwtPayload, we only want objects
      if (typeof payload === 'object' && payload !== null) {
        return payload as Record<string, unknown>;
      }
      
      return null;
    } catch {
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Extract token from Authorization header
   */
  static extractTokenFromHeader(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  /**
   * Extract token from cookies
   */
  static extractTokenFromCookies(request: NextRequest, cookieName: string = 'auth-token'): string | null {
    return request.cookies.get(cookieName)?.value || null;
  }
}

/**
 * Input validation schemas
 */
export const ValidationSchemas = {
  // User registration schema
  userRegistration: Joi.object({
    name: Joi.string().min(2).max(100).required().pattern(/^[a-zA-Z\s]+$/),
    email: Joi.string().email().required().lowercase(),
    phone: Joi.string().pattern(/^[+]?[\d\s\-()]+$/).min(10).max(15).required(),
    password: Joi.string().min(8).required(),
    user_type: Joi.string().valid('customer', 'astrologer').required(),
    date_of_birth: Joi.date().max('now').optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional()
  }),

  // User login schema
  userLogin: Joi.object({
    email: Joi.string().email().required().lowercase(),
    password: Joi.string().required(),
    user_type: Joi.string().valid('customer', 'astrologer').optional()
  }),

  // Product schema
  product: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    price: Joi.number().positive().required(),
    category: Joi.string().min(2).max(100).required(),
    stock_quantity: Joi.number().integer().min(0).required(),
    images: Joi.array().items(Joi.string().uri()).max(10).optional()
  }),

  // Order schema
  order: Joi.object({
    user_id: Joi.string().required(),
    items: Joi.array().items(Joi.object({
      product_id: Joi.string().required(),
      quantity: Joi.number().integer().positive().required(),
      price: Joi.number().positive().required()
    })).min(1).required(),
    shipping_address: Joi.object().required(),
    payment_method: Joi.string().valid('razorpay', 'cod', 'wallet').required()
  }),

  // Chat message schema
  chatMessage: Joi.object({
    session_id: Joi.string().required(),
    sender_id: Joi.string().required(),
    sender_type: Joi.string().valid('customer', 'astrologer').required(),
    message_type: Joi.string().valid('text', 'image', 'file', 'system').required(),
    content: Joi.string().max(5000).when('message_type', {
      is: 'text',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    image_url: Joi.string().uri().optional()
  })
};

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  /**
   * Sanitize string input to prevent XSS
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Sanitize MongoDB query to prevent NoSQL injection
   */
  static sanitizeMongoQuery(query: Record<string, unknown>): Record<string, unknown> {
    if (typeof query !== 'object' || query === null) {
      return query;
    }

    // Handle arrays separately to preserve their structure
    if (Array.isArray(query)) {
      return query.map(item => {
        if (typeof item === 'object' && item !== null) {
          return this.sanitizeMongoQuery(item as Record<string, unknown>);
        } else if (typeof item === 'string') {
          return this.sanitizeString(item);
        }
        return item;
      }) as unknown as Record<string, unknown>;
    }

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(query)) {
      // Remove MongoDB operators that shouldn't be in user input
      if (typeof key === 'string' && key.startsWith('$')) {
        continue;
      }

      // Handle arrays
      if (Array.isArray(value)) {
        sanitized[key] = value.map(item => {
          if (typeof item === 'object' && item !== null) {
            return this.sanitizeMongoQuery(item as Record<string, unknown>);
          } else if (typeof item === 'string') {
            return this.sanitizeString(item);
          }
          return item;
        });
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeMongoQuery(value as Record<string, unknown>);
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Validate and sanitize email
   */
  static sanitizeEmail(email: string): string {
    return email.toLowerCase().trim().replace(/[^\w@.-]/g, '');
  }

  /**
   * Sanitize phone number
   */
  static sanitizePhoneNumber(phone: string): string {
    return phone.replace(/[^\d+\-\s()]/g, '').trim();
  }
}

/**
 * Rate limiting configuration
 */
export const RateLimitConfig = {
  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { error: 'Too many authentication attempts, please try again later' }
  },

  // General API endpoints
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: { error: 'Too many requests, please try again later' }
  },

  // File upload endpoints
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: { error: 'Upload limit exceeded, please try again later' }
  },

  // Payment endpoints
  payment: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 payment attempts per 5 minutes
    message: { error: 'Payment rate limit exceeded, please try again later' }
  }
};

/**
 * Encryption utilities for sensitive data
 */
export class EncryptionSecurity {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly keyLength = 32;

  /**
   * Generate encryption key from password
   */
  private static generateKey(password: string, salt: string): Buffer {
    return crypto.pbkdf2Sync(password, salt, 10000, this.keyLength, 'sha256');
  }

  /**
   * Encrypt sensitive data
   */
  static encrypt(text: string, password: string): string {
    const salt = crypto.randomBytes(16);
    const key = this.generateKey(password, salt.toString('hex'));
    
    const cipher = crypto.createCipher(this.algorithm, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return salt.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  static decrypt(encryptedData: string, password: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const [saltHex, encrypted] = parts;
    const salt = Buffer.from(saltHex, 'hex');
    const key = this.generateKey(password, salt.toString('hex'));
    
    const decipher = crypto.createDecipher(this.algorithm, key);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

/**
 * Security middleware helpers
 */
export class SecurityMiddleware {
  /**
   * Validate request body against schema
   */
  static validateRequest(schema: Joi.ObjectSchema) {
    return async (request: NextRequest) => {
      const body = await request.json();
      const { error, value } = schema.validate(body, { abortEarly: false });
      
      if (error) {
        throw new Error(`Validation error: ${error.details.map(d => d.message).join(', ')}`);
      }
      
      return value;
    };
  }

  /**
   * Extract and verify user from JWT token
   */
  static async authenticateRequest(request: NextRequest): Promise<Record<string, unknown>> {
    // Try to get token from header first, then cookies
    let token = JWTSecurity.extractTokenFromHeader(request);
    if (!token) {
      token = JWTSecurity.extractTokenFromCookies(request);
    }

    if (!token) {
      throw new Error('Authentication token required');
    }

    const payload = JWTSecurity.verifyAccessToken(token);
    if (!payload) {
      throw new Error('Invalid authentication token');
    }
    return payload;
  }

  /**
   * Authenticate request AND verify user still exists in database
   * Returns 401 UNAUTHORIZED if user doesn't exist (account deleted)
   * This should be used for all mobile app API endpoints
   */
  static async authenticateAndVerifyUser(request: NextRequest): Promise<{
    payload: Record<string, unknown>;
    user: Record<string, unknown>;
  }> {
    // First, verify the JWT token
    const payload = await this.authenticateRequest(request);

    // Get user_id from token payload
    const userId = payload.userId || payload.user_id || payload.sub;
    if (!userId) {
      const error = new Error('Invalid token: missing user identifier');
      (error as Error & { code?: string }).code = 'INVALID_TOKEN';
      throw error;
    }

    // Check if user exists in database
    const usersCollection = await DatabaseService.getCollection('users');
    const user = await usersCollection.findOne({
      $or: [
        { user_id: userId },
        { _id: typeof userId === 'string' && userId.length === 24 ? new (require('mongodb').ObjectId)(userId) : null }
      ].filter(Boolean)
    });

    if (!user) {
      // User has been deleted - throw specific error
      const error = new Error('User account not found');
      (error as Error & { code?: string }).code = 'USER_NOT_FOUND';
      (error as Error & { status?: number }).status = 401;
      throw error;
    }

    // Check if account is active
    if (user.account_status === 'deleted' || user.account_status === 'banned') {
      const error = new Error(`Account ${user.account_status}`);
      (error as Error & { code?: string }).code = 'ACCOUNT_INACTIVE';
      (error as Error & { status?: number }).status = 401;
      throw error;
    }

    return { payload, user };
  }

  /**
   * Check user authorization
   */
  static authorizeUser(user: Record<string, unknown>, allowedRoles: string[]): boolean {
    if (!user || !user.user_type) {
      return false;
    }
    
    return allowedRoles.includes(user.user_type as string) || allowedRoles.includes('all');
  }

  /**
   * Check rate limits for request
   */
  static async checkRateLimit(
    request: NextRequest,
    identifier: string,
    maxRequests: number,
    windowMs: number,
    customKeyGenerator?: (req: NextRequest) => string
  ): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
    try {
      // Import rate limiter dynamically to avoid circular imports
      const { rateLimiter } = await import('./rate-limiter');
      
      const result = await rateLimiter.checkLimit(request, identifier, {
        windowMs,
        max: maxRequests,
        keyGenerator: customKeyGenerator
      });

      return {
        allowed: result.allowed,
        remaining: result.remaining,
        retryAfter: result.allowed ? undefined : Math.ceil((result.resetTime.getTime() - Date.now()) / 1000)
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      // Fail open for now - allow request if rate limiting fails
      return { allowed: true, remaining: 0 };
    }
  }

  /**
   * Check progressive rate limits (stricter with repeated violations)
   */
  static async checkProgressiveRateLimit(
    request: NextRequest,
    identifier: string
  ): Promise<{ allowed: boolean; remaining: number; retryAfter?: number; level: number }> {
    try {
      // Import rate limiter and configs dynamically
      const { rateLimiter, RateLimitConfigs } = await import('./rate-limiter');
      
      const result = await rateLimiter.checkProgressiveLimit(
        request, 
        identifier, 
        RateLimitConfigs.forgotPasswordProgressive
      );

      return {
        allowed: result.allowed,
        remaining: result.remaining,
        level: result.level,
        retryAfter: result.allowed ? undefined : Math.ceil((result.resetTime.getTime() - Date.now()) / 1000)
      };
    } catch (error) {
      console.error('Progressive rate limit check failed:', error);
      // Fail open for now
      return { allowed: true, remaining: 0, level: 0 };
    }
  }
}

const SecurityExports = {
  PasswordSecurity,
  JWTSecurity,
  ValidationSchemas,
  InputSanitizer,
  RateLimitConfig,
  EncryptionSecurity,
  SecurityMiddleware
};

export default SecurityExports;

