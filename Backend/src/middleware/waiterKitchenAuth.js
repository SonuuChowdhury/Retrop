// ============================================================================
// WAITER & KITCHEN AUTH MIDDLEWARE
// ============================================================================

import { waiterAuthService } from '../services/waiterAuthService.js';
import { kitchenAuthService } from '../services/kitchenAuthService.js';
import { logger } from '../utils/logger.js';

// ── Waiter auth middleware ────────────────────────────────────────────────────
export const waiterAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Missing authorization header' });
    }
    const token = authHeader.substring(7);
    const verification = await waiterAuthService.verifySession(token);

    if (!verification.valid) {
      if (verification.disabled) {
        return res.status(403).json({
          status: 'error',
          message: 'Your account is disabled. Please contact your manager.',
          disabled: true,
        });
      }
      return res.status(401).json({ status: 'error', message: verification.error || 'Unauthorized' });
    }

    req.waiter = verification.waiter;
    next();
  } catch (err) {
    logger.error('Waiter auth middleware error', err.message);
    res.status(500).json({ status: 'error', message: 'Authentication failed' });
  }
};

// ── Kitchen auth middleware ───────────────────────────────────────────────────
export const kitchenAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', message: 'Missing authorization header' });
    }
    const token = authHeader.substring(7);
    const verification = await kitchenAuthService.verifySession(token);

    if (!verification.valid) {
      if (verification.disabled) {
        return res.status(403).json({
          status: 'error',
          message: 'Your account is disabled. Please contact your manager.',
          disabled: true,
        });
      }
      return res.status(401).json({ status: 'error', message: verification.error || 'Unauthorized' });
    }

    req.kitchen = verification.kitchen;
    next();
  } catch (err) {
    logger.error('Kitchen auth middleware error', err.message);
    res.status(500).json({ status: 'error', message: 'Authentication failed' });
  }
};