/**
 * Error Monitoring and Analytics System
 * Tracks, logs, and analyzes application errors for improved reliability
 */

import { ObjectId } from 'mongodb';
import DatabaseService from './database';
import { ErrorDetails, ErrorSeverity } from './error-handler';

export interface ErrorMetrics {
  total_errors: number;
  error_rate: number;
  unique_errors: number;
  critical_errors: number;
  top_errors: Array<{
    error_code: string;
    count: number;
    last_occurred: Date;
  }>;
  error_trends: Array<{
    date: string;
    count: number;
  }>;
}

export interface ErrorAnalytics {
  by_severity: Record<ErrorSeverity, number>;
  by_endpoint: Record<string, number>;
  by_user_type: Record<string, number>;
  by_error_code: Record<string, number>;
  time_series: Array<{
    timestamp: Date;
    count: number;
    severity: ErrorSeverity;
  }>;
}

export class ErrorMonitoring {
  private static readonly ERROR_RETENTION_DAYS = 30;

  /**
   * Log error to monitoring system
   */
  static async logError(errorDetails: ErrorDetails, stackTrace?: string): Promise<void> {
    try {
      const errorLogsCollection = await DatabaseService.getCollection('error_logs');
      
      await errorLogsCollection.insertOne({
        ...errorDetails,
        stack_trace: stackTrace,
        created_at: new Date(),
        resolved: false,
        assigned_to: null,
        resolution_notes: null
      });

      // Update error statistics
      await this.updateErrorStats(errorDetails);

      // Check if this is a new error pattern
      await this.checkForNewErrorPattern(errorDetails);

      // Auto-escalate critical errors
      if (errorDetails.severity === ErrorSeverity.CRITICAL) {
        await this.escalateCriticalError(errorDetails);
      }

    } catch (monitoringError) {
      console.error('Failed to log error to monitoring system:', monitoringError);
    }
  }

  /**
   * Update error statistics for dashboard
   */
  private static async updateErrorStats(errorDetails: ErrorDetails): Promise<void> {
    try {
      const errorStatsCollection = await DatabaseService.getCollection('error_stats');
      const today = new Date().toISOString().split('T')[0];

      await errorStatsCollection.updateOne(
        { date: today },
        {
          $inc: {
            total_errors: 1,
            [`by_severity.${errorDetails.severity}`]: 1,
            [`by_error_code.${errorDetails.code}`]: 1,
            ...(errorDetails.endpoint && {
              [`by_endpoint.${errorDetails.endpoint}`]: 1
            }),
            ...(errorDetails.userId && {
              [`by_user_type.unknown`]: 1 // We'd need user type from context
            })
          },
          $set: {
            updated_at: new Date()
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error('Failed to update error stats:', error);
    }
  }

  /**
   * Check for new error patterns
   */
  private static async checkForNewErrorPattern(errorDetails: ErrorDetails): Promise<void> {
    try {
      const errorLogsCollection = await DatabaseService.getCollection('error_logs');
      
      // Check if this error code has occurred in the last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const recentCount = await errorLogsCollection.countDocuments({
        code: errorDetails.code,
        endpoint: errorDetails.endpoint,
        created_at: { $gte: twentyFourHoursAgo }
      });

      // If this is a new error pattern (first occurrence) or sudden spike
      if (recentCount === 1) {
        await this.alertNewErrorPattern(errorDetails);
      } else if (recentCount > 10) { // Spike detection
        await this.alertErrorSpike(errorDetails, recentCount);
      }
    } catch (error) {
      console.error('Failed to check error patterns:', error);
    }
  }

  /**
   * Get error metrics for dashboard
   */
  static async getErrorMetrics(days: number = 7): Promise<ErrorMetrics> {
    try {
      const errorStatsCollection = await DatabaseService.getCollection('error_stats');
      const errorLogsCollection = await DatabaseService.getCollection('error_logs');
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Get aggregated stats
      const stats = await errorStatsCollection
        .find({ 
          date: { 
            $gte: startDate.toISOString().split('T')[0] 
          } 
        })
        .toArray();

      const totalErrors = stats.reduce((sum, stat) => sum + (stat.total_errors || 0), 0);
      const criticalErrors = stats.reduce((sum, stat) => 
        sum + (stat.by_severity?.critical || 0), 0
      );

      // Get unique error codes
      const uniqueErrors = await errorLogsCollection.distinct('code', {
        created_at: { $gte: startDate }
      });

      // Get top errors
      const topErrorsAgg = await errorLogsCollection.aggregate([
        { $match: { created_at: { $gte: startDate } } },
        { 
          $group: {
            _id: '$code',
            count: { $sum: 1 },
            last_occurred: { $max: '$created_at' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray();

      const topErrors = topErrorsAgg.map(item => ({
        error_code: item._id,
        count: item.count,
        last_occurred: item.last_occurred
      }));

      // Get error trends (daily counts)
      const trends = stats.map(stat => ({
        date: stat.date,
        count: stat.total_errors || 0
      }));

      // Calculate error rate (errors per hour)
      const hoursInPeriod = days * 24;
      const errorRate = totalErrors / hoursInPeriod;

      return {
        total_errors: totalErrors,
        error_rate: Math.round(errorRate * 100) / 100,
        unique_errors: uniqueErrors.length,
        critical_errors: criticalErrors,
        top_errors: topErrors,
        error_trends: trends
      };

    } catch (error) {
      console.error('Failed to get error metrics:', error);
      return {
        total_errors: 0,
        error_rate: 0,
        unique_errors: 0,
        critical_errors: 0,
        top_errors: [],
        error_trends: []
      };
    }
  }

  /**
   * Get detailed error analytics
   */
  static async getErrorAnalytics(days: number = 7): Promise<ErrorAnalytics> {
    try {
      const errorLogsCollection = await DatabaseService.getCollection('error_logs');
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const analytics = await errorLogsCollection.aggregate([
        { $match: { created_at: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            by_severity: {
              $push: '$severity'
            },
            by_endpoint: {
              $push: '$endpoint'
            },
            by_error_code: {
              $push: '$code'
            },
            time_series: {
              $push: {
                timestamp: '$created_at',
                severity: '$severity'
              }
            }
          }
        }
      ]).toArray();

      if (analytics.length === 0) {
        return {
          by_severity: {
            low: 0,
            medium: 0,
            high: 0,
            critical: 0
          },
          by_endpoint: {},
          by_user_type: {},
          by_error_code: {},
          time_series: []
        } as ErrorAnalytics;
      }

      const data = analytics[0];

      // Count occurrences
      const countBy = (arr: string[]) => 
        arr.reduce((acc, item) => {
          if (item) {
            acc[item] = (acc[item] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

      return {
        by_severity: countBy(data.by_severity) as Record<ErrorSeverity, number>,
        by_endpoint: countBy(data.by_endpoint),
        by_user_type: {}, // Would need additional user context
        by_error_code: countBy(data.by_error_code),
        time_series: data.time_series.map((item: Record<string, unknown>) => ({
          timestamp: item.timestamp,
          count: 1,
          severity: item.severity
        }))
      };

    } catch (error) {
      console.error('Failed to get error analytics:', error);
      return {
        by_severity: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        },
        by_endpoint: {},
        by_user_type: {},
        by_error_code: {},
        time_series: []
      } as ErrorAnalytics;
    }
  }

  /**
   * Mark error as resolved
   */
  static async resolveError(errorId: string, resolution: string, resolvedBy: string): Promise<void> {
    try {
      const errorLogsCollection = await DatabaseService.getCollection('error_logs');
      
      await errorLogsCollection.updateOne(
        { _id: new ObjectId(errorId) },
        {
          $set: {
            resolved: true,
            resolved_at: new Date(),
            resolved_by: resolvedBy,
            resolution_notes: resolution,
            updated_at: new Date()
          }
        }
      );
    } catch (error) {
      console.error('Failed to resolve error:', error);
      throw error;
    }
  }

  /**
   * Get unresolved critical errors
   */
  static async getCriticalErrors(): Promise<Record<string, unknown>[]> {
    try {
      const errorLogsCollection = await DatabaseService.getCollection('error_logs');
      
      return await errorLogsCollection
        .find({
          severity: ErrorSeverity.CRITICAL,
          resolved: false
        })
        .sort({ created_at: -1 })
        .limit(50)
        .toArray();
    } catch (error) {
      console.error('Failed to get critical errors:', error);
      return [];
    }
  }

  /**
   * Clean up old error logs
   */
  static async cleanupOldErrors(): Promise<void> {
    try {
      const errorLogsCollection = await DatabaseService.getCollection('error_logs');
      const errorStatsCollection = await DatabaseService.getCollection('error_stats');
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.ERROR_RETENTION_DAYS);

      // Delete old error logs
      const logsResult = await errorLogsCollection.deleteMany({
        created_at: { $lt: cutoffDate },
        resolved: true // Only delete resolved errors
      });

      // Delete old stats
      const statsResult = await errorStatsCollection.deleteMany({
        date: { $lt: cutoffDate.toISOString().split('T')[0] }
      });

    } catch (error) {
      console.error('Failed to cleanup old errors:', error);
    }
  }

  /**
   * Alert for new error patterns
   */
  private static async alertNewErrorPattern(errorDetails: ErrorDetails): Promise<void> {
    console.warn('🚨 NEW ERROR PATTERN DETECTED:', errorDetails);
    // TODO: Integrate with alerting system (email, Slack, etc.)
  }

  /**
   * Alert for error spikes
   */
  private static async alertErrorSpike(errorDetails: ErrorDetails, count: number): Promise<void> {
    console.warn(`🚨 ERROR SPIKE DETECTED: ${errorDetails.code} occurred ${count} times in 24h`);
    // TODO: Integrate with alerting system
  }

  /**
   * Escalate critical errors
   */
  private static async escalateCriticalError(errorDetails: ErrorDetails): Promise<void> {
    console.error('🚨 CRITICAL ERROR ESCALATION:', errorDetails);
    // TODO: Integrate with incident management system
  }

  /**
   * Get error health score (0-100)
   */
  static async getHealthScore(): Promise<number> {
    try {
      const metrics = await this.getErrorMetrics(1); // Last 24 hours
      
      // Calculate health score based on error rate and critical errors
      const maxAcceptableErrorRate = 5; // errors per hour
      const errorRateScore = Math.max(0, 100 - (metrics.error_rate / maxAcceptableErrorRate) * 100);
      
      const criticalErrorPenalty = metrics.critical_errors * 10;
      const healthScore = Math.max(0, errorRateScore - criticalErrorPenalty);
      
      return Math.round(healthScore);
    } catch (error) {
      console.error('Failed to calculate health score:', error);
      return 0;
    }
  }
}

export default ErrorMonitoring;