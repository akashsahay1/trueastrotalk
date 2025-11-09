import { MongoClient, Db, Collection, Document } from 'mongodb';

// Database connection configuration
const MONGODB_URL = process.env.MONGODB_URL;
const DB_NAME = process.env.DB_NAME || 'trueastrotalkDB';

if (!MONGODB_URL) {
  throw new Error('MONGODB_URL environment variable is required');
}

interface DatabaseConnection {
  client: MongoClient;
  db: Db;
  isConnected: boolean;
}

class DatabaseService {
  private static connection: DatabaseConnection | null = null;
  private static isConnecting: boolean = false;

  /**
   * Get or create database connection with connection pooling
   */
  static async getConnection(): Promise<DatabaseConnection> {
    // Return existing connection if available
    if (this.connection && this.connection.isConnected) {
      return this.connection;
    }

    // Prevent multiple concurrent connection attempts
    if (this.isConnecting) {
      await this.waitForConnection();
      return this.connection!;
    }

    this.isConnecting = true;

    try {
      
      const client = new MongoClient(MONGODB_URL!, {
        maxPoolSize: 50,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        maxIdleTimeMS: 300000,
        retryWrites: true,
        retryReads: true,
      });

      await client.connect();
      
      // Test the connection
      await client.db(DB_NAME).admin().ping();
      
      const db = client.db(DB_NAME);
      
      this.connection = {
        client,
        db,
        isConnected: true
      };

      
      // Handle connection events
      client.on('close', () => {
        if (this.connection) {
          this.connection.isConnected = false;
        }
      });

      client.on('error', (error) => {
        console.error('❌ Database connection error:', error);
        if (this.connection) {
          this.connection.isConnected = false;
        }
      });

      return this.connection;

    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      this.connection = null;
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Wait for ongoing connection attempt to complete
   */
  private static async waitForConnection(): Promise<void> {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds timeout
    
    while (this.isConnecting && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (this.isConnecting) {
      throw new Error('Database connection timeout');
    }
  }

  /**
   * Get database instance
   */
  static async getDb(): Promise<Db> {
    const connection = await this.getConnection();
    return connection.db;
  }

  /**
   * Get collection with proper typing
   */
  static async getCollection<T extends Document = Document>(name: string): Promise<Collection<T>> {
    const db = await this.getDb();
    return db.collection<T>(name);
  }

  /**
   * Execute operation with automatic connection handling
   */
  static async executeOperation<T>(
    operation: (db: Db) => Promise<T>
  ): Promise<T> {
    const db = await this.getDb();
    return await operation(db);
  }

  /**
   * Close database connection (for graceful shutdown)
   */
  static async closeConnection(): Promise<void> {
    if (this.connection && this.connection.isConnected) {
      await this.connection.client.close();
      this.connection.isConnected = false;
      this.connection = null;
    }
  }

  /**
   * Check if database is connected
   */
  static isConnected(): boolean {
    return this.connection?.isConnected ?? false;
  }

  /**
   * Health check for monitoring
   */
  static async healthCheck(): Promise<{ status: string; timestamp: Date }> {
    try {
      const db = await this.getDb();
      await db.admin().ping();
      return {
        status: 'healthy',
        timestamp: new Date()
      };
    } catch {
      return {
        status: 'unhealthy',
        timestamp: new Date()
      };
    }
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  await DatabaseService.closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await DatabaseService.closeConnection();
  process.exit(0);
});

export default DatabaseService;