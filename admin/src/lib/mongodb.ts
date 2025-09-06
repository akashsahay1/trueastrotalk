import { MongoClient, Db } from 'mongodb';

const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'trueastrotalkDB';

if (!MONGODB_URL) {
  throw new Error('Please add your MONGODB_URL to .env.local');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URL);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(MONGODB_URL);
  clientPromise = client.connect();
}

export async function connectToDatabase(): Promise<{
  client: MongoClient;
  db: Db;
}> {
  try {
    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    return {
      client,
      db,
    };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw new Error('Database connection failed');
  }
}

// Export a default client promise for compatibility
export default clientPromise;