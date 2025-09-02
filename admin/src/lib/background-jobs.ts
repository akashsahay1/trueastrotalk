/**
 * Background jobs for real-time monitoring and data collection
 */

import * as cron from 'node-cron';

class BackgroundJobsService {
  static isRunning = false;

  /**
   * Start all background jobs
   */
  static start() {
    if (this.isRunning) {
      console.log('⚠️ Background jobs are already running');
      return;
    }

    console.log('🚀 Starting background jobs...');
    this.isRunning = true;

    // Update real-time user statistics every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
      try {
        const { default: ErrorMonitoringService } = await import('./error-monitoring-service.js');
        await ErrorMonitoringService.getCurrentUserCounts();
        // console.log('✅ Real-time stats updated');
      } catch (error) {
        console.error('❌ Failed to update real-time stats:', error.message);
      }
    });

    // Record system performance metrics every minute
    cron.schedule('0 * * * * *', async () => {
      try {
        await this.recordSystemMetrics();
        // console.log('✅ System metrics recorded');
      } catch (error) {
        console.error('❌ Failed to record system metrics:', error.message);
      }
    });

    // Cleanup old performance metrics (keep only 30 days) - runs daily at 2 AM
    cron.schedule('0 0 2 * * *', async () => {
      try {
        await this.cleanupOldMetrics();
        console.log('✅ Old metrics cleaned up');
      } catch (error) {
        console.error('❌ Failed to cleanup old metrics:', error.message);
      }
    });

    // Cleanup old error logs (keep only 90 days) - runs daily at 3 AM
    cron.schedule('0 0 3 * * *', async () => {
      try {
        await this.cleanupOldErrors();
        console.log('✅ Old errors cleaned up');
      } catch (error) {
        console.error('❌ Failed to cleanup old errors:', error.message);
      }
    });

    console.log('✅ Background jobs started successfully');
  }

  /**
   * Stop all background jobs
   */
  static stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping background jobs...');
    cron.destroy();
    this.isRunning = false;
    console.log('✅ Background jobs stopped');
  }

  /**
   * Record system performance metrics
   */
  static async recordSystemMetrics() {
    try {
      const { default: ErrorMonitoringService } = await import('./error-monitoring-service.js');
      
      // Get current memory usage
      const memoryUsage = process.memoryUsage();
      await ErrorMonitoringService.recordPerformanceMetric({
        metric_type: 'memory_usage',
        value: memoryUsage.heapUsed / 1024 / 1024, // Convert to MB
        details: {
          heap_total: memoryUsage.heapTotal,
          heap_used: memoryUsage.heapUsed,
          external: memoryUsage.external,
          rss: memoryUsage.rss
        },
        timestamp: new Date()
      });

      // Record current active users count as performance metric
      const userCounts = await ErrorMonitoringService.getCurrentUserCounts();
      await ErrorMonitoringService.recordPerformanceMetric({
        metric_type: 'active_users',
        value: userCounts.online_customers + userCounts.online_astrologers,
        details: {
          online_customers: userCounts.online_customers,
          online_astrologers: userCounts.online_astrologers,
          total_online: userCounts.online_customers + userCounts.online_astrologers
        },
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Failed to record system metrics:', error.message);
    }
  }

  /**
   * Cleanup old performance metrics (older than 30 days)
   */
  static async cleanupOldMetrics() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { default: DatabaseService } = await import('./database.js');
      const collection = await DatabaseService.getCollection('performance_metrics');
      
      const result = await collection.deleteMany({
        timestamp: { $lt: thirtyDaysAgo }
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} old performance metrics`);
    } catch (error) {
      console.error('Failed to cleanup old metrics:', error.message);
    }
  }

  /**
   * Cleanup old error logs (older than 90 days)
   */
  static async cleanupOldErrors() {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { default: DatabaseService } = await import('./database.js');
      const collection = await DatabaseService.getCollection('app_errors');
      
      // Only delete resolved errors older than 90 days
      const result = await collection.deleteMany({
        created_at: { $lt: ninetyDaysAgo },
        resolved: true
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} old resolved errors`);
    } catch (error) {
      console.error('Failed to cleanup old errors:', error.message);
    }
  }

  /**
   * Get status of background jobs
   */
  static getStatus() {
    const jobs = [
      'Real-time user stats (every 30 seconds)',
      'System metrics (every minute)',
      'Cleanup old metrics (daily at 2 AM)',
      'Cleanup old errors (daily at 3 AM)'
    ];

    return {
      running: this.isRunning,
      jobs
    };
  }
}

module.exports = BackgroundJobsService;