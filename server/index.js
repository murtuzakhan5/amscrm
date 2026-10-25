import http from 'http';
import { createApp } from './src/app.js';
import { connectDB } from './src/config/db.js';
import { setupSocketIO } from './src/config/socket.js';
import { env } from './src/config/env.js';
import { seedSuperAdmin } from './src/scripts/seedSuperAdmin.js';

const app = createApp();

let isConnected = false;
let isSeeded = false;

// Middleware to ensure DB connection is active before processing requests (Serverless compatible)
app.use(async (req, res, next) => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
      if (!isSeeded) {
        try {
          await seedSuperAdmin();
        } catch (seedErr) {
          console.warn('Seed warning:', seedErr.message);
        }
        isSeeded = true;
      }
    } catch (err) {
      console.error('❌ Database connection error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database connection failed: ' + err.message,
      });
    }
  }
  next();
});

// If running in traditional Node.js environment (Local / Render), start the HTTP server
if (!process.env.VERCEL) {
  const startServer = async () => {
    try {
      await connectDB();
      isConnected = true;
      await seedSuperAdmin();
      isSeeded = true;

      const httpServer = http.createServer(app);
      setupSocketIO(httpServer);

      httpServer.listen(env.port, () => {
        console.log(`🚀 AMS Crafters CRM Server is live on http://localhost:${env.port}`);
      });
    } catch (error) {
      console.error('❌ Failed to start server:', error);
    }
  };
  startServer();
}

// Export default app for Vercel Serverless / Vercel Services
export default app;
