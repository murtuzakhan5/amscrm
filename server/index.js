import http from 'http';
import { createApp } from './src/app.js';
import { connectDB } from './src/config/db.js';
import { setupSocketIO } from './src/config/socket.js';
import { env } from './src/config/env.js';
import { seedSuperAdmin } from './src/scripts/seedSuperAdmin.js';

const app = createApp();

// If running in traditional Node.js environment (Local / Render / VPS), start HTTP server
if (!process.env.VERCEL) {
  const startServer = async () => {
    try {
      await connectDB();
      await seedSuperAdmin();

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

// Export default app for Vercel Express service / Serverless
export default app;
