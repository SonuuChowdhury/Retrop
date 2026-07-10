// ============================================================================
// OWNER AUTH SERVICE
// ============================================================================
// Handles authentication for Retrop restaurant owner accounts.
// Uses OWNER_JWT_SECRET / OWNER_JWT_REFRESH_SECRET.
// ============================================================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { nowIST } from '../utils/time.js';

const JWT_SECRET = process.env.OWNER_JWT_SECRET || process.env.RETROP_JWT_SECRET || 'default_owner_secret_key_123';
const JWT_REFRESH_SECRET = process.env.OWNER_JWT_REFRESH_SECRET || process.env.RETROP_JWT_REFRESH_SECRET || 'default_owner_refresh_secret_key_123';

const ACCESS_EXPIRY  = '8h';
const REFRESH_EXPIRY = '30d';

// ── Generate tokens ────────────────────────────────────────────────────────────
function generateTokens(ownerId) {
  const payload = { ownerId, type: 'retrop_owner' };
  const accessToken   = jwt.sign(payload, JWT_SECRET,  { expiresIn: ACCESS_EXPIRY });
  const refreshToken  = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
  return { accessToken, refreshToken };
}

// ── Verify access token ────────────────────────────────────────────────────────
export function verifyOwnerToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export const ownerAuthService = {

  // ── Login ──────────────────────────────────────────────────────────────────
  login: async (loginIdentifier, password, ipAddress, userAgent) => {
    try {
      // Allow login via email OR mobile (email is preferred, but mobile is very common in India)
      const isEmail = loginIdentifier.includes('@');
      let query = supabase.from('retrop_owner').select('*');
      
      if (isEmail) {
        query = query.eq('email', loginIdentifier.toLowerCase().trim());
      } else {
        query = query.eq('mobile', loginIdentifier.trim());
      }

      const { data: owner, error } = await query.maybeSingle();

      if (error || !owner) {
        return { success: false, error: 'Invalid credentials', code: 401 };
      }

      if (!owner.isActive) {
        return { success: false, error: 'Account is deactivated', code: 403 };
      }

      const passwordMatch = await bcrypt.compare(password, owner.password);
      if (!passwordMatch) {
        return { success: false, error: 'Invalid credentials', code: 401 };
      }

      // Check if password reset is needed (first login check)
      if (owner.needsPasswordReset) {
        return {
          success: true,
          needsReset: true,
          message: 'Password reset required on first login',
          data: {
            ownerId: owner.ownerId,
            email: owner.email,
            mobile: owner.mobile,
          }
        };
      }

      const { accessToken, refreshToken } = generateTokens(owner.ownerId);
      const tokenExpiresAt        = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      // Deactivate old sessions
      await supabase
        .from('retrop_owner_session')
        .update({ isActive: false, updatedAt: nowIST() })
        .eq('ownerId', owner.ownerId)
        .eq('isActive', true);

      // Create new session
      await supabase.from('retrop_owner_session').insert([{
        ownerId: owner.ownerId,
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
        .from('retrop_owner')
        .update({ lastLogIn: nowIST() })
        .eq('ownerId', owner.ownerId);

      logger.info(`Retrop owner logged in: ${owner.email}`);

      return {
        success: true,
        needsReset: false,
        data: {
          accessToken,
          refreshToken,
          owner: {
            ownerId: owner.ownerId,
            name: owner.name,
            email: owner.email,
            mobile: owner.mobile,
          },
        },
      };
    } catch (err) {
      logger.error('ownerAuthService.login error', err.message);
      return { success: false, error: 'Internal error', code: 500 };
    }
  },

  // ── Reset Password (before session creation / first login) ────────────────
  firstLoginResetPassword: async (ownerId, newPassword) => {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const { data, error } = await supabase
        .from('retrop_owner')
        .update({
          password: hashedPassword,
          needsPasswordReset: false,
          updatedAt: nowIST()
        })
        .eq('ownerId', ownerId)
        .select();

      if (error || !data.length) {
        return { success: false, error: 'Failed to reset password', code: 400 };
      }

      logger.info(`Owner ${data[0].email} successfully reset password`);
      return { success: true };
    } catch (err) {
      logger.error('ownerAuthService.firstLoginResetPassword error', err.message);
      return { success: false, error: 'Internal error', code: 500 };
    }
  },

  // ── Refresh token ──────────────────────────────────────────────────────────
  refresh: async (refreshToken) => {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
      if (decoded.type !== 'retrop_owner') {
        return { success: false, error: 'Invalid token type', code: 401 };
      }

      const { data: session, error } = await supabase
        .from('retrop_owner_session')
        .select('*')
        .eq('refreshToken', refreshToken)
        .eq('isActive', true)
        .maybeSingle();

      if (error || !session) {
        return { success: false, error: 'Session not found or expired', code: 401 };
      }

      const { accessToken: newAccess, refreshToken: newRefresh } = generateTokens(decoded.ownerId);
      const tokenExpiresAt        = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await supabase
        .from('retrop_owner_session')
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
      logger.error('ownerAuthService.refresh error', err.message);
      return { success: false, error: 'Token refresh failed', code: 401 };
    }
  },

  // ── Logout ─────────────────────────────────────────────────────────────────
  logout: async (ownerId) => {
    try {
      await supabase
        .from('retrop_owner_session')
        .update({ isActive: false, updatedAt: nowIST() })
        .eq('ownerId', ownerId)
        .eq('isActive', true);

      return { success: true };
    } catch (err) {
      logger.error('ownerAuthService.logout error', err.message);
      return { success: false, error: 'Logout failed', code: 500 };
    }
  }
};
