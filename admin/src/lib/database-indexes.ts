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
      console.log('🔄 Creating database indexes for performance optimization...');

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
          is_verified: 1, 
          profile_image_id: 1 
        }, { 
          background: true,
          partialFilterExpression: { user_type: 'astrologer' }
        })
      ]);

      // Chat sessions collection indexes
      const chatSessionsCollection = await DatabaseService.getCollection('chat_sessions');
      await Promise.all([
        chatSessionsCollection.createIndex({ astrologer_id: 1, status: 1 }, { background: true }),
        chatSessionsCollection.createIndex({ customer_id: 1, status: 1 }, { background: true }),
        chatSessionsCollection.createIndex({ created_at: -1 }, { background: true }),
        chatSessionsCollection.createIndex({ astrologer_id: 1, created_at: -1 }, { background: true }),
        chatSessionsCollection.createIndex({ status: 1, created_at: -1 }, { background: true }),
        chatSessionsCollection.createIndex({ 
          astrologer_id: 1, 
          status: 1, 
          duration_minutes: 1 
        }, { background: true })
      ]);

      // Call sessions collection indexes
      const callSessionsCollection = await DatabaseService.getCollection('call_sessions');
      await Promise.all([
        callSessionsCollection.createIndex({ astrologer_id: 1, status: 1 }, { background: true }),
        callSessionsCollection.createIndex({ customer_id: 1, status: 1 }, { background: true }),
        callSessionsCollection.createIndex({ created_at: -1 }, { background: true }),
        callSessionsCollection.createIndex({ astrologer_id: 1, created_at: -1 }, { background: true })
      ]);

      // Sessions collection (general) indexes
      const sessionsCollection = await DatabaseService.getCollection('sessions');
      await Promise.all([
        sessionsCollection.createIndex({ astrologer_id: 1 }, { background: true }),
        sessionsCollection.createIndex({ customer_id: 1 }, { background: true }),
        sessionsCollection.createIndex({ created_at: -1 }, { background: true }),
        sessionsCollection.createIndex({ astrologer_id: 1, created_at: -1 }, { background: true })
      ]);

      // Wallet transactions collection indexes
      const walletTransactionsCollection = await DatabaseService.getCollection('wallet_transactions');
      await Promise.all([
        walletTransactionsCollection.createIndex({ 
          recipient_id: 1, 
          transaction_type: 1, 
          status: 1 
        }, { background: true }),
        walletTransactionsCollection.createIndex({ 
          sender_id: 1, 
          created_at: -1 
        }, { background: true }),
        walletTransactionsCollection.createIndex({ created_at: -1 }, { background: true }),
        walletTransactionsCollection.createIndex({ 
          transaction_type: 1, 
          status: 1, 
          created_at: -1 
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

      // Media files collection indexes
      const mediaFilesCollection = await DatabaseService.getCollection('media_files');
      await Promise.all([
        mediaFilesCollection.createIndex({ file_type: 1, status: 1 }, { background: true }),
        mediaFilesCollection.createIndex({ uploaded_by: 1, created_at: -1 }, { background: true }),
        mediaFilesCollection.createIndex({ created_at: -1 }, { background: true }),
        mediaFilesCollection.createIndex({ original_filename: 1 }, { background: true })
      ]);

      // Notifications collection indexes
      const notificationsCollection = await DatabaseService.getCollection('notifications');
      await Promise.all([
        notificationsCollection.createIndex({ user_id: 1, is_read: 1 }, { background: true }),
        notificationsCollection.createIndex({ created_at: -1 }, { background: true }),
        notificationsCollection.createIndex({ user_id: 1, created_at: -1 }, { background: true }),
        notificationsCollection.createIndex({ notification_type: 1, created_at: -1 }, { background: true })
      ]);

      console.log('✅ Database indexes created successfully');

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