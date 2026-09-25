import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export type AppMode = 'normal' | 'demo';

const mode: AppMode = (process.env.APP_MODE?.toLowerCase() === 'demo') ? 'demo' : 'normal';

export const APP_CONFIG = {
  MODE: mode,
  DEMO_MODE: mode === 'demo',
  NORMAL_MODE: mode === 'normal',
  PORT: parseInt(process.env.PORT || '5000', 10),
  SQLITE_DB_PATH: process.env.SQLITE_DB_PATH || './data/application.db',
  JWT_SECRET: process.env.JWT_SECRET || 'apex_institute_default_jwt_secret_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

export default APP_CONFIG;
