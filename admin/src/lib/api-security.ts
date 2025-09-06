import { NextRequest, NextResponse } from 'next/server';
import { SecurityMiddleware, InputSanitizer } from './security';
import { ErrorHandler } from './error-handler';
import * as crypto from 'crypto';

// Authenticated user type based on JWT payload
export interface AuthenticatedUser {
  id: string;
  email: string;
  user_type: 'administrator' | 'manager' | 'customer' | 'astrologer';
  name?: string;
  phone?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
}

/**
 * Comprehensive API Security Middleware
 * Provides rate limiting, authentication, CSRF protection, and input validation
 */

// Extended NextRequest type with authenticated user
export interface AuthenticatedNextRequest extends NextRequest {
  user?: AuthenticatedUser;
}

// Handler context type for route handlers (Next.js expects this structure)
export interface RouteHandlerContext {
  params?: Promise<Record<string, string | string[]>>;
}

export interface SecurityOptions {
  requireAuth?: boolean;
  allowedRoles?: string[];
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  requireCSRF?: boolean;
  validateInput?: boolean;
}

const DEFAULT_SECURITY_OPTIONS: SecurityOptions = {
  requireAuth: true,
  allowedRoles: ['administrator', 'manager'],
  rateLimit: {
    requests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  requireCSRF: true,
  validateInput: true,
};

/**
 * CSRF Token Management
 */
class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_HEADER = 'x-csrf-token';
  private static readonly TOKEN_COOKIE = 'csrf-token';
  
  static generateToken(): string {
    return crypto.randomBytes(this.TOKEN_LENGTH).toString('hex');
  }
  
  static async validateToken(request: NextRequest): Promise<boolean> {
    const headerToken = request.headers.get(this.TOKEN_HEADER);
    const cookieToken = request.cookies.get(this.TOKEN_COOKIE)?.value;
    
    if (!headerToken || !cookieToken) {
      console.log('CSRF validation failed - missing tokens:', {
        hasHeader: !!headerToken,
        hasCookie: !!cookieToken
      });
      return false;
    }
    
    // Constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(headerToken),
      Buffer.from(cookieToken)
    );
    
    if (!isValid) {
      console.log('CSRF validation failed - token mismatch');
    }
    
    return isValid;
  }
  
  static setTokenCookie(response: NextResponse): NextResponse {
    const token = this.generateToken();
    
    response.cookies.set(this.TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });
    
    response.headers.set(this.TOKEN_HEADER, token);
    return response;
  }
}

/**
 * Main security middleware wrapper
 */
export function withSecurity(
  handler: (request: AuthenticatedNextRequest) => Promise<NextResponse>,
  options: SecurityOptions = DEFAULT_SECURITY_OPTIONS
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const securityOptions = { ...DEFAULT_SECURITY_OPTIONS, ...options };
      const ip = request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      
      // 1. Rate Limiting
      if (securityOptions.rateLimit) {
        const rateLimitKey = `${request.nextUrl.pathname}:${ip}`;
        const rateLimitResult = await SecurityMiddleware.checkRateLimit(
          request,
          rateLimitKey,
          securityOptions.rateLimit.requests,
          securityOptions.rateLimit.windowMs
        );
        
        if (!rateLimitResult.allowed) {
          console.log(`🚫 Rate limit exceeded for ${rateLimitKey}`);
          return NextResponse.json({
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryAfter: rateLimitResult.retryAfter,
          }, { 
            status: 429,
            headers: {
              'Retry-After': rateLimitResult.retryAfter?.toString() || '900',
              'X-RateLimit-Limit': securityOptions.rateLimit.requests.toString(),
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            }
          });
        }
      }
      
      // 2. Authentication Check
      let authenticatedUser = null;
      if (securityOptions.requireAuth) {
        try {
          authenticatedUser = await SecurityMiddleware.authenticateRequest(request);
          
          // Check role-based access
          if (securityOptions.allowedRoles && 
              !securityOptions.allowedRoles.includes(authenticatedUser.user_type as string)) {
            console.log(`🚫 Access denied for user type: ${authenticatedUser.user_type}`);
            return NextResponse.json({
              success: false,
              error: 'ACCESS_DENIED',
              message: 'You do not have permission to access this resource.',
            }, { status: 403 });
          }
        } catch (error) {
          console.log(`🚫 Authentication failed: ${error}`);
          return NextResponse.json({
            success: false,
            error: 'AUTHENTICATION_REQUIRED',
            message: 'Valid authentication token is required.',
          }, { status: 401 });
        }
      }
      
      // 3. CSRF Protection (for state-changing operations)
      if (securityOptions.requireCSRF && 
          ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        const isValidCSRF = await CSRFProtection.validateToken(request);
        
        if (!isValidCSRF) {
          console.log(`🚫 CSRF validation failed for ${request.method} ${request.nextUrl.pathname}`);
          return NextResponse.json({
            success: false,
            error: 'CSRF_VALIDATION_FAILED',
            message: 'Invalid or missing CSRF token.',
          }, { status: 403 });
        }
      }
      
      // 4. Input Sanitization (automatic for all requests with body)
      if (securityOptions.validateInput && 
          ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        try {
          const contentType = request.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const body = await request.json();
            const sanitizedBody = InputSanitizer.sanitizeMongoQuery(body);
            
            // Create new request with sanitized body
            // Clone the request to preserve cookies and other properties
            const clonedHeaders = new Headers(request.headers);
            const sanitizedRequest = new NextRequest(request.url, {
              method: request.method,
              headers: clonedHeaders,
              body: JSON.stringify(sanitizedBody),
            });
            
            // Copy cookies from original request
            request.cookies.getAll().forEach(cookie => {
              sanitizedRequest.cookies.set(cookie.name, cookie.value);
            });
            
            // Add authenticated user to request if available
            if (authenticatedUser) {
              (sanitizedRequest as AuthenticatedNextRequest).user = authenticatedUser as unknown as AuthenticatedUser;
            }
            
            return await handler(sanitizedRequest);
          }
        } catch (error) {
          console.error('Input validation error:', error);
          return NextResponse.json({
            success: false,
            error: 'INVALID_INPUT',
            message: 'Invalid request body.',
          }, { status: 400 });
        }
      }
      
      // Add authenticated user to request if available
      if (authenticatedUser) {
        (request as AuthenticatedNextRequest).user = authenticatedUser as unknown as AuthenticatedUser;
      }
      
      // 5. Execute the handler
      const response = await handler(request);
      
      // 6. Add security headers to response
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      
      // Set CSRF token for GET requests
      if (request.method === 'GET' && securityOptions.requireCSRF) {
        return CSRFProtection.setTokenCookie(response);
      }
      
      return response;
      
    } catch (error) {
      console.error('Security middleware error:', error);
      return ErrorHandler.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

/**
 * Preset security configurations for different endpoint types
 */
export const SecurityPresets = {
  // Public endpoints (no auth required)
  public: {
    requireAuth: false,
    requireCSRF: false,
    rateLimit: {
      requests: 30,
      windowMs: 15 * 60 * 1000,
    },
  },
  
  // Authentication endpoints (stricter rate limiting)
  auth: {
    requireAuth: false,
    requireCSRF: true,
    rateLimit: {
      requests: 5,
      windowMs: 15 * 60 * 1000,
    },
  },
  
  // Admin-only endpoints
  admin: {
    requireAuth: true,
    allowedRoles: ['administrator'],
    requireCSRF: true,
    rateLimit: {
      requests: 100,
      windowMs: 15 * 60 * 1000,
    },
  },
  
  // Manager endpoints
  manager: {
    requireAuth: true,
    allowedRoles: ['administrator', 'manager'],
    requireCSRF: true,
    rateLimit: {
      requests: 100,
      windowMs: 15 * 60 * 1000,
    },
  },
  
  // Customer endpoints
  customer: {
    requireAuth: true,
    allowedRoles: ['administrator', 'manager', 'customer'],
    requireCSRF: true,
    rateLimit: {
      requests: 50,
      windowMs: 15 * 60 * 1000,
    },
  },
  
  // Astrologer endpoints
  astrologer: {
    requireAuth: true,
    allowedRoles: ['administrator', 'manager', 'astrologer'],
    requireCSRF: true,
    rateLimit: {
      requests: 50,
      windowMs: 15 * 60 * 1000,
    },
  },
  
  // File upload endpoints
  upload: {
    requireAuth: true,
    requireCSRF: true,
    validateInput: false, // Skip for multipart/form-data
    rateLimit: {
      requests: 20,
      windowMs: 60 * 60 * 1000, // 1 hour
    },
  },
  
  // Webhook endpoints (external services)
  webhook: {
    requireAuth: false,
    requireCSRF: false,
    rateLimit: {
      requests: 100,
      windowMs: 60 * 1000, // 1 minute
    },
  },
};

// Export CSRF protection for manual use
export { CSRFProtection };