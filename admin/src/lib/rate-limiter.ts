import { NextRequest } from 'next/server';
import DatabaseService from './database';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  total: number;
}

import { ObjectId } from 'mongodb';

interface RateLimitRecord {
  _id?: ObjectId;
  key: string;
  count: number;
  windowStart: Date;
  lastRequest: Date;
}

class RateLimiter {
  private collectionName = 'rate_limits';

  /**
   * Check if request is within rate limits
   */
  async checkLimit(
    request: NextRequest, 
    identifier: string, 
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    try {
      // Generate unique key for this rate limit
      const key = config.keyGenerator 
        ? config.keyGenerator(request) 
        : this.getDefaultKey(request, identifier);

      const collection = await DatabaseService.getCollection(this.collectionName);
      const now = new Date();
      const windowStart = new Date(now.getTime() - config.windowMs);

      // Clean up old records first (optional optimization)
      await this.cleanup(windowStart);

      // Find or create rate limit record
      let record = await collection.findOne({ key }) as RateLimitRecord | null;

      if (!record) {
        // Create new record
        record = {
          key,
          count: 1,
          windowStart: now,
          lastRequest: now
        };

        await collection.insertOne(record);

        return {
          allowed: true,
          remaining: config.max - 1,
          resetTime: new Date(now.getTime() + config.windowMs),
          total: 1
        };
      }

      // Check if current window has expired
      if (record.windowStart < windowStart) {
        // Reset the window
        record.count = 1;
        record.windowStart = now;
        record.lastRequest = now;

        await collection.updateOne(
          { key },
          { 
            $set: { 
              count: 1, 
              windowStart: now, 
              lastRequest: now 
            } 
          }
        );

        return {
          allowed: true,
          remaining: config.max - 1,
          resetTime: new Date(now.getTime() + config.windowMs),
          total: 1
        };
      }

      // Increment count
      record.count += 1;
      record.lastRequest = now;

      await collection.updateOne(
        { key },
        { 
          $set: { 
            count: record.count, 
            lastRequest: now 
          } 
        }
      );

      const resetTime = new Date(record.windowStart.getTime() + config.windowMs);
      const allowed = record.count <= config.max;

      return {
        allowed,
        remaining: Math.max(0, config.max - record.count),
        resetTime,
        total: record.count
      };

    } catch (error) {
      console.error('Rate limiter error:', error);
      // Fail open - allow request if rate limiter fails
      return {
        allowed: true,
        remaining: 0,
        resetTime: new Date(Date.now() + config.windowMs),
        total: 0
      };
    }
  }

  /**
   * Progressive rate limiting - stricter limits for repeated offenses
   */
  async checkProgressiveLimit(
    request: NextRequest,
    identifier: string,
    baseLimits: { windowMs: number; max: number }[]
  ): Promise<RateLimitResult & { level: number }> {
    const key = this.getDefaultKey(request, identifier);
    
    // Check violation history over longer period (24 hours)
    const violationKey = `${key}:violations`;
    const collection = await DatabaseService.getCollection(this.collectionName);
    
    const violationRecord = await collection.findOne({ 
      key: violationKey,
      windowStart: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours
    }) as RateLimitRecord | null;

    let level = 0;
    if (violationRecord) {
      level = Math.min(violationRecord.count, baseLimits.length - 1);
    }

    const currentLimit = baseLimits[level];
    const result = await this.checkLimit(request, identifier, currentLimit);

    // If limit exceeded, record violation
    if (!result.allowed) {
      await this.recordViolation(violationKey);
    }

    return {
      ...result,
      level
    };
  }

  /**
   * Record a rate limit violation for progressive limiting
   */
  private async recordViolation(violationKey: string): Promise<void> {
    try {
      const collection = await DatabaseService.getCollection(this.collectionName);
      const now = new Date();
      
      await collection.updateOne(
        { key: violationKey },
        {
          $inc: { count: 1 },
          $set: { lastRequest: now },
          $setOnInsert: { windowStart: now }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Error recording violation:', error);
    }
  }

  /**
   * Generate default key from request
   */
  private getDefaultKey(request: NextRequest, identifier: string): string {
    // Get IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Clean IP
    const cleanIp = ip.trim();

    return `${identifier}:${cleanIp}`;
  }

  /**
   * Clean up old rate limit records
   */
  private async cleanup(cutoffDate: Date): Promise<void> {
    try {
      const collection = await DatabaseService.getCollection(this.collectionName);
      await collection.deleteMany({
        windowStart: { $lt: cutoffDate }
      });
    } catch (error) {
      console.error('Rate limiter cleanup error:', error);
    }
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getStatus(
    request: NextRequest, 
    identifier: string
  ): Promise<RateLimitResult | null> {
    try {
      const key = this.getDefaultKey(request, identifier);
      const collection = await DatabaseService.getCollection(this.collectionName);
      
      const record = await collection.findOne({ key }) as RateLimitRecord | null;
      
      if (!record) return null;

      return {
        allowed: true, // This is just status check
        remaining: 0, // Cannot determine without config
        resetTime: record.windowStart,
        total: record.count
      };
    } catch (error) {
      console.error('Rate limiter status error:', error);
      return null;
    }
  }

  /**
   * Reset rate limit for a specific key (admin function)
   */
  async resetLimit(request: NextRequest, identifier: string): Promise<boolean> {
    try {
      const key = this.getDefaultKey(request, identifier);
      const collection = await DatabaseService.getCollection(this.collectionName);
      
      const result = await collection.deleteOne({ key });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Rate limiter reset error:', error);
      return false;
    }
  }
}

// Predefined rate limit configurations
export const RateLimitConfigs = {
  // Forgot password: Very restrictive
  forgotPassword: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3 // Only 3 attempts per 15 minutes
  },

  // Progressive forgot password limits
  forgotPasswordProgressive: [
    { windowMs: 15 * 60 * 1000, max: 3 },      // Level 0: 3 per 15 min
    { windowMs: 30 * 60 * 1000, max: 2 },      // Level 1: 2 per 30 min
    { windowMs: 60 * 60 * 1000, max: 1 },      // Level 2: 1 per hour
    { windowMs: 4 * 60 * 60 * 1000, max: 1 }   // Level 3: 1 per 4 hours
  ],

  // Password reset: Moderate restrictions  
  resetPassword: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10 // 10 attempts per hour
  },

  // Login attempts: Moderate restrictions
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // 10 attempts per 15 minutes
  },

  // Registration: Light restrictions
  registration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5 // 5 registrations per hour per IP
  },

  // API general: Light restrictions
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100 // 100 requests per minute
  }
};

export const rateLimiter = new RateLimiter();
export type { RateLimitConfig, RateLimitResult };