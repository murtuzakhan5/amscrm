import mongoose from 'mongoose';
import { createApp } from '../server/src/app.js';
import { env } from '../server/src/config/env.js';
import { seedSuperAdmin } from '../server/src/scripts/seedSuperAdmin.js';

let isConnected = false;
let isSeeded = false;

const app = createApp();

async function initDB() {
  if (!isConnected || mongoose.connection.readyState !== 1) {
    const mongoUri = process.env.MONGODB_URI || env.mongodbUri;
    if (!mongoUri || mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost')) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️ MONGODB_URI is not set to a valid cloud database (e.g. MongoDB Atlas).');
      }
    }
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
  }

  if (!isSeeded) {
    try {
      await seedSuperAdmin();
      isSeeded = true;
    } catch (err) {
      console.warn('Admin seed notice:', err.message);
    }
  }
}

export default async function handler(req, res) {
  try {
    await initDB();
    return app(req, res);
  } catch (error) {
    console.error('Serverless API initialization error:', error);
    return res.status(500).json({
      success: false,
      message: 'Serverless backend database connection error',
      error: error.message,
    });
  }
}
