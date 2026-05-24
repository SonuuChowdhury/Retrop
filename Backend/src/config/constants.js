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
  // General rate limit - 100 requests per 15 minutes
  general: {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
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
