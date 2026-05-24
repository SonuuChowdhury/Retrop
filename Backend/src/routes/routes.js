import express from 'express';
import { getHealth, handleLogin, notFound } from '../controllers/healthController.js';
import rateLimit from 'express-rate-limit';
import { strictLimiter } from '../middleware/security.js';
import {
  adminLogin,
  refreshToken,
  adminLogout,
  getCurrentAdmin,
} from '../controllers/adminController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { RATE_LIMIT_CONFIG } from '../config/constants.js';

const router = express.Router();
const adminLoginLimiter = rateLimit(RATE_LIMIT_CONFIG.adminLogin);

// Health check endpoint
router.get('/', getHealth);

// Admin authentication routes
//============================================================================
// PUBLIC ROUTES (No Authentication Required)
// ============================================================================
/**
 * POST /api/admin/login
 * Login with mobile and password
 * Rate limited to 5 attempts per 15 minutes
 * Returns: accessToken, refreshToken, adminInfo
 */
router.post('/api/admin/login', adminLoginLimiter, adminLogin);
/**
 * POST /api/admin/refresh
 * Refresh access token using refresh token
 * Returns: new accessToken
 */
router.post('/api/admin/refresh', refreshToken);
// ============================================================================
// PROTECTED ROUTES (Authentication Required)
// ============================================================================
/**
 * POST /api/admin/logout
 * Logout current admin
 * Requires: Valid access token
 */
router.post('/api/admin/logout', authMiddleware, adminLogout);
/**
 * GET /api/admin/profile
 * Get current authenticated admin's profile
 * Requires: Valid access token
 */
router.get('/api/admin/profile', authMiddleware, getCurrentAdmin);


// Login endpoint with strict rate limiting
router.post('/login', strictLimiter, handleLogin);

router.use(notFound);

export default router;
