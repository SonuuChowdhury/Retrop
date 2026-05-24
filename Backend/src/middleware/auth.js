import { authService } from '../services/authService.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// JWT AUTHENTICATION MIDDLEWARE
// ============================================================================
// Verifies JWT token and validates admin session

export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Missing or invalid authorization header',
      });
    }

    const accessToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify session and token
    const verification = await authService.verifySession(accessToken);
    if (!verification.valid) {
      return res.status(401).json({
        status: 'error',
        message: verification.error || 'Unauthorized',
      });
    }

    // Attach admin info to request
    req.admin = verification.admin;
    req.accessToken = accessToken;

    logger.debug(`Auth middleware passed for admin: ${verification.admin.adminId}`);
    next();
  } catch (error) {
    logger.error('Auth middleware error', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Authentication failed',
    });
  }
};

// ============================================================================
// ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
// ============================================================================
// Restricts routes to specific admin roles

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          status: 'error',
          message: 'Not authenticated',
        });
      }

      if (!allowedRoles.includes(req.admin.role)) {
        logger.warn(`Unauthorized role access attempt: ${req.admin.role} tried to access ${req.path}`);
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions',
        });
      }

      logger.debug(`Role check passed for ${req.admin.role} on ${req.path}`);
      next();
    } catch (error) {
      logger.error('Role middleware error', error.message);
      res.status(500).json({
        status: 'error',
        message: 'Permission check failed',
      });
    }
  };
};
