// ============================================================================
// RETROP AUTH MIDDLEWARE
// ============================================================================
// JWT authentication for /api/retrop/* routes only.
// Uses RETROP_JWT_SECRET — separate from restaurant admin JWT.
// ============================================================================

import { retropAuthService } from '../services/retropAuthService.js';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export const retropAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      code: 'token_missing',
      message: 'Authorization header required',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = await retropAuthService.verifySession(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      code: 'token_invalid',
      message: 'Invalid or expired token. Please log in again.',
    });
  }

  // Fetch the admin record
  const { data: admin, error } = await supabase
    .from('retrop_admin')
    .select('adminId, name, email, isActive')
    .eq('adminId', decoded.adminId)
    .maybeSingle();

  if (error || !admin) {
    return res.status(401).json({
      success: false,
      code: 'admin_not_found',
      message: 'Admin account not found',
    });
  }

  if (!admin.isActive) {
    return res.status(403).json({
      success: false,
      code: 'admin_inactive',
      message: 'Your Retrop admin account has been deactivated',
    });
  }

  req.retropAdmin = admin;
  next();
};
