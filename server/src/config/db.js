import mongoose from 'mongoose';
import { env } from './env.js';

let mongodInstance = null;

export const connectDB = async () => {
  try {
    if (env.useInMemoryDb) {
      console.log('🔄 Initializing in-memory MongoDB server...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const uri = mongodInstance.getUri();
      await mongoose.connect(uri);
      console.log(`✅ Connected to In-Memory MongoDB at: ${uri}`);
      return;
    }

    // Try connecting to provided URI
    try {
      await mongoose.connect(env.mongodbUri, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log(`✅ Connected to MongoDB at: ${env.mongodbUri}`);
    } catch (err) {
      console.warn(`⚠️ Could not connect to MongoDB at ${env.mongodbUri}: ${err.message}`);
      console.log('🔄 Falling back to In-Memory MongoDB for local development/testing...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const uri = mongodInstance.getUri();
      await mongoose.connect(uri);
      console.log(`✅ Connected to In-Memory MongoDB fallback at: ${uri}`);
    }
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error during MongoDB disconnect:', error);
  }
};
