// ============================================================================
// PORTAL AUTH MIDDLEWARE
// Validates portal user JWT tokens and attaches req.portalUser
// ============================================================================

import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export const portalAuthMiddleware = async (req, res, next) => {
  try {
    const secret = process.env.PORTAL_JWT_SECRET || 'retrop_portal_jwt_secret_key_2026';
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }


    // Verify session is still active in DB
    const { data: session, error } = await supabase
      .from('portal_user_session')
      .select('sessionId, userId, isActive')
      .eq('accessToken', token)
      .eq('isActive', true)
      .maybeSingle();

    if (error || !session) {
      return res.status(401).json({ success: false, message: 'Session expired or revoked. Please login again.' });
    }

    req.portalUserId = decoded.userId;
    req.portalSessionId = session.sessionId;
    next();
  } catch (err) {
    logger.error('portalAuthMiddleware error', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
