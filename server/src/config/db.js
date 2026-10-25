import mongoose from 'mongoose';
import { env } from './env.js';

let mongodInstance = null;

export const connectDB = async () => {
  // If already connected, reuse existing connection (crucial for Serverless/Vercel)
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    if (env.useInMemoryDb && !env.isProduction) {
      console.log('🔄 Initializing in-memory MongoDB server for local dev...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const uri = mongodInstance.getUri();
      await mongoose.connect(uri);
      console.log(`✅ Connected to In-Memory MongoDB at: ${uri}`);
      return;
    }

    const uri = process.env.MONGODB_URI || env.mongodbUri;
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ Connected to MongoDB Atlas successfully`);
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    throw error;
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
