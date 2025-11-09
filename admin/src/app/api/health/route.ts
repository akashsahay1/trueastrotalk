import { NextResponse } from 'next/server';
import DatabaseService from '@/lib/database';

/**
 * Health Check Endpoint
 *
 * Used by:
 * - Load balancers to check if instance is healthy
 * - PM2 during deployment to verify new instance is ready
 * - Monitoring systems to track uptime
 *
 * Returns 200 if healthy, 503 if unhealthy
 */
export async function GET() {
  try {
    // Check database connection
    const dbHealth = await DatabaseService.healthCheck();

    if (dbHealth.status !== 'healthy') {
      return NextResponse.json({
        status: 'unhealthy',
        checks: {
          database: dbHealth.status,
          application: 'running'
        },
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    // All checks passed
    return NextResponse.json({
      status: 'healthy',
      checks: {
        database: 'connected',
        application: 'running'
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      },
      version: process.env.npm_package_version || 'unknown',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json({
      status: 'unhealthy',
      checks: {
        database: 'error',
        application: 'error'
      },
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}
