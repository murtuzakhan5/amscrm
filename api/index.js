import { createApp } from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';
import { seedSuperAdmin } from '../server/src/scripts/seedSuperAdmin.js';

let isConnected = false;
let isSeeded = false;

const app = createApp();

async function initDB() {
  if (!isConnected) {
    await connectDB();
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
