import express from 'express';
import { SERVER_CONFIG } from './config/constants.js';
import { helmetMiddleware, generalLimiter } from './middleware/security.js';
import routes from './routes/index.js';
import { logger } from './utils/logger.js';

const app = express();

// ===== Security Middleware =====
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
app.use('/', routes);

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
  logger.error('Global Error:', err.message);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
  });
});

// ===== Start Server =====
app.listen(SERVER_CONFIG.PORT, () => {
  logger.info(`🚀 Server running on port ${SERVER_CONFIG.PORT}`);
  logger.info(`📋 Environment: ${SERVER_CONFIG.NODE_ENV}`);
});

export default app;
