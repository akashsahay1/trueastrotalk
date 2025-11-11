/**
 * Database index management for performance optimization
 */

import DatabaseService from './database';

export class DatabaseIndexManager {
  /**
   * Create essential indexes for performance optimization
   */
  static async createOptimizedIndexes(): Promise<void> {
    try {

      // Users collection indexes
      const usersCollection = await DatabaseService.getCollection('users');
      await Promise.all([
        // Primary lookup indexes
        usersCollection.createIndex({ email_address: 1 }, { unique: true, background: true }),
        usersCollection.createIndex({ phone_number: 1 }, { sparse: true, background: true }),
        
        // Filtering and sorting indexes
        usersCollection.createIndex({ user_type: 1, account_status: 1 }, { background: true }),
        usersCollection.createIndex({ user_type: 1, is_online: 1 }, { background: true }),
        usersCollection.createIndex({ created_at: -1 }, { background: true }),
        usersCollection.createIndex({ user_type: 1, account_status: 1, created_at: -1 }, { background: true }),
        
        // Astrologer specific indexes
        usersCollection.createIndex({ 
          user_type: 1, 
          account_status: 1, 
          verification_status: 1, 
          profile_image_id: 1 
        }, { 
          background: true,
          partialFilterExpression: { user_type: 'astrologer' }
        })
      ]);

      // Unified Sessions collection indexes (chat + voice_call + video_call)
      const sessionsCollection = await DatabaseService.getCollection('sessions');
      await Promise.all([
        // Core indexes for unified collection
        sessionsCollection.createIndex({ session_type: 1, status: 1 }, { background: true }),
        sessionsCollection.createIndex({ user_id: 1, session_type: 1, created_at: -1 }, { background: true }),
        sessionsCollection.createIndex({ astrologer_id: 1, session_type: 1, created_at: -1 }, { background: true }),
        sessionsCollection.createIndex({ status: 1, created_at: -1 }, { background: true }),
        sessionsCollection.createIndex({ session_id: 1 }, { background: true }),
        sessionsCollection.createIndex({ created_at: -1 }, { background: true }),

        // Composite indexes for filtering and sorting
        sessionsCollection.createIndex({
          session_type: 1,
          astrologer_id: 1,
          status: 1,
          created_at: -1
        }, { background: true }),
        sessionsCollection.createIndex({
          session_type: 1,
          user_id: 1,
          status: 1,
          created_at: -1
        }, { background: true }),

        // Index for billing queries
        sessionsCollection.createIndex({
          session_type: 1,
          status: 1,
          billing_updated_at: 1
        }, { background: true })
      ]);

      // Transactions collection indexes (unified wallet + all transactions)
      const transactionsCollection = await DatabaseService.getCollection('transactions');
      await Promise.all([
        transactionsCollection.createIndex({
          user_id: 1,
          transaction_type: 1,
          status: 1
        }, { background: true }),
        transactionsCollection.createIndex({
          recipient_user_id: 1,
          created_at: -1
        }, { background: true }),
        transactionsCollection.createIndex({ created_at: -1 }, { background: true }),
        transactionsCollection.createIndex({
          transaction_type: 1,
          status: 1,
          created_at: -1
        }, { background: true }),
        transactionsCollection.createIndex({
          session_id: 1,
          service_type: 1
        }, { background: true })
      ]);

      // Products collection indexes
      const productsCollection = await DatabaseService.getCollection('products');
      await Promise.all([
        productsCollection.createIndex({ status: 1, category: 1 }, { background: true }),
        productsCollection.createIndex({ created_at: -1 }, { background: true }),
        productsCollection.createIndex({ name: 1, status: 1 }, { background: true }),
        productsCollection.createIndex({ status: 1, price: 1 }, { background: true })
      ]);

      // Orders collection indexes
      const ordersCollection = await DatabaseService.getCollection('orders');
      await Promise.all([
        ordersCollection.createIndex({ user_id: 1, status: 1 }, { background: true }),
        ordersCollection.createIndex({ created_at: -1 }, { background: true }),
        ordersCollection.createIndex({ status: 1, created_at: -1 }, { background: true }),
        ordersCollection.createIndex({ order_number: 1 }, { unique: true, background: true })
      ]);

      // Media collection indexes
      const mediaCollection = await DatabaseService.getCollection('media');
      await Promise.all([
        mediaCollection.createIndex({ media_id: 1 }, { unique: true, background: true }),
        mediaCollection.createIndex({ file_type: 1, status: 1 }, { background: true }),
        mediaCollection.createIndex({ uploaded_by: 1, created_at: -1 }, { background: true }),
        mediaCollection.createIndex({ created_at: -1 }, { background: true }),
        mediaCollection.createIndex({ original_filename: 1 }, { background: true })
      ]);

      // Notifications collection indexes
      const notificationsCollection = await DatabaseService.getCollection('notifications');
      await Promise.all([
        notificationsCollection.createIndex({ user_id: 1, is_read: 1 }, { background: true }),
        notificationsCollection.createIndex({ created_at: -1 }, { background: true }),
        notificationsCollection.createIndex({ user_id: 1, created_at: -1 }, { background: true }),
        notificationsCollection.createIndex({ notification_type: 1, created_at: -1 }, { background: true })
      ]);

      // App Errors collection indexes (new)
      const appErrorsCollection = await DatabaseService.getCollection('app_errors');
      await Promise.all([
        appErrorsCollection.createIndex({ error_type: 1, created_at: -1 }, { background: true }),
        appErrorsCollection.createIndex({ user_id: 1, created_at: -1 }, { background: true }),
        appErrorsCollection.createIndex({ user_type: 1, error_type: 1, created_at: -1 }, { background: true }),
        appErrorsCollection.createIndex({ created_at: -1 }, { background: true }),
        appErrorsCollection.createIndex({ resolved: 1, created_at: -1 }, { background: true }),
        appErrorsCollection.createIndex({ severity: 1, resolved: 1, created_at: -1 }, { background: true })
      ]);

      // Performance Metrics collection indexes (new)
      const performanceMetricsCollection = await DatabaseService.getCollection('performance_metrics');
      await Promise.all([
        performanceMetricsCollection.createIndex({ timestamp: -1 }, { background: true }),
        performanceMetricsCollection.createIndex({ metric_type: 1, timestamp: -1 }, { background: true }),
        performanceMetricsCollection.createIndex({ 
          timestamp: -1 
        }, { 
          background: true,
          expireAfterSeconds: 2592000 // 30 days TTL
        })
      ]);

      // Real-time User Stats collection indexes (new)
      const realtimeStatsCollection = await DatabaseService.getCollection('realtime_user_stats');
      await Promise.all([
        realtimeStatsCollection.createIndex({ timestamp: -1 }, { background: true }),
        realtimeStatsCollection.createIndex({ 
          timestamp: -1 
        }, { 
          background: true,
          expireAfterSeconds: 86400 // 24 hours TTL
        })
      ]);


    } catch (error) {
      console.error('❌ Error creating database indexes:', error);
      throw error;
    }
  }

  /**
   * Get current indexes for a collection
   */
  static async getCollectionIndexes(collectionName: string): Promise<unknown[]> {
    try {
      const collection = await DatabaseService.getCollection(collectionName);
      return await collection.indexes();
    } catch (error) {
      console.error(`Error getting indexes for ${collectionName}:`, error);
      return [];
    }
  }

  /**
   * Analyze query performance and suggest indexes
   */
  static async analyzeQueryPerformance(
    collectionName: string,
    query: Record<string, unknown>,
    sort?: Record<string, number>
  ): Promise<{
    executionStats: unknown;
    suggestedIndexes: Record<string, number>[];
  }> {
    try {
      const collection = await DatabaseService.getCollection(collectionName);
      
      // Execute explain to get performance stats
      const explanation = await collection.find(query)
        .sort(sort as Record<string, 1 | -1> || {})
        .explain('executionStats');

      // Suggest indexes based on query pattern
      const suggestedIndexes: Record<string, number>[] = [];
      
      // Add index for query fields
      if (Object.keys(query).length > 0) {
        const queryIndex: Record<string, number> = {};
        Object.keys(query).forEach(field => {
          queryIndex[field] = 1;
        });
        suggestedIndexes.push(queryIndex);
      }

      // Add compound index for query + sort
      if (sort && Object.keys(sort).length > 0) {
        const compoundIndex: Record<string, number> = {};
        Object.keys(query).forEach(field => {
          compoundIndex[field] = 1;
        });
        Object.entries(sort).forEach(([field, direction]) => {
          compoundIndex[field] = direction;
        });
        suggestedIndexes.push(compoundIndex);
      }

      return {
        executionStats: explanation,
        suggestedIndexes
      };

    } catch (error) {
      console.error('Error analyzing query performance:', error);
      return {
        executionStats: null,
        suggestedIndexes: []
      };
    }
  }

  /**
   * Get database performance statistics
   */
  static async getPerformanceStats(): Promise<{
    collections: string[];
    totalIndexes: number;
    indexSizes: Record<string, unknown>;
  }> {
    try {
      const db = await DatabaseService.getDb();
      const collections = await db.listCollections().toArray();
      
      let totalIndexes = 0;
      const indexSizes: Record<string, unknown> = {};

      for (const collectionInfo of collections) {
        const collection = db.collection(collectionInfo.name);
        const indexes = await collection.indexes();
        totalIndexes += indexes.length;
        
        try {
          const stats = await db.command({ collStats: collectionInfo.name });
          indexSizes[collectionInfo.name] = stats.indexSizes;
        } catch {
          // Some collections might not have stats available
          indexSizes[collectionInfo.name] = {};
        }
      }

      return {
        collections: collections.map(c => c.name),
        totalIndexes,
        indexSizes
      };

    } catch (error) {
      console.error('Error getting performance stats:', error);
      return {
        collections: [],
        totalIndexes: 0,
        indexSizes: {}
      };
    }
  }
}

export default DatabaseIndexManager;