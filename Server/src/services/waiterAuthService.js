// ============================================================================
// WAITER AUTH SERVICE
// ============================================================================
// Handles waiter login, JWT generation, session management via Redis.
// Parallel to admin authService but for waiter role.
// ============================================================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { redis, REDIS_KEYS } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { nowIST } from '../utils/time.js';
import { notificationService } from './notificationService.js';

const WAITER_JWT_SECRET = process.env.WAITER_JWT_SECRET || process.env.JWT_SECRET + '_waiter';
const WAITER_REFRESH_SECRET = process.env.WAITER_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET + '_waiter';
const ACCESS_EXPIRY = '8h';   // Waiter shift token — 8 hours
const REFRESH_EXPIRY = '7d';
const ACCESS_EXPIRY_SEC = 8 * 60 * 60;
const REFRESH_EXPIRY_SEC = 7 * 24 * 60 * 60;

export const waiterAuthService = {
  // ── Generate waiter access token ──────────────────────────────────────
  generateAccessToken: (waiterId, restaurantId) => {
    return jwt.sign({ waiterId, role: 'waiter', restaurantId }, WAITER_JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
  },

  // ── Generate waiter refresh token ─────────────────────────────────────
  generateRefreshToken: (waiterId, restaurantId) => {
    return jwt.sign({ waiterId, restaurantId }, WAITER_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
  },

  // ── Verify waiter token ───────────────────────────────────────────────
  verifyToken: (token, isRefresh = false) => {
    try {
      const secret = isRefresh ? WAITER_REFRESH_SECRET : WAITER_JWT_SECRET;
      return jwt.verify(token, secret);
    } catch (err) {
      logger.debug('Waiter token verification failed', err.message);
      return null;
    }
  },

  // ── Login ─────────────────────────────────────────────────────────────
  login: async (restaurantId, mobile, password, fcmToken, ipAddress, userAgent) => {
    try {
      // 1. Find waiter
      const { data: waiter, error: waiterError } = await supabase
        .from('waiter')
        .select('*')
        .eq('mobile', mobile)
        .eq('restaurantId', restaurantId)
        .maybeSingle();

      if (waiterError || !waiter) {
        return { success: false, error: 'Invalid credentials', code: 401 };
      }

      // 2. isActive check — show specific message
      if (!waiter.isActive) {
        return {
          success: false,
          error: 'Your account is disabled. Please contact your manager to enable it.',
          code: 403,
          disabled: true,
        };
      }

      // 3. Password check
      const valid = await bcrypt.compare(password, waiter.password);
      if (!valid) {
        return { success: false, error: 'Invalid credentials', code: 401 };
      }

      // 4. Generate tokens
      const accessToken = waiterAuthService.generateAccessToken(waiter.waiterId, restaurantId);
      const refreshToken = waiterAuthService.generateRefreshToken(waiter.waiterId, restaurantId);

      // 5. Store session in Redis (access token → waiter data)
      const sessionData = {
        waiterId: waiter.waiterId,
        restaurantId: waiter.restaurantId,
        waiterName: waiter.waiterName,
        mobile: waiter.mobile,
        refreshToken,
        fcmToken: fcmToken || null,
        ipAddress,
        userAgent,
        loggedInAt: nowIST(),
      };
      await redis.set(REDIS_KEYS.waiterSession(restaurantId, waiter.waiterId), sessionData, ACCESS_EXPIRY_SEC);

      // 6. Also upsert session in Supabase (for manager visibility)
      await supabase.from('waiter_session').upsert({
        waiterId: waiter.waiterId,
        restaurantId,
        isActive: true,
        ipAddress,
        userAgent,
        updatedAt: nowIST(),
      }, { onConflict: 'waiterId' });

      // 7. Register FCM token for push notifications
      if (fcmToken) {
        await notificationService.registerWaiterToken(waiter.waiterId, fcmToken);
      }

      // 8. Update lastLogIn
      await supabase.from('waiter').update({ lastLogIn: nowIST() }).eq('waiterId', waiter.waiterId);

      logger.info(`Waiter logged in: ${waiter.waiterName} (${mobile})`);

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          waiter: {
            waiterId: waiter.waiterId,
            waiterName: waiter.waiterName,
            mobile: waiter.mobile,
            isActive: waiter.isActive,
          },
          expiresIn: ACCESS_EXPIRY,
        },
      };
    } catch (err) {
      logger.error('Waiter login error', err.message);
      return { success: false, error: 'Login failed', code: 500 };
    }
  },

  // ── Refresh access token ──────────────────────────────────────────────
  refreshAccessToken: async (refreshToken) => {
    try {
      const decoded = waiterAuthService.verifyToken(refreshToken, true);
      if (!decoded || !decoded.restaurantId) return { success: false, error: 'Invalid refresh token' };

      const sessionData = await redis.get(REDIS_KEYS.waiterSession(decoded.restaurantId, decoded.waiterId));
      if (!sessionData || sessionData.refreshToken !== refreshToken) {
        return { success: false, error: 'Session expired, please login again' };
      }

      // Validate waiter still active in DB
      const { data: waiter } = await supabase
        .from('waiter')
        .select('waiterId, waiterName, mobile, isActive, restaurantId')
        .eq('waiterId', decoded.waiterId)
        .eq('restaurantId', decoded.restaurantId)
        .maybeSingle();

      if (!waiter || !waiter.isActive) {
        await redis.del(REDIS_KEYS.waiterSession(decoded.restaurantId, decoded.waiterId));
        return {
          success: false,
          error: 'Your account has been disabled. Contact your manager.',
          disabled: true,
        };
      }

      const newAccessToken = waiterAuthService.generateAccessToken(waiter.waiterId, decoded.restaurantId);

      // Extend Redis TTL
      await redis.set(REDIS_KEYS.waiterSession(decoded.restaurantId, waiter.waiterId), {
        ...sessionData,
        loggedInAt: sessionData.loggedInAt,
      }, ACCESS_EXPIRY_SEC);

      return { success: true, data: { accessToken: newAccessToken } };
    } catch (err) {
      logger.error('Waiter refresh token error', err.message);
      return { success: false, error: 'Token refresh failed' };
    }
  },

  // ── Logout ────────────────────────────────────────────────────────────
  logout: async (restaurantId, waiterId) => {
    try {
      await redis.del(REDIS_KEYS.waiterSession(restaurantId, waiterId));
      await notificationService.unregisterWaiterToken(waiterId);
      await supabase.from('waiter_session')
        .update({ isActive: false, socketId: null, updatedAt: nowIST() })
        .eq('waiterId', waiterId)
        .eq('restaurantId', restaurantId);
      logger.info(`Waiter logged out: ${waiterId} of restaurant ${restaurantId}`);
      return { success: true };
    } catch (err) {
      logger.error('Waiter logout error', err.message);
      return { success: false, error: 'Logout failed' };
    }
  },

  // ── Verify waiter session (used by middleware) ─────────────────────────
  verifySession: async (accessToken) => {
    try {
      const decoded = waiterAuthService.verifyToken(accessToken);
      if (!decoded || !decoded.restaurantId) return { valid: false, error: 'Invalid or expired token' };

      // Check Redis first (fast path)
      const sessionData = await redis.get(REDIS_KEYS.waiterSession(decoded.restaurantId, decoded.waiterId));
      if (!sessionData) {
        // Fallback: check DB session
        const { data: dbSession } = await supabase
          .from('waiter_session')
          .select('isActive')
          .eq('waiterId', decoded.waiterId)
          .eq('restaurantId', decoded.restaurantId)
          .eq('isActive', true)
          .maybeSingle();
        if (!dbSession) return { valid: false, error: 'Session not found' };
      }

      // Always validate isActive from DB (handles manager disable scenario)
      const { data: waiter } = await supabase
        .from('waiter')
        .select('waiterId, waiterName, mobile, isActive, restaurantId')
        .eq('waiterId', decoded.waiterId)
        .eq('restaurantId', decoded.restaurantId)
        .maybeSingle();

      if (!waiter) return { valid: false, error: 'Waiter not found' };
      if (!waiter.isActive) {
        // Clear session in Redis immediately
        await redis.del(REDIS_KEYS.waiterSession(decoded.restaurantId, decoded.waiterId));
        return { valid: false, error: 'Account disabled', disabled: true };
      }

      return { valid: true, waiter };
    } catch (err) {
      logger.error('Waiter session verification error', err.message);
      return { valid: false, error: 'Session verification failed' };
    }
  },
};