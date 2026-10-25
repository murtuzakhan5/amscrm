import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import meetingRoutes from './routes/meetingRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import dealRoutes from './routes/dealRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

export const createApp = () => {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows flexible development and Vite proxy
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS
  app.use(
    cors({
      origin: (origin, callback) => {
        // Echo incoming origin to allow custom domains (e.g. https://crm.amscrafters.com) and localhost
        return callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Parsers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Logging
  if (env.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // Auto-connect database before processing any request (essential for serverless/Vercel)
  app.use(async (req, res, next) => {
    try {
      await connectDB();
      next();
    } catch (err) {
      console.error('❌ Database connection failure:', err.message);
      return res.status(500).json({
        success: false,
        message: 'Database connection failed: ' + err.message,
      });
    }
  });

  // Rate Limiting on /api
  app.use('/api', apiLimiter);

  // Health check
  const healthCheck = (req, res) => {
    res.status(200).json({
      status: 'healthy',
      app: 'AMS Crafters CRM API',
      timestamp: new Date().toISOString(),
      timezone: env.defaultTimezone,
    });
  };
  app.get('/api/health', healthCheck);
  app.get('/health', healthCheck);

  // API Endpoints - mounted on both /api and root for proxy & rewrite flexibility
  const mountAPIRoutes = (prefix = '') => {
    app.use(`${prefix}/auth`, authRoutes);
    app.use(`${prefix}/employees`, employeeRoutes);
    app.use(`${prefix}/leads`, leadRoutes);
    app.use(`${prefix}/meetings`, meetingRoutes);
    app.use(`${prefix}/tasks`, taskRoutes);
    app.use(`${prefix}/clients`, clientRoutes);
    app.use(`${prefix}/projects`, projectRoutes);
    app.use(`${prefix}/deals`, dealRoutes);
    app.use(`${prefix}/attendance`, attendanceRoutes);
    app.use(`${prefix}/notifications`, notificationRoutes);
    app.use(`${prefix}/reports`, reportRoutes);
    app.use(`${prefix}/settings`, settingRoutes);
    app.use(`${prefix}/audit-logs`, auditRoutes);
  };

  mountAPIRoutes('/api');
  mountAPIRoutes('');

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
};
