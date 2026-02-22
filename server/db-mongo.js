import { MongoClient } from 'mongodb';

let mongoClient = null;
let db = null;

export async function connectDB() {
  if (db) return db;

  try {
    // Parse the connection string to extract or use default database
    let connectionUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifevault';
    
    // Ensure the URI has a database name if it's a standard connection string
    if (connectionUri.includes('?')) {
      connectionUri = connectionUri.replace('dbname', 'lifevault');
    } else if (!connectionUri.endsWith('/lifevault')) {
      connectionUri = connectionUri.replace(/\/$/, '') + '/lifevault';
    }

    const mongoOptions = {
      retryWrites: true,
      w: 'majority',
      ssl: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
      maxPoolSize: 10,
      minPoolSize: 2,
    };

    mongoClient = new MongoClient(connectionUri, mongoOptions);
    await mongoClient.connect();
    db = mongoClient.db('lifevault');
    
    // Create indexes for better query performance
    await createIndexes();
    
    console.log('[MongoDB] Connected successfully to database: lifevault');
    return db;
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error.message);
    console.error('[MongoDB] Connection URI:', process.env.MONGODB_URI?.substring(0, 50) + '...');
    throw error;
  }
}

async function createIndexes() {
  try {
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ lastLogin: 1 });
    await db.collection('users').createIndex({ createdAt: 1 });

    // OTP collection indexes
    await db.collection('otps').createIndex({ email: 1 });
    await db.collection('otps').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    // Vaults collection indexes
    await db.collection('vaults').createIndex({ userId: 1, type: 1 }, { unique: true });

    // Slots collection indexes
    await db.collection('slots').createIndex({ vaultId: 1 });
    await db.collection('slots').createIndex({ parentSlotId: 1 });
    await db.collection('slots').createIndex({ scheduledFor: 1 });

    // Scheduling collection indexes
    await db.collection('scheduling').createIndex({ slotId: 1 });
    await db.collection('scheduling').createIndex({ recipientEmail: 1 });
    await db.collection('scheduling').createIndex({ scheduledDate: 1 });

    // Inactivity logs indexes
    await db.collection('inactivityLogs').createIndex({ userId: 1 });
    await db.collection('inactivityLogs').createIndex({ confirmationExpiresAt: 1 }, { expireAfterSeconds: 0 });

    console.log('[MongoDB] Indexes created successfully');
  } catch (error) {
    console.error('[MongoDB] Index creation failed:', error);
  }
}

export async function getDB() {
  if (!db) {
    await connectDB();
  }
  return db;
}

export async function disconnectDB() {
  if (mongoClient) {
    await mongoClient.close();
    db = null;
    mongoClient = null;
    console.log('[MongoDB] Disconnected');
  }
}

export default { connectDB, getDB, disconnectDB };
