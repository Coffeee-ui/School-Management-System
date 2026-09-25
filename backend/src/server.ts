import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { APP_CONFIG } from './config/index.js';
import { SqliteProvider } from './db/sqliteProvider.js';
import { initializeDatabaseSchema } from './db/schema.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { apiRateLimiter } from './middleware/rateLimitMiddleware.js';
import { seedDatabase } from '../scripts/seed.js';

const app = express();

// Initialize Database Schema on startup
const dbProvider = SqliteProvider.getInstance();
initializeDatabaseSchema(dbProvider);

// If Demo Mode and database is empty, seed demo data automatically
if (APP_CONFIG.DEMO_MODE) {
  const usersCount = dbProvider.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users');
  if (!usersCount || usersCount.count === 0) {
    console.log('[Demo Mode]: Database is empty. Seeding initial demo institutional records...');
    seedDatabase(false).catch((err) => console.error('Auto-seed failed:', err));
  }
}

// Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // allow flexible development and SPA loading
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: [APP_CONFIG.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// General rate limiter for API
app.use('/api', apiRateLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API routes under /api
app.use('/api', apiRouter);

// Global error handling middleware
app.use(errorHandler);

// Start server
const server = app.listen(APP_CONFIG.PORT, () => {
  console.log(`=======================================================`);
  console.log(`  Apex Institute School Management Portal API Server   `);
  console.log(`=======================================================`);
  console.log(`  Port:         ${APP_CONFIG.PORT}`);
  console.log(`  Mode:         ${APP_CONFIG.MODE.toUpperCase()} MODE`);
  console.log(`  Demo Active:  ${APP_CONFIG.DEMO_MODE}`);
  console.log(`  Database:     ${APP_CONFIG.SQLITE_DB_PATH}`);
  console.log(`  Health Check: http://localhost:${APP_CONFIG.PORT}/api/health`);
  console.log(`=======================================================`);
});

export default app;
