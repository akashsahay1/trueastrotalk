/**
 * Performance optimization utilities including caching and connection pooling
 */

import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for frequently accessed data
interface CacheItem {
  data: unknown;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class PerformanceCache {
  private cache: Map<string, CacheItem> = new Map();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: unknown, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): unknown | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clear expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
export const performanceCache = new PerformanceCache();

// Cleanup expired cache entries every 10 minutes
setInterval(() => {
  performanceCache.cleanup();
}, 10 * 60 * 1000);

// Database query optimization utilities
export class QueryOptimizer {
  // Cache frequently used aggregation results
  static async getCachedAggregation(
    cacheKey: string,
    aggregationFn: () => Promise<unknown>,
    ttl: number = 5 * 60 * 1000
  ): Promise<unknown> {
    let result = performanceCache.get(cacheKey);
    
    if (result === null) {
      result = await aggregationFn();
      performanceCache.set(cacheKey, result, ttl);
    }
    
    return result;
  }

  // Create optimized database indexes
  static getRecommendedIndexes(): Record<string, Record<string, number>[]> {
    return {
      users: [
        { user_type: 1, account_status: 1 },
        { email_address: 1 },
        { phone_number: 1 },
        { created_at: -1 },
        { is_online: 1, user_type: 1 },
        { user_type: 1, account_status: 1, created_at: -1 }
      ],
      chat_sessions: [
        { astrologer_id: 1, status: 1 },
        { customer_id: 1, status: 1 },
        { created_at: -1 },
        { astrologer_id: 1, created_at: -1 },
        { status: 1, created_at: -1 }
      ],
      call_sessions: [
        { astrologer_id: 1, status: 1 },
        { customer_id: 1, status: 1 },
        { created_at: -1 },
        { astrologer_id: 1, created_at: -1 }
      ],
      wallet_transactions: [
        { recipient_id: 1, transaction_type: 1, status: 1 },
        { sender_id: 1, created_at: -1 },
        { created_at: -1 },
        { transaction_type: 1, status: 1, created_at: -1 }
      ],
      products: [
        { status: 1, category: 1 },
        { created_at: -1 },
        { name: 1, status: 1 }
      ],
      orders: [
        { user_id: 1, status: 1 },
        { created_at: -1 },
        { status: 1, created_at: -1 }
      ]
    };
  }

  // Optimize MongoDB queries with proper projections
  static getOptimizedProjection(fields: string[]): Record<string, number> {
    const projection: Record<string, number> = {};
    fields.forEach(field => {
      projection[field] = 1;
    });
    return projection;
  }
}

// Response caching middleware
export function withResponseCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  cacheKeyFn: (req: NextRequest) => string,
  ttl: number = 5 * 60 * 1000
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const cacheKey = cacheKeyFn(req);
    
    // Check cache first
    const cached = performanceCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Execute handler
    const response = await handler(req);
    
    // Cache successful responses
    if (response.status === 200) {
      const data = await response.json();
      performanceCache.set(cacheKey, data, ttl);
      return NextResponse.json(data);
    }

    return response;
  };
}

// Database connection optimization
export class ConnectionManager {
  private static connections: Map<string, { connection: unknown; lastUsed: number }> = new Map();
  private static readonly maxIdleTime = 30 * 60 * 1000; // 30 minutes

  static async getConnection(connectionString: string): Promise<unknown> {
    const existing = this.connections.get(connectionString);
    
    if (existing && Date.now() - existing.lastUsed < this.maxIdleTime) {
      existing.lastUsed = Date.now();
      return existing.connection;
    }

    // Create new connection logic would go here
    // For now, return null as placeholder
    return null;
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [key, conn] of this.connections.entries()) {
      if (now - conn.lastUsed > this.maxIdleTime) {
        // Close connection logic would go here
        this.connections.delete(key);
      }
    }
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private static metrics: Map<string, { count: number; totalTime: number; avgTime: number }> = new Map();

  static startTimer(operation: string): () => void {
    const start = Date.now();
    
    return () => {
      const duration = Date.now() - start;
      const existing = this.metrics.get(operation) || { count: 0, totalTime: 0, avgTime: 0 };
      
      existing.count++;
      existing.totalTime += duration;
      existing.avgTime = existing.totalTime / existing.count;
      
      this.metrics.set(operation, existing);
    };
  }

  static getMetrics(): Record<string, { count: number; totalTime: number; avgTime: number }> {
    return Object.fromEntries(this.metrics);
  }

  static clearMetrics(): void {
    this.metrics.clear();
  }
}

export default performanceCache;