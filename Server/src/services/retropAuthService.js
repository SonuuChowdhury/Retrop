// ============================================================================
// RETROP AUTH SERVICE
// ============================================================================
// Handles authentication for Retrop super admin accounts only.
// Uses a SEPARATE JWT secret from the restaurant admin JWT.
// ============================================================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { nowIST } from '../utils/time.js';

const JWT_SECRET = process.env.RETROP_JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.RETROP_JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  logger.warn('RETROP_JWT_SECRET or RETROP_JWT_REFRESH_SECRET not set — Retrop admin auth will fail');
}

const ACCESS_EXPIRY  = '8h';
const REFRESH_EXPIRY = '30d';

// ── Generate tokens ────────────────────────────────────────────────────────────
function generateTokens(adminId) {
  const payload = { adminId, type: 'retrop_admin' };
  const accessToken   = jwt.sign(payload, JWT_SECRET,  { expiresIn: ACCESS_EXPIRY });
  const refreshToken  = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
  return { accessToken, refreshToken };
}

// ── Verify access token ────────────────────────────────────────────────────────
export function verifyRetropToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export const retropAuthService = {

  // ── Login ──────────────────────────────────────────────────────────────────
  login: async (email, password, ipAddress, userAgent) => {
    try {
      const { data: admin, error } = await supabase
        .from('retrop_admin')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (error || !admin) {
        return { success: false, error: 'Invalid credentials', code: 401 };
      }

      if (!admin.isActive) {
        return { success: false, error: 'Account is deactivated', code: 403 };
      }

      const passwordMatch = await bcrypt.compare(password, admin.password);
      if (!passwordMatch) {
        return { success: false, error: 'Invalid credentials', code: 401 };
      }

      const { accessToken, refreshToken } = generateTokens(admin.adminId);
      const tokenExpiresAt        = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Deactivate old sessions
      await supabase
        .from('retrop_admin_session')
        .update({ isActive: false, updatedAt: nowIST() })
        .eq('adminId', admin.adminId)
        .eq('isActive', true);

      // Create new session
      await supabase.from('retrop_admin_session').insert([{
        adminId: admin.adminId,
        accessToken,
        refreshToken,
        tokenExpiresAt,
        refreshTokenExpiresAt,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        isActive: true,
        createdAt: nowIST(),
        updatedAt: nowIST(),
      }]);

      // Update lastLogIn
      await supabase
        .from('retrop_admin')
        .update({ lastLogIn: nowIST() })
        .eq('adminId', admin.adminId);

      logger.info(`Retrop admin logged in: ${email}`);

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          admin: {
            adminId: admin.adminId,
            name: admin.name,
            email: admin.email,
          },
        },
      };
    } catch (err) {
      logger.error('retropAuthService.login error', err.message);
      return { success: false, error: 'Internal error', code: 500 };
    }
  },

  // ── Refresh token ──────────────────────────────────────────────────────────
  refresh: async (refreshToken) => {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      if (decoded.type !== 'retrop_admin') {
        return { success: false, error: 'Invalid token type', code: 401 };
      }

      const { data: session, error } = await supabase
        .from('retrop_admin_session')
        .select('*')
        .eq('refreshToken', refreshToken)
        .eq('isActive', true)
        .maybeSingle();

      if (error || !session) {
        return { success: false, error: 'Session not found or expired', code: 401 };
      }

      const { accessToken: newAccess, refreshToken: newRefresh } = generateTokens(decoded.adminId);
      const tokenExpiresAt        = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await supabase
        .from('retrop_admin_session')
        .update({
          accessToken: newAccess,
          refreshToken: newRefresh,
          tokenExpiresAt,
          refreshTokenExpiresAt,
          updatedAt: nowIST(),
        })
        .eq('sessionId', session.sessionId);

      return { success: true, data: { accessToken: newAccess, refreshToken: newRefresh } };
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return { success: false, error: 'Refresh token expired', code: 401 };
      }
      logger.error('retropAuthService.refresh error', err.message);
      return { success: false, error: 'Internal error', code: 500 };
    }
  },

  // ── Logout ────────────────────────────────────────────────────────────────
  logout: async (adminId) => {
    try {
      await supabase
        .from('retrop_admin_session')
        .update({ isActive: false, updatedAt: nowIST() })
        .eq('adminId', adminId)
        .eq('isActive', true);
      return { success: true };
    } catch (err) {
      logger.error('retropAuthService.logout error', err.message);
      return { success: false, error: 'Internal error', code: 500 };
    }
  },

  // ── Verify session (for middleware) ───────────────────────────────────────
  verifySession: async (accessToken) => {
    try {
      const decoded = jwt.verify(accessToken, JWT_SECRET);
      if (decoded.type !== 'retrop_admin') return null;

      const { data: session } = await supabase
        .from('retrop_admin_session')
        .select('sessionId, isActive')
        .eq('accessToken', accessToken)
        .eq('isActive', true)
        .maybeSingle();

      if (!session) return null;
      return decoded;
    } catch {
      return null;
    }
  },

  // ── Seed first admin (run once from CLI or manually in DB) ───────────────
  createAdmin: async (name, email, password) => {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const { data, error } = await supabase
        .from('retrop_admin')
        .insert([{
          name,
          email: email.toLowerCase().trim(),
          password: hashedPassword,
          isActive: true,
          createdAt: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) return { success: false, error: error.message };
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
};
