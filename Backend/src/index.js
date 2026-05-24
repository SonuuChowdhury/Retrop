import './config/env.js';
// ===== THEN IMPORT OTHER MODULES =====
import express from 'express';
import { SERVER_CONFIG } from './config/constants.js';
import { helmetMiddleware, generalLimiter } from './middleware/security.js';
import router from './routes/routes.js';
import { logger } from './utils/logger.js';
import { testSupabaseConnection } from './config/supabase.js';

const app = express();

// ===== Security Middleware =====
// Helmet - protects against common vulnerabilities
app.use(helmetMiddleware);

// Rate Limiting - protects against DDoS attacks
app.use(generalLimiter);

// ===== Body Parser Middleware =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== Request Logging Middleware =====
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// ===== Routes =====
app.use(router)

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
  logger.error('Global Error:', err.message);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

// ===== Start Server =====
const server = app.listen(SERVER_CONFIG.PORT, async () => {
  logger.info(`🚀 Server running on port ${SERVER_CONFIG.PORT}`);
  logger.info(`📋 Environment: ${SERVER_CONFIG.NODE_ENV}`);
  logger.info('✓ Helmet security middleware enabled');
  logger.info('✓ Rate limiting enabled (100 requests per 15 min)');
  logger.info('✓ Strict rate limiting on /login (5 requests per 15 min)');
  logger.info('✓ Admin authentication system initialized');
  
  // Test Supabase connection on startup
  const dbConnected = await testSupabaseConnection();
  if (dbConnected) {
    logger.info('✓ Database connected successfully');
  } else {
    logger.warn('⚠ Database connection failed - check credentials');
  }
});

export default app;
