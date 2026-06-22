import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { JWT_CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { nowIST } from '../utils/time.js';

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================

export const authService = {
  // Hash password using bcrypt
  hashPassword: async (password) => {
    try {
      const salt = await bcrypt.genSalt(10);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      logger.error('Failed to hash password', error.message);
      throw error;
    }
  },

  // Verify password against bcrypt hash
  verifyPassword: async (password, hashedPassword) => {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      logger.error('Failed to verify password', error.message);
      throw error;
    }
  },

  // Generate JWT access token
  generateAccessToken: (adminId, role, restaurantId) => {
    try {
      return jwt.sign({ adminId, role, restaurantId }, JWT_CONFIG.SECRET, {
        expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
      });
    } catch (error) {
      logger.error('Failed to generate access token', error.message);
      throw error;
    }
  },

  // Generate JWT refresh token
  generateRefreshToken: (adminId, restaurantId) => {
    try {
      return jwt.sign({ adminId, restaurantId }, JWT_CONFIG.REFRESH_SECRET, {
        expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
      });
    } catch (error) {
      logger.error('Failed to generate refresh token', error.message);
      throw error;
    }
  },

  // Verify JWT token
  verifyToken: (token, isRefresh = false) => {
    try {
      const secret = isRefresh ? JWT_CONFIG.REFRESH_SECRET : JWT_CONFIG.SECRET;
      return jwt.verify(token, secret);
    } catch (error) {
      logger.debug('Token verification failed', error.message);
      return null;
    }
  },

  // Login admin and create session
  login: async (mobile, password, ipAddress, userAgent, restaurantId) => {
    try {
      const { data: admin, error: adminError } = await supabase
        .from('admin')
        .select('*')
        .eq('mobile', mobile)
        .eq('restaurantId', restaurantId)
        .maybeSingle();

      if (adminError || !admin) {
        await authService.logLoginAttempt(mobile, ipAddress, false, 'user_not_found', restaurantId);
        return { success: false, error: 'Invalid credentials' };
      }

      if (!admin.isActive) {
        await authService.logLoginAttempt(mobile, ipAddress, false, 'user_inactive', restaurantId);
        return { success: false, error: 'Admin account is inactive' };
      }

      const isPasswordValid = await authService.verifyPassword(password, admin.password);
      if (!isPasswordValid) {
        await authService.logLoginAttempt(mobile, ipAddress, false, 'invalid_password', restaurantId);
        return { success: false, error: 'Invalid credentials' };
      }

      // Logout previous sessions
      await authService.logoutAllSessions(admin.adminId);

      const accessToken = authService.generateAccessToken(admin.adminId, admin.role, restaurantId);
      const refreshToken = authService.generateRefreshToken(admin.adminId, restaurantId);

      // IST expiry timestamps
      const accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const refreshTokenExpiresAt = new Date(Date.now() + JWT_CONFIG.REFRESH_TOKEN_EXPIRY_MS);
      const toIST = (d) => new Date(d.getTime() + 5.5 * 60 * 60 * 1000).toISOString().replace('Z', '+05:30');

      const { data: session, error: sessionError } = await supabase
        .from('admin_session')
        .insert([{
          adminId: admin.adminId,
          restaurantId,
          accessToken,
          refreshToken,
          tokenExpiresAt: toIST(accessTokenExpiresAt),
          refreshTokenExpiresAt: toIST(refreshTokenExpiresAt),
          ipAddress,
          userAgent,
          isActive: true,
        }])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Update last login in IST
      await supabase
        .from('admin')
        .update({ lastLogIn: nowIST() })
        .eq('adminId', admin.adminId);

      await authService.logLoginAttempt(mobile, ipAddress, true, null, restaurantId);

      logger.info(`Admin logged in: ${admin.name} (${mobile})`);

      return {
        success: true,
        data: {
          sessionId: session.sessionId,
          accessToken,
          refreshToken,
          admin: {
            adminId: admin.adminId,
            restaurantId: admin.restaurantId,
            name: admin.name,
            mobile: admin.mobile,
            role: admin.role,
            email: admin.email,
          },
          expiresIn: '15m',
        },
      };
    } catch (error) {
      logger.error('Login failed', error.message);
      return { success: false, error: error.message };
    }
  },

  // Refresh access token
  refreshAccessToken: async (refreshToken) => {
    try {
      const decoded = authService.verifyToken(refreshToken, true);
      if (!decoded || !decoded.restaurantId) {
        return { success: false, error: 'Invalid or expired refresh token' };
      }

      const { data: session, error: sessionError } = await supabase
        .from('admin_session')
        .select('*')
        .eq('refreshToken', refreshToken)
        .eq('restaurantId', decoded.restaurantId)
        .eq('isActive', true)
        .single();

      if (sessionError || !session) {
        return { success: false, error: 'Session not found or expired' };
      }

      const { data: admin, error: adminError } = await supabase
        .from('admin')
        .select('*')
        .eq('adminId', decoded.adminId)
        .eq('restaurantId', decoded.restaurantId)
        .single();

      if (adminError || !admin) {
        return { success: false, error: 'Admin not found' };
      }

      const newAccessToken = authService.generateAccessToken(admin.adminId, admin.role, decoded.restaurantId);
      const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const istExpiresAt = new Date(newExpiresAt.getTime() + 5.5 * 60 * 60 * 1000)
        .toISOString()
        .replace('Z', '+05:30');

      const { error: updateError } = await supabase
        .from('admin_session')
        .update({
          accessToken: newAccessToken,
          tokenExpiresAt: istExpiresAt,
          updatedAt: nowIST(),
        })
        .eq('sessionId', session.sessionId);

      if (updateError) throw updateError;

      logger.info(`Access token refreshed for admin: ${admin.name}`);

      return {
        success: true,
        data: { accessToken: newAccessToken, expiresIn: '15m' },
      };
    } catch (error) {
      logger.error('Token refresh failed', error.message);
      return { success: false, error: error.message };
    }
  },

  // Logout admin and invalidate session
  logout: async (accessToken) => {
    try {
      const decoded = authService.verifyToken(accessToken, false);
      if (!decoded) {
        return { success: false, error: 'Invalid token' };
      }

      const { error } = await supabase
        .from('admin_session')
        .update({ isActive: false })
        .eq('accessToken', accessToken)
        .eq('restaurantId', decoded.restaurantId);

      if (error) throw error;

      logger.info(`Admin logged out: ${decoded.adminId}`);
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      logger.error('Logout failed', error.message);
      return { success: false, error: error.message };
    }
  },

  // Logout all sessions for an admin
  logoutAllSessions: async (adminId) => {
    try {
      const { error } = await supabase
        .from('admin_session')
        .update({ isActive: false })
        .eq('adminId', adminId)
        .eq('isActive', true);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      logger.error('Failed to logout all sessions', error.message);
      return { success: false };
    }
  },

  // Log login attempt for rate limiting
  logLoginAttempt: async (mobile, ipAddress, success, failureReason, restaurantId) => {
    try {
      await supabase.from('login_attempt').insert([{
        mobile,
        ipAddress,
        success,
        failureReason,
        restaurantId,
        createdAt: nowIST(),
      }]);
    } catch (error) {
      logger.error('Failed to log login attempt', error.message);
    }
  },

  // Check rate limit on login attempts
  checkLoginRateLimit: async (mobile, ipAddress, restaurantId) => {
    try {
      // 15 minutes ago in IST
      const cutoff = new Date(Date.now() - 15 * 60 * 1000);
      const istCutoff = new Date(cutoff.getTime() + 5.5 * 60 * 60 * 1000)
        .toISOString()
        .replace('Z', '+05:30');

      const { data: attempts, error } = await supabase
        .from('login_attempt')
        .select('*')
        .eq('restaurantId', restaurantId)
        .or(`mobile.eq.${mobile},ipAddress.eq.${ipAddress}`)
        .eq('success', false)
        .gt('createdAt', istCutoff);

      if (error) throw error;

      if (attempts && attempts.length >= 5) {
        return { allowed: false, remainingAttempts: 0 };
      }

      return { allowed: true, remainingAttempts: 5 - (attempts ? attempts.length : 0) };
    } catch (error) {
      logger.error('Rate limit check failed', error.message);
      return { allowed: true }; // fail open
    }
  },

  // Verify session is active
  verifySession: async (accessToken) => {
    try {
      const decoded = authService.verifyToken(accessToken, false);
      if (!decoded || !decoded.restaurantId) {
        return { valid: false, error: 'Invalid token' };
      }

      const { data: session, error } = await supabase
        .from('admin_session')
        .select('*')
        .eq('accessToken', accessToken)
        .eq('restaurantId', decoded.restaurantId)
        .eq('isActive', true)
        .single();

      if (error || !session) {
        return { valid: false, error: 'Session not found or expired' };
      }

      if (new Date(session.tokenExpiresAt) < new Date()) {
        return { valid: false, error: 'Token expired' };
      }

      const { data: admin, error: adminError } = await supabase
        .from('admin')
        .select('*')
        .eq('adminId', decoded.adminId)
        .eq('restaurantId', decoded.restaurantId)
        .single();

      if (adminError || !admin) {
        return { valid: false, error: 'Admin not found' };
      }

      return {
        valid: true,
        admin: {
          adminId: admin.adminId,
          restaurantId: admin.restaurantId,
          name: admin.name,
          mobile: admin.mobile,
          role: admin.role,
          email: admin.email,
        },
      };
    } catch (error) {
      logger.error('Session verification failed', error.message);
      return { valid: false, error: error.message };
    }
  },
};