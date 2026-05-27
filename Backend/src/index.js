import './config/env.js';
// ===== THEN IMPORT OTHER MODULES =====
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { SERVER_CONFIG } from './config/constants.js';
import { helmetMiddleware, generalLimiter } from './middleware/security.js';
import router from './routes/routes.js';
import { logger } from './utils/logger.js';
import { testSupabaseConnection } from './config/supabase.js';
import { notFound } from './controllers/healthController.js';
import { socketService } from './services/socketService.js';

const app = express();

// ===== Security Middleware =====
// Helmet - protects against common vulnerabilities
app.use(helmetMiddleware);

// Rate Limiting - protects against DDoS attacks
app.use(generalLimiter);

// ===== Body Parser Middleware =====
// JSON body (for most endpoints + base64 image uploads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Raw binary body for direct image uploads
// This allows the image upload endpoint to receive raw bytes
// when the client sends Content-Type: image/*
app.use(
  express.raw({
    type: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    limit: '6mb', // slightly above 5MB to give a clean error rather than a truncation
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

// Initialize Socket.io with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: false,
    allowedHeaders: ['authorization'],
  },
  transports: ['websocket', 'polling'],
});

// Initialize socket connection handlers
socketService.initializeSocket(io);

const server = httpServer.listen(SERVER_CONFIG.PORT, async () => {
  logger.info(`🚀 Server running on port ${SERVER_CONFIG.PORT}`);
  logger.info(`📋 Environment: ${SERVER_CONFIG.NODE_ENV}`);
  logger.info('✓ Helmet security middleware enabled');
  logger.info('✓ Rate limiting enabled (100 requests per 15 min)');
  logger.info('✓ Strict rate limiting on /login (5 requests per 15 min)');
  logger.info('✓ Admin authentication system initialized');
  logger.info('✓ Manager dashboard endpoints initialized');
  logger.info('✓ WebSocket (Socket.io) server initialized and running');
  logger.info('✓ Menu image upload (Supabase Storage) enabled');

  // Test Supabase connection on startup
  const dbConnected = await testSupabaseConnection();
  if (dbConnected) {
    logger.info('✓ Database connected successfully');
  } else {
    logger.warn('⚠ Database connection failed - check credentials');
  }
});

// ===== Graceful Shutdown =====
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  
  // Close socket service and all active sessions
  await socketService.closeService();
  
  // Close Socket.io
  io.close();
  
  // Close HTTP server
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;