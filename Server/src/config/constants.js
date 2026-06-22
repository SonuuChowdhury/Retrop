// Server Configuration
export const SERVER_CONFIG = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// JWT Configuration
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET,
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRY: '15m', // 15 minutes
  REFRESH_TOKEN_EXPIRY: '7d', // 7 days
  REFRESH_TOKEN_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  // General rate limit - 500 requests per 15 minutes per IP
  // Increased because polling-heavy clients (customer status polling every 3s
  // + waiter dashboard polling) can easily exhaust a 100-req/15min window.
  general: {
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: true,   // don't count 4xx/5xx against the limit
  },
  // Strict rate limit for sensitive endpoints - 5 requests per 15 minutes
  strict: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later.',
    skipSuccessfulRequests: true,
  },
  // Admin login rate limit - 5 attempts per 15 minutes
  adminLogin: {
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many admin login attempts. Please try again later.',
    skipSuccessfulRequests: true,
  },
  // Waiter login rate limit - 10 attempts per 15 minutes
  waiterLogin: {
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { status: 'error', message: 'Too many login attempts. Please wait.' },
    standardHeaders: true,
    legacyHeaders: false,
  },
  // Kitchen login rate limit - 10 attempts per 15 minutes
  kitchenLogin: {
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { status: 'error', message: 'Too many login attempts. Please wait.' },
    standardHeaders: true,
    legacyHeaders: false,
  },
  // Public order rate limit - 120 requests per minute
  // Must be generous: customer polls /status every 3s (20 req/min)
  // plus QR scan, submit-info, menu fetch, place-order = ~25 req/min minimum.
  // 120/min gives safe headroom for multiple tables on same IP.
  publicOrder: {
    windowMs: 1 * 60 * 1000,
    max: 120,
    message: { status: 'error', message: 'Too many requests. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipFailedRequests: true,
  },
};

// Helmet Security Configuration
export const HELMET_CONFIG = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
};
