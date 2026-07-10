import './config/env.js';
// ===== FORCE NODEMON RELOAD: ECIES BASE64 ESM FIX =====
// ===== THEN IMPORT OTHER MODULES =====
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SERVER_CONFIG } from './config/constants.js';
import { helmetMiddleware, generalLimiter } from './middleware/security.js';
import router from './routes/routes.js';
import { logger } from './utils/logger.js';
import { testSupabaseConnection } from './config/supabase.js';
import { notFound } from './controllers/healthController.js';
import { socketService } from './services/socketService.js';
import { getRedisClient } from './config/redis.js';
import { initBillingScheduler } from './utils/billingCron.js';

const app = express();

// ===== Trust Proxy =====
// Required when requests come through a proxy / local network (e.g. phone on LAN,
// Nginx, or any reverse proxy). Without this, express-rate-limit throws
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR when it sees the X-Forwarded-For header.
// '1' means trust the first proxy hop only — safe for local dev and single-proxy prod.
app.set('trust proxy', 1);

// ===== Security Middleware =====
app.use(helmetMiddleware);
app.use(generalLimiter);

// ===== CORS Middleware =====
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174', 'http://localhost:5180'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'X-Requested-With', 'X-Product-Key', 'x-product-key'],
}));

// ===== Body Parser Middleware =====
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(
  express.raw({
    type: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    limit: '6mb',
  })
);

// ===== Request Logging Middleware =====
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// ===== Routes =====
app.use(router);
router.use(notFound);

// ===== Body-parser SyntaxError Handler =====
// Catches malformed / empty JSON bodies before they reach the global handler.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ status: 'error', message: 'Invalid JSON body' });
  }
  next(err);
});

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
  logger.error('Global Error:', err.message);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

// ===== Start Server with Socket.io =====
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false,
    allowedHeaders: ['authorization'],
  },
  transports: ['websocket', 'polling'],
});

socketService.initializeSocket(io);

const server = httpServer.listen(SERVER_CONFIG.PORT, async () => {
  logger.info(`🚀 Server running on port ${SERVER_CONFIG.PORT}`);
  logger.info(`📋 Environment: ${SERVER_CONFIG.NODE_ENV}`);
  logger.info('✓ Helmet security middleware enabled');
  logger.info('✓ Rate limiting enabled');
  logger.info('✓ Admin authentication system initialized');
  logger.info('✓ Waiter authentication system initialized');
  logger.info('✓ Kitchen authentication system initialized');
  logger.info('✓ WebSocket (Socket.io) server initialized and running');
  logger.info('✓ Menu image upload (Supabase Storage) enabled');
  logger.info('✓ Customer public order flow enabled');

  // Test Supabase connection on startup
  const dbConnected = await testSupabaseConnection();
  if (dbConnected) {
    logger.info('✓ Database (Supabase) connected successfully');
  } else {
    logger.warn('⚠ Database connection failed - check credentials');
  }

  // Initialize Daily Billing & Subscription Scheduler
  initBillingScheduler();

  // Test Redis connection on startup
  try {
    await getRedisClient();
    logger.info('✓ Redis connected successfully');
  } catch (err) {
    logger.warn('⚠ Redis connection failed - caching and session features degraded');
    logger.warn('  Set REDIS_URL in .env to enable Redis features');
  }
});

// ===== Graceful Shutdown =====
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await socketService.closeService();
  io.close();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;