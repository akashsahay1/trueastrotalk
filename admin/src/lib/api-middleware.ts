import { NextRequest, NextResponse } from 'next/server';
import { ErrorHandler, ErrorCode } from './error-handler';

/**
 * API Middleware for common request processing
 * Handles rate limiting, CORS, request size limits, etc.
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class APIMiddleware {
  private static rateLimitStore: RateLimitStore = {};

  /**
   * Rate limiting middleware
   */
  static rateLimit(options: {
    windowMs: number;
    max: number;
    keyGenerator?: (req: NextRequest) => string;
  }) {
    return async (request: NextRequest): Promise<void> => {
      const key = options.keyGenerator ? 
        options.keyGenerator(request) : 
        this.getClientIP(request) || 'anonymous';

      const now = Date.now();
      const windowStart = now - options.windowMs;

      // Clean up old entries
      Object.keys(this.rateLimitStore).forEach(k => {
        if (this.rateLimitStore[k].resetTime < windowStart) {
          delete this.rateLimitStore[k];
        }
      });

      // Check current count
      const current = this.rateLimitStore[key];
      if (!current) {
        this.rateLimitStore[key] = {
          count: 1,
          resetTime: now + options.windowMs
        };
        return;
      }

      if (current.count >= options.max) {
        throw ErrorHandler.createError(
          ErrorCode.RATE_LIMIT_EXCEEDED,
          'Rate limit exceeded',
          'Too many requests. Please try again later.'
        );
      }

      current.count++;
    };
  }

  /**
   * Request size validation
   */
  static validateRequestSize(maxSize: number = 10 * 1024 * 1024) { // 10MB default
    return async (request: NextRequest): Promise<void> => {
      const contentLength = request.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > maxSize) {
        throw ErrorHandler.createError(
          ErrorCode.VALIDATION_ERROR,
          'Request too large',
          'Request body is too large'
        );
      }
    };
  }

  /**
   * CORS handling
   */
  static handleCORS(options: {
    origin?: string | string[];
    methods?: string[];
    headers?: string[];
  } = {}) {
    return async (request: NextRequest): Promise<NextResponse | void> => {
      const origin = request.headers.get('origin');
      const method = request.method;

      // Handle preflight requests
      if (method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 200 });
        
        if (options.origin) {
          if (Array.isArray(options.origin)) {
            if (origin && options.origin.includes(origin)) {
              response.headers.set('Access-Control-Allow-Origin', origin);
            }
          } else if (options.origin === '*' || options.origin === origin) {
            response.headers.set('Access-Control-Allow-Origin', options.origin);
          }
        }

        if (options.methods) {
          response.headers.set('Access-Control-Allow-Methods', options.methods.join(', '));
        }

        if (options.headers) {
          response.headers.set('Access-Control-Allow-Headers', options.headers.join(', '));
        }

        response.headers.set('Access-Control-Max-Age', '86400');
        return response;
      }
    };
  }

  /**
   * Request timeout handling
   */
  static timeout(timeoutMs: number = 30000) {
    return async <T>(operation: () => Promise<T>): Promise<T> => {
      return Promise.race([
        operation(),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(ErrorHandler.createError(
              ErrorCode.TIMEOUT_ERROR,
              'Request timeout',
              'Request took too long to process'
            ));
          }, timeoutMs);
        })
      ]);
    };
  }

  /**
   * Content-Type validation
   */
  static validateContentType(allowedTypes: string[] = ['application/json']) {
    return async (request: NextRequest): Promise<void> => {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        const contentType = request.headers.get('content-type');
        if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
          throw ErrorHandler.createError(
            ErrorCode.VALIDATION_ERROR,
            'Invalid content type',
            `Content-Type must be one of: ${allowedTypes.join(', ')}`
          );
        }
      }
    };
  }

  /**
   * Request ID generation for tracking
   */
  static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Security headers
   */
  static addSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    return response;
  }

  /**
   * Request logging
   */
  static logRequest(request: NextRequest, startTime: number = Date.now()): void {
    const duration = Date.now() - startTime;
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent');
    
    console.log(`${request.method} ${request.url} - ${ip} - ${duration}ms - ${userAgent}`);
  }

  /**
   * Get client IP address
   */
  private static getClientIP(request: NextRequest): string | undefined {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      undefined
    );
  }

  /**
   * Comprehensive middleware composer
   */
  static compose(...middlewares: Array<(req: NextRequest) => Promise<NextResponse | void>>) {
    return async (request: NextRequest): Promise<NextResponse | void> => {
      for (const middleware of middlewares) {
        const result = await middleware(request);
        if (result instanceof NextResponse) {
          return result;
        }
      }
    };
  }

  /**
   * Common API middleware stack
   */
  static createAPIMiddleware(options: {
    rateLimit?: { windowMs: number; max: number };
    maxRequestSize?: number;
    allowedContentTypes?: string[];
    cors?: { origin?: string | string[]; methods?: string[]; headers?: string[] };
  } = {}) {
    const middlewares = [];

    // CORS handling
    if (options.cors) {
      middlewares.push(this.handleCORS(options.cors));
    }

    // Rate limiting
    if (options.rateLimit) {
      middlewares.push(this.rateLimit(options.rateLimit));
    }

    // Request size validation
    if (options.maxRequestSize) {
      middlewares.push(this.validateRequestSize(options.maxRequestSize));
    }

    // Content-Type validation
    if (options.allowedContentTypes) {
      middlewares.push(this.validateContentType(options.allowedContentTypes));
    }

    return this.compose(...middlewares);
  }
}

export default APIMiddleware;