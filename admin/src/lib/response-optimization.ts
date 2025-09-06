/**
 * Response optimization utilities for better performance
 */

import { NextResponse } from 'next/server';

export class ResponseOptimizer {
  /**
   * Create optimized JSON response with caching headers
   */
  static json(
    data: unknown,
    options: {
      status?: number;
      cache?: {
        maxAge?: number;
        public?: boolean;
        staleWhileRevalidate?: number;
      };
      compress?: boolean;
    } = {}
  ): NextResponse {
    const { status = 200, cache, compress = true } = options;
    
    const response = NextResponse.json(data, { status });

    // Add caching headers
    if (cache) {
      const cacheControl = [];
      
      if (cache.public) {
        cacheControl.push('public');
      } else {
        cacheControl.push('private');
      }
      
      if (cache.maxAge !== undefined) {
        cacheControl.push(`max-age=${cache.maxAge}`);
      }
      
      if (cache.staleWhileRevalidate) {
        cacheControl.push(`stale-while-revalidate=${cache.staleWhileRevalidate}`);
      }
      
      response.headers.set('Cache-Control', cacheControl.join(', '));
    }

    // Add compression headers
    if (compress) {
      response.headers.set('Vary', 'Accept-Encoding');
    }

    // Add performance headers
    response.headers.set('X-Response-Time', Date.now().toString());
    
    return response;
  }

  /**
   * Create paginated response with optimized structure
   */
  static paginated(
    data: unknown[],
    pagination: {
      page: number;
      limit: number;
      total: number;
      hasNext?: boolean;
      hasPrev?: boolean;
    },
    options: {
      cacheMaxAge?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): NextResponse {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    
    const response = {
      success: true,
      data,
      pagination: {
        current_page: pagination.page,
        per_page: pagination.limit,
        total_items: pagination.total,
        total_pages: totalPages,
        has_next: pagination.hasNext ?? pagination.page < totalPages,
        has_prev: pagination.hasPrev ?? pagination.page > 1
      },
      ...(options.metadata && { metadata: options.metadata })
    };

    return this.json(response, {
      cache: options.cacheMaxAge ? {
        maxAge: options.cacheMaxAge,
        public: false,
        staleWhileRevalidate: Math.floor(options.cacheMaxAge / 2)
      } : undefined
    });
  }

  /**
   * Create error response with consistent format
   */
  static error(
    message: string,
    options: {
      error?: string;
      status?: number;
      details?: unknown;
    } = {}
  ): NextResponse {
    const { error = 'API_ERROR', status = 500, details } = options;
    
    const response: Record<string, unknown> = {
      success: false,
      error,
      message,
      timestamp: new Date().toISOString()
    };
    
    if (details) {
      response.details = details;
    }

    return this.json(response, { status });
  }

  /**
   * Add ETag header for client-side caching
   */
  static addETag(response: NextResponse, data: unknown): NextResponse {
    const hash = this.generateETag(data);
    response.headers.set('ETag', hash);
    return response;
  }

  /**
   * Generate simple ETag hash
   */
  private static generateETag(data: unknown): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `"${Math.abs(hash).toString(36)}"`;
  }

  /**
   * Check if client has cached version
   */
  static hasValidCache(request: Request, etag: string): boolean {
    const ifNoneMatch = request.headers.get('if-none-match');
    return ifNoneMatch === etag;
  }

  /**
   * Create not modified response
   */
  static notModified(): NextResponse {
    return new NextResponse(null, { status: 304 });
  }

  /**
   * Optimize response size by removing null/undefined values
   */
  static compress(obj: unknown): unknown {
    if (Array.isArray(obj)) {
      return obj.map(item => this.compress(item));
    }
    
    if (obj && typeof obj === 'object') {
      const compressed: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined) {
          compressed[key] = this.compress(value);
        }
      }
      
      return compressed;
    }
    
    return obj;
  }

  /**
   * Create success response with performance metrics
   */
  static success(
    data: unknown,
    options: {
      message?: string;
      metadata?: Record<string, unknown>;
      cacheMaxAge?: number;
      compress?: boolean;
    } = {}
  ): NextResponse {
    const { message, metadata, cacheMaxAge, compress = true } = options;
    
    const response = {
      success: true,
      ...(message && { message }),
      data: compress ? this.compress(data) : data,
      ...(metadata && { metadata }),
      timestamp: new Date().toISOString()
    };

    return this.json(response, {
      cache: cacheMaxAge ? {
        maxAge: cacheMaxAge,
        public: false,
        staleWhileRevalidate: Math.floor(cacheMaxAge / 2)
      } : undefined
    });
  }
}

/**
 * Middleware for response optimization
 */
export function withResponseOptimization<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const start = Date.now();
    
    try {
      const response = await handler(...args);
      
      // Add performance timing header
      const duration = Date.now() - start;
      response.headers.set('X-Response-Time', `${duration}ms`);
      
      return response;
      
    } catch (error) {
      console.error('Response optimization error:', error);
      const duration = Date.now() - start;
      
      const errorResponse = ResponseOptimizer.error(
        'Internal server error',
        { status: 500 }
      );
      
      errorResponse.headers.set('X-Response-Time', `${duration}ms`);
      return errorResponse;
    }
  };
}

export default ResponseOptimizer;