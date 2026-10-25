import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  clientUrl: process.env.CLIENT_URL || 'https://crm.amscrafters.com',
  mongodbUri:
    process.env.MONGODB_URI ||
    'mongodb+srv://murtuzakhanedu:Murtuzakhan8248@cluster0.xr3uvl7.mongodb.net/ams-software?retryWrites=true&w=majority',
  useInMemoryDb: process.env.USE_IN_MEMORY_DB === 'true',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'ams_crafters_access_token_secret_key_super_secure_2026_dev',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'ams_crafters_refresh_token_secret_key_super_secure_2026_dev',
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  initialAdminName: process.env.INITIAL_ADMIN_NAME || 'AMS Super Admin',
  initialAdminEmail: process.env.INITIAL_ADMIN_EMAIL || 'admin@amscrafters.com',
  initialAdminPassword: process.env.INITIAL_ADMIN_PASSWORD || 'AdminPassword123!',
  initialAdminPhone: process.env.INITIAL_ADMIN_PHONE || '+92 300 1234567',
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER || '',
  smtpPassword: process.env.SMTP_PASSWORD || '',
  emailFrom: process.env.EMAIL_FROM || 'AMS Crafters <no-reply@amscrafters.com>',
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Karachi',
  defaultCurrency: process.env.DEFAULT_CURRENCY || 'USD',
};
