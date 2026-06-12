// ============================================================================
// KITCHEN AUTH SERVICE
// ============================================================================
// Kitchen staff login via mobile + password.
// Kitchen devices are React Native apps receiving FCM push notifications.
// ============================================================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { redis, REDIS_KEYS } from '../config/redis.js';
import { logger } from '../utils/logger.js';
import { nowIST } from '../utils/time.js';
import { notificationService } from './notificationService.js';

const KITCHEN_JWT_SECRET = process.env.KITCHEN_JWT_SECRET || process.env.JWT_SECRET + '_kitchen';
const KITCHEN_REFRESH_SECRET = process.env.KITCHEN_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET + '_kitchen';
const ACCESS_EXPIRY = '12h';
const ACCESS_EXPIRY_SEC = 12 * 60 * 60;

export const kitchenAuthService = {
  generateAccessToken: (kitchenId) => {
    return jwt.sign({ kitchenId, role: 'kitchen' }, KITCHEN_JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
  },

  generateRefreshToken: (kitchenId) => {
    return jwt.sign({ kitchenId }, KITCHEN_REFRESH_SECRET, { expiresIn: '30d' });
  },

  verifyToken: (token, isRefresh = false) => {
    try {
      const secret = isRefresh ? KITCHEN_REFRESH_SECRET : KITCHEN_JWT_SECRET;
      return jwt.verify(token, secret);
    } catch (err) {
      logger.debug('Kitchen token verification failed', err.message);
      return null;
    }
  },

  login: async (mobile, password, fcmToken, ipAddress, userAgent) => {
    try {
      const { data: kitchen, error } = await supabase
        .from('kitchen')
        .select('*')
        .eq('mobile', mobile)
        .maybeSingle();

      if (error || !kitchen) {
        return { success: false, error: 'Invalid credentials', code: 401 };
      }

      if (!kitchen.isActive) {
        return {
          success: false,
          error: 'Your account is disabled. Please contact your manager.',
          code: 403,
          disabled: true,
        };
      }

      const valid = await bcrypt.compare(password, kitchen.password);
      if (!valid) {
        return { success: false, error: 'Invalid credentials', code: 401 };
      }

      const accessToken = kitchenAuthService.generateAccessToken(kitchen.kitchenId);
      const refreshToken = kitchenAuthService.generateRefreshToken(kitchen.kitchenId);

      const sessionData = {
        kitchenId: kitchen.kitchenId,
        kitchenName: kitchen.kitchenName,
        mobile: kitchen.mobile,
        refreshToken,
        fcmToken: fcmToken || null,
        loggedInAt: nowIST(),
      };
      await redis.set(REDIS_KEYS.kitchenSession(kitchen.kitchenId), sessionData, ACCESS_EXPIRY_SEC);

      if (fcmToken) {
        await notificationService.registerKitchenToken(kitchen.kitchenId, fcmToken);
      }

      await supabase.from('kitchen').update({ lastLogIn: nowIST() }).eq('kitchenId', kitchen.kitchenId);

      logger.info(`Kitchen logged in: ${kitchen.kitchenName}`);

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          kitchen: {
            kitchenId: kitchen.kitchenId,
            kitchenName: kitchen.kitchenName,
            mobile: kitchen.mobile,
          },
          expiresIn: ACCESS_EXPIRY,
        },
      };
    } catch (err) {
      logger.error('Kitchen login error', err.message);
      return { success: false, error: 'Login failed', code: 500 };
    }
  },

  refreshAccessToken: async (refreshToken) => {
    try {
      const decoded = kitchenAuthService.verifyToken(refreshToken, true);
      if (!decoded) return { success: false, error: 'Invalid refresh token' };

      const sessionData = await redis.get(REDIS_KEYS.kitchenSession(decoded.kitchenId));
      if (!sessionData || sessionData.refreshToken !== refreshToken) {
        return { success: false, error: 'Session expired, please login again' };
      }

      const { data: kitchen } = await supabase
        .from('kitchen')
        .select('kitchenId, kitchenName, mobile, isActive')
        .eq('kitchenId', decoded.kitchenId)
        .maybeSingle();

      if (!kitchen || !kitchen.isActive) {
        await redis.del(REDIS_KEYS.kitchenSession(decoded.kitchenId));
        return { success: false, error: 'Account disabled', disabled: true };
      }

      const newAccessToken = kitchenAuthService.generateAccessToken(kitchen.kitchenId);
      await redis.set(REDIS_KEYS.kitchenSession(kitchen.kitchenId), sessionData, ACCESS_EXPIRY_SEC);

      return { success: true, data: { accessToken: newAccessToken } };
    } catch (err) {
      logger.error('Kitchen refresh token error', err.message);
      return { success: false, error: 'Token refresh failed' };
    }
  },

  logout: async (kitchenId) => {
    try {
      await redis.del(REDIS_KEYS.kitchenSession(kitchenId));
      await notificationService.unregisterKitchenToken(kitchenId);
      logger.info(`Kitchen logged out: ${kitchenId}`);
      return { success: true };
    } catch (err) {
      logger.error('Kitchen logout error', err.message);
      return { success: false, error: 'Logout failed' };
    }
  },

  verifySession: async (accessToken) => {
    try {
      const decoded = kitchenAuthService.verifyToken(accessToken);
      if (!decoded) return { valid: false, error: 'Invalid or expired token' };

      const sessionData = await redis.get(REDIS_KEYS.kitchenSession(decoded.kitchenId));
      if (!sessionData) return { valid: false, error: 'Session not found' };

      const { data: kitchen } = await supabase
        .from('kitchen')
        .select('kitchenId, kitchenName, mobile, isActive')
        .eq('kitchenId', decoded.kitchenId)
        .maybeSingle();

      if (!kitchen || !kitchen.isActive) {
        await redis.del(REDIS_KEYS.kitchenSession(decoded.kitchenId));
        return { valid: false, error: 'Account disabled', disabled: true };
      }

      return { valid: true, kitchen };
    } catch (err) {
      logger.error('Kitchen session verification error', err.message);
      return { valid: false, error: 'Session verification failed' };
    }
  },
};