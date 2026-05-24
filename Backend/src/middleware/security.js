import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { HELMET_CONFIG, RATE_LIMIT_CONFIG } from '../config/constants.js';

// Helmet middleware - protects against common vulnerabilities
export const helmetMiddleware = helmet(HELMET_CONFIG);

// General rate limiter - protects against DDoS attacks
export const generalLimiter = rateLimit(RATE_LIMIT_CONFIG.general);

// Strict rate limiter for sensitive endpoints (login, auth, etc.)
export const strictLimiter = rateLimit(RATE_LIMIT_CONFIG.strict);
