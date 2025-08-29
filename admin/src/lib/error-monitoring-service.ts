/**
 * Error Monitoring and Performance Tracking Service
 */

import DatabaseService from './database';
import { ObjectId } from 'mongodb';

export interface AppErrorDocument {
  _id?: ObjectId;
  user_id?: string;
  user_type?: 'customer' | 'astrologer' | 'admin';
  error_type: 'network' | 'authentication' | 'validation' | 'payment' | 'server' | 'permission' | 'notFound' | 'general';
  error_message: string;
  technical_details?: string;
  stack_trace?: string;
  user_agent?: string;
  app_version?: string;
  platform?: 'android' | 'ios' | 'web';
  screen_name?: string;
  context?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: Date;
  resolution_notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PerformanceMetric {
  _id?: ObjectId;
  metric_type: 'response_time' | 'error_rate' | 'active_users' | 'app_crashes' | 'api_calls' | 'memory_usage';
  value: number;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface RealtimeUserStats {
  _id?: ObjectId;
  total_customers: number;
  total_astrologers: number;
  online_customers: number;
  online_astrologers: number;
  active_sessions: number;
  active_calls: number;
  timestamp: Date;
}

export interface ErrorSummary {
  total_errors: number;
  unresolved_errors: number;
  critical_errors: number;
  errors_today: number;
  top_error_types: Array<{
    error_type: string;
    count: number;
    percentage: number;
  }>;
  error_trends: Array<{
    date: string;
    count: number;
  }>;
}

export interface PerformanceSummary {
  avg_response_time: number;
  error_rate: number;
  peak_users: number;
  current_active_users: number;
  app_crashes_today: number;
  api_calls_today: number;
}

export class ErrorMonitoringService {
  
  /**
   * Report an error from the mobile app
   */
  static async reportError(errorData: Omit<AppErrorDocument, '_id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const collection = await DatabaseService.getCollection<AppErrorDocument>('app_errors');
      
      const errorDocument: AppErrorDocument = {
        ...errorData,
        resolved: false,
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await collection.insertOne(errorDocument);
      
      // If it's a critical error, trigger immediate notifications
      if (errorData.severity === 'critical') {
        await this.triggerCriticalErrorAlert(errorDocument);
      }
      
      return result.insertedId.toString();
    } catch (error) {
      console.error('Failed to report error:', error);
      throw error;
    }
  }

  /**
   * Record performance metric
   */
  static async recordPerformanceMetric(metric: Omit<PerformanceMetric, '_id'>): Promise<void> {
    try {
      const collection = await DatabaseService.getCollection<PerformanceMetric>('performance_metrics');
      await collection.insertOne(metric);
    } catch (error) {
      console.error('Failed to record performance metric:', error);
      throw error;
    }
  }

  /**
   * Update real-time user statistics
   */
  static async updateRealtimeStats(stats: Omit<RealtimeUserStats, '_id' | 'timestamp'>): Promise<void> {
    try {
      const collection = await DatabaseService.getCollection<RealtimeUserStats>('realtime_user_stats');
      
      const statsDocument: RealtimeUserStats = {
        ...stats,
        timestamp: new Date()
      };
      
      await collection.insertOne(statsDocument);
    } catch (error) {
      console.error('Failed to update realtime stats:', error);
      throw error;
    }
  }

  /**
   * Get current real-time user counts
   */
  static async getCurrentUserCounts(): Promise<{
    total_customers: number;
    total_astrologers: number;
    online_customers: number;
    online_astrologers: number;
    active_sessions: number;
    active_calls: number;
  }> {
    try {
      const usersCollection = await DatabaseService.getCollection('users');
      const sessionsCollection = await DatabaseService.getCollection('chat_sessions');
      const callsCollection = await DatabaseService.getCollection('call_sessions');

      const [
        totalCustomers,
        totalAstrologers,
        onlineCustomers,
        onlineAstrologers,
        activeSessions,
        activeCalls
      ] = await Promise.all([
        usersCollection.countDocuments({ user_type: 'customer' }),
        usersCollection.countDocuments({ user_type: 'astrologer' }),
        usersCollection.countDocuments({ user_type: 'customer', is_online: true }),
        usersCollection.countDocuments({ user_type: 'astrologer', is_online: true }),
        sessionsCollection.countDocuments({ status: 'active' }),
        callsCollection.countDocuments({ status: 'active' })
      ]);

      const stats = {
        total_customers: totalCustomers,
        total_astrologers: totalAstrologers,
        online_customers: onlineCustomers,
        online_astrologers: onlineAstrologers,
        active_sessions: activeSessions,
        active_calls: activeCalls
      };

      // Store this snapshot
      await this.updateRealtimeStats(stats);

      return stats;
    } catch (error) {
      console.error('Failed to get current user counts:', error);
      return {
        total_customers: 0,
        total_astrologers: 0,
        online_customers: 0,
        online_astrologers: 0,
        active_sessions: 0,
        active_calls: 0
      };
    }
  }

  /**
   * Get error summary for admin dashboard
   */
  static async getErrorSummary(): Promise<ErrorSummary> {
    try {
      const collection = await DatabaseService.getCollection<AppErrorDocument>('app_errors');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalErrors,
        unresolvedErrors,
        criticalErrors,
        errorsToday,
        topErrorTypes,
        errorTrends
      ] = await Promise.all([
        collection.countDocuments({}),
        collection.countDocuments({ resolved: false }),
        collection.countDocuments({ severity: 'critical', resolved: false }),
        collection.countDocuments({ created_at: { $gte: today } }),
        this.getTopErrorTypes(),
        this.getErrorTrends()
      ]);

      return {
        total_errors: totalErrors,
        unresolved_errors: unresolvedErrors,
        critical_errors: criticalErrors,
        errors_today: errorsToday,
        top_error_types: topErrorTypes,
        error_trends: errorTrends
      };
    } catch (error) {
      console.error('Failed to get error summary:', error);
      return {
        total_errors: 0,
        unresolved_errors: 0,
        critical_errors: 0,
        errors_today: 0,
        top_error_types: [],
        error_trends: []
      };
    }
  }

  /**
   * Get performance summary
   */
  static async getPerformanceSummary(): Promise<PerformanceSummary> {
    try {
      const metricsCollection = await DatabaseService.getCollection<PerformanceMetric>('performance_metrics');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        responseTimeMetrics,
        errorRateMetrics,
        activeUserMetrics,
        crashMetrics,
        apiCallMetrics
      ] = await Promise.all([
        metricsCollection.find({ 
          metric_type: 'response_time',
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).toArray(),
        metricsCollection.find({ 
          metric_type: 'error_rate',
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).toArray(),
        metricsCollection.find({ 
          metric_type: 'active_users',
          timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).toArray(),
        metricsCollection.countDocuments({ 
          metric_type: 'app_crashes',
          timestamp: { $gte: today }
        }),
        metricsCollection.countDocuments({ 
          metric_type: 'api_calls',
          timestamp: { $gte: today }
        })
      ]);

      const avgResponseTime = responseTimeMetrics.length > 0 
        ? responseTimeMetrics.reduce((sum, metric) => sum + metric.value, 0) / responseTimeMetrics.length
        : 0;

      const currentErrorRate = errorRateMetrics.length > 0
        ? errorRateMetrics[errorRateMetrics.length - 1].value
        : 0;

      const peakUsers = activeUserMetrics.length > 0
        ? Math.max(...activeUserMetrics.map(metric => metric.value))
        : 0;

      const currentActiveUsers = activeUserMetrics.length > 0
        ? activeUserMetrics[activeUserMetrics.length - 1].value
        : 0;

      return {
        avg_response_time: Math.round(avgResponseTime),
        error_rate: Number(currentErrorRate.toFixed(2)),
        peak_users: peakUsers,
        current_active_users: currentActiveUsers,
        app_crashes_today: crashMetrics,
        api_calls_today: apiCallMetrics
      };
    } catch (error) {
      console.error('Failed to get performance summary:', error);
      return {
        avg_response_time: 0,
        error_rate: 0,
        peak_users: 0,
        current_active_users: 0,
        app_crashes_today: 0,
        api_calls_today: 0
      };
    }
  }

  /**
   * Get recent errors with pagination
   */
  static async getRecentErrors(page: number = 1, limit: number = 50): Promise<{
    errors: AppErrorDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const collection = await DatabaseService.getCollection<AppErrorDocument>('app_errors');
      const skip = (page - 1) * limit;

      const [errors, total] = await Promise.all([
        collection.find({})
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        collection.countDocuments({})
      ]);

      return {
        errors,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Failed to get recent errors:', error);
      return {
        errors: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
    }
  }

  /**
   * Mark error as resolved
   */
  static async resolveError(errorId: string, resolvedBy: string, notes?: string): Promise<boolean> {
    try {
      const collection = await DatabaseService.getCollection<AppErrorDocument>('app_errors');
      
      const result = await collection.updateOne(
        { _id: new ObjectId(errorId) },
        {
          $set: {
            resolved: true,
            resolved_by: resolvedBy,
            resolved_at: new Date(),
            resolution_notes: notes,
            updated_at: new Date()
          }
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Failed to resolve error:', error);
      return false;
    }
  }

  /**
   * Get top error types
   */
  private static async getTopErrorTypes(): Promise<Array<{ error_type: string; count: number; percentage: number; }>> {
    try {
      const collection = await DatabaseService.getCollection<AppErrorDocument>('app_errors');
      
      const pipeline = [
        { $group: { _id: '$error_type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ];

      const results = await collection.aggregate(pipeline).toArray();
      const total = await collection.countDocuments({});

      return results.map(result => ({
        error_type: result._id,
        count: result.count,
        percentage: total > 0 ? Number(((result.count / total) * 100).toFixed(1)) : 0
      }));
    } catch (error) {
      console.error('Failed to get top error types:', error);
      return [];
    }
  }

  /**
   * Get error trends for the last 7 days
   */
  private static async getErrorTrends(): Promise<Array<{ date: string; count: number; }>> {
    try {
      const collection = await DatabaseService.getCollection<AppErrorDocument>('app_errors');
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const pipeline = [
        { $match: { created_at: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$created_at' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ];

      const results = await collection.aggregate(pipeline).toArray();

      return results.map(result => ({
        date: result._id,
        count: result.count
      }));
    } catch (error) {
      console.error('Failed to get error trends:', error);
      return [];
    }
  }

  /**
   * Trigger critical error alert
   */
  private static async triggerCriticalErrorAlert(errorData: AppErrorDocument): Promise<void> {
    try {
      // Here you would integrate with your notification system
      // For now, we'll just log it
      console.error('🚨 CRITICAL ERROR DETECTED:', {
        user_id: errorData.user_id,
        error_type: errorData.error_type,
        message: errorData.error_message,
        timestamp: errorData.created_at
      });

      // You could send notifications via:
      // - Email alerts
      // - Slack notifications
      // - SMS alerts
      // - Push notifications to admin app
      
    } catch (error) {
      console.error('Failed to trigger critical error alert:', error);
    }
  }
}

export default ErrorMonitoringService;