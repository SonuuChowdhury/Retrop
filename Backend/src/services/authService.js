import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { JWT_CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// AUTHENTICATION SERVICE
// ============================================================================
// Handles admin authentication, session management, JWT tokens

export const authService = {
  // Hash password using bcrypt
  hashPassword: async (password) => {
    try {
      const salt = await bcrypt.genSalt(10); // 10 rounds
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      logger.error('Failed to hash password', error.message);
      throw error;
    }
  },

  // Verify password against bcrypt hash
  verifyPassword: async (password, hashedPassword) => {
    try {
      const isMatch = await bcrypt.compare(password, hashedPassword);
      return isMatch;
    } catch (error) {
      logger.error('Failed to verify password', error.message);
      throw error;
    }
  },

  // Generate JWT access token
  generateAccessToken: (adminId, role) => {
    try {
      const token = jwt.sign(
        { adminId, role },
        JWT_CONFIG.SECRET,
        { expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY }
      );
      return token;
    } catch (error) {
      logger.error('Failed to generate access token', error.message);
      throw error;
    }
  },

  // Generate JWT refresh token
  generateRefreshToken: (adminId) => {
    try {
      const token = jwt.sign(
        { adminId },
        JWT_CONFIG.REFRESH_SECRET,
        { expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY }
      );
      return token;
    } catch (error) {
      logger.error('Failed to generate refresh token', error.message);
      throw error;
    }
  },

  // Verify JWT token
  verifyToken: (token, isRefresh = false) => {
    try {
      const secret = isRefresh ? JWT_CONFIG.REFRESH_SECRET : JWT_CONFIG.SECRET;
      const decoded = jwt.verify(token, secret);
      return decoded;
    } catch (error) {
      logger.debug('Token verification failed', error.message);
      return null;
    }
  },

  // Login admin and create session
  login: async (mobile, password, ipAddress, userAgent) => {
    try {
      // Check if admin exists
      const { data: admin, error: adminError } = await supabase
        .from('admin')
        .select('*')
        .eq('mobile', mobile)
        .maybeSingle(); 

      if (adminError || !admin) {
        // Log failed attempt
        await authService.logLoginAttempt(mobile, ipAddress, false, 'user_not_found');
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if admin is active
      if (!admin.isActive) {
        await authService.logLoginAttempt(mobile, ipAddress, false, 'user_inactive');
        return { success: false, error: 'Admin account is inactive' };
      }

      // Verify password
      const isPasswordValid = await authService.verifyPassword(password, admin.password);
      if (!isPasswordValid) {
        await authService.logLoginAttempt(mobile, ipAddress, false, 'invalid_password');
        return { success: false, error: 'Invalid credentials' };
      }

      // Logout previous sessions (prevent double login)
      await authService.logoutAllSessions(admin.adminId);

      // Generate tokens
      const accessToken = authService.generateAccessToken(admin.adminId, admin.role);
      const refreshToken = authService.generateRefreshToken(admin.adminId);

      // Calculate token expiry times
      const accessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      const refreshTokenExpiresAt = new Date(Date.now() + JWT_CONFIG.REFRESH_TOKEN_EXPIRY_MS);

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('admin_session')
        .insert([
          {
            adminId: admin.adminId,
            accessToken,
            refreshToken,
            tokenExpiresAt: accessTokenExpiresAt.toISOString(),
            refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
            ipAddress,
            userAgent,
            isActive: true,
          },
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Update last login timestamp
      await supabase
        .from('admin')
        .update({ lastLogIn: new Date().toISOString() })
        .eq('adminId', admin.adminId);

      // Log successful attempt
      await authService.logLoginAttempt(mobile, ipAddress, true, null);

      logger.info(`Admin logged in: ${admin.name} (${mobile})`);

      return {
        success: true,
        data: {
          sessionId: session.sessionId,
          accessToken,
          refreshToken,
          admin: {
            adminId: admin.adminId,
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
      // Verify refresh token
      const decoded = authService.verifyToken(refreshToken, true);
      if (!decoded) {
        return { success: false, error: 'Invalid or expired refresh token' };
      }

      // Check if session exists and is active
      const { data: session, error: sessionError } = await supabase
        .from('admin_session')
        .select('*')
        .eq('refreshToken', refreshToken)
        .eq('isActive', true)
        .single();

      if (sessionError || !session) {
        return { success: false, error: 'Session not found or expired' };
      }

      // Get admin details
      const { data: admin, error: adminError } = await supabase
        .from('admin')
        .select('*')
        .eq('adminId', decoded.adminId)
        .single();

      if (adminError || !admin) {
        return { success: false, error: 'Admin not found' };
      }

      // Generate new access token
      const newAccessToken = authService.generateAccessToken(admin.adminId, admin.role);
      const newAccessTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Update session with new access token
      const { error: updateError } = await supabase
        .from('admin_session')
        .update({
          accessToken: newAccessToken,
          tokenExpiresAt: newAccessTokenExpiresAt.toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .eq('sessionId', session.sessionId);

      if (updateError) throw updateError;

      logger.info(`Access token refreshed for admin: ${admin.name}`);

      return {
        success: true,
        data: {
          accessToken: newAccessToken,
          expiresIn: '15m',
        },
      };
    } catch (error) {
      logger.error('Token refresh failed', error.message);
      return { success: false, error: error.message };
    }
  },

  // Logout admin and invalidate session
  logout: async (accessToken) => {
    try {
      // Verify token to get admin details
      const decoded = authService.verifyToken(accessToken, false);
      if (!decoded) {
        return { success: false, error: 'Invalid token' };
      }

      // Invalidate session
      const { error } = await supabase
        .from('admin_session')
        .update({ isActive: false })
        .eq('accessToken', accessToken);

      if (error) throw error;

      logger.info(`Admin logged out: ${decoded.adminId}`);

      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      logger.error('Logout failed', error.message);
      return { success: false, error: error.message };
    }
  },

  // Logout all sessions for an admin (prevent double login)
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

  // Log login attempt for rate limiting and security
  logLoginAttempt: async (mobile, ipAddress, success, failureReason) => {
    try {
      await supabase.from('login_attempt').insert([
        {
          mobile,
          ipAddress,
          success,
          failureReason,
        },
      ]);
    } catch (error) {
      logger.error('Failed to log login attempt', error.message);
    }
  },

  // Check rate limit on login attempts
  checkLoginRateLimit: async (mobile, ipAddress) => {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

      // Get failed attempts in last 15 minutes
      const { data: attempts, error } = await supabase
        .from('login_attempt')
        .select('*', { count: 'exact' })
        .or(`mobile.eq.${mobile},ipAddress.eq.${ipAddress}`)
        .eq('success', false)
        .gt('createdAt', fifteenMinutesAgo);

      if (error) throw error;

      // Allow max 5 failed attempts
      if (attempts && attempts.length >= 5) {
        return { allowed: false, remainingAttempts: 0 };
      }

      return { allowed: true, remainingAttempts: 5 - (attempts ? attempts.length : 0) };
    } catch (error) {
      logger.error('Rate limit check failed', error.message);
      return { allowed: true }; // Fail open for security
    }
  },

  // Verify session is active
  verifySession: async (accessToken) => {
    try {
      // Verify JWT signature
      const decoded = authService.verifyToken(accessToken, false);
      if (!decoded) {
        return { valid: false, error: 'Invalid token' };
      }

      // Check if session exists and is active
      const { data: session, error } = await supabase
        .from('admin_session')
        .select('*')
        .eq('accessToken', accessToken)
        .eq('isActive', true)
        .single();

      if (error || !session) {
        return { valid: false, error: 'Session not found or expired' };
      }

      // Check if token has expired
      if (new Date(session.tokenExpiresAt) < new Date()) {
        return { valid: false, error: 'Token expired' };
      }

      // Get admin details
      const { data: admin, error: adminError } = await supabase
        .from('admin')
        .select('*')
        .eq('adminId', decoded.adminId)
        .single();

      if (adminError || !admin) {
        return { valid: false, error: 'Admin not found' };
      }

      return {
        valid: true,
        admin: {
          adminId: admin.adminId,
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
