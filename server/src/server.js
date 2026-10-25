import http from 'http';
import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { setupSocketIO } from './config/socket.js';
import { env } from './config/env.js';
import { seedSuperAdmin } from './scripts/seedSuperAdmin.js';

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed Initial Super Admin if not present
    await seedSuperAdmin();

    const app = createApp();
    const httpServer = http.createServer(app);

    // Setup Socket.IO for real-time CRM updates
    const io = setupSocketIO(httpServer);

    httpServer.listen(env.port, () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 AMS Crafters CRM Server is live`);
      console.log(`🌐 URL:        http://localhost:${env.port}`);
      console.log(`⚙️ Mode:       ${env.nodeEnv}`);
      console.log(`🕒 Timezone:   ${env.defaultTimezone}`);
      console.log(`🔌 WebSockets: Enabled (Socket.IO)`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    // Graceful Shutdown
    const handleShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      httpServer.close(async () => {
        await disconnectDB();
        console.log('👋 AMS Crafters Server terminated.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
