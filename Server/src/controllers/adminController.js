import { authService } from '../services/authService.js';
import { logger } from '../utils/logger.js';

// ============================================================================
// ADMIN AUTHENTICATION CONTROLLER
// ============================================================================

export const adminLogin = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    // Validate input
    if (!mobile || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Mobile and password are required',
      });
    }

    // Get client IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || '';

    // Check rate limit
    const rateLimit = await authService.checkLoginRateLimit(mobile, ipAddress, req.restaurantId);
    if (!rateLimit.allowed) {
      logger.warn(`Rate limit exceeded for mobile: ${mobile}, IP: ${ipAddress}`);
      return res.status(429).json({
        status: 'error',
        message: 'Too many login attempts. Please try again later.',
      });
    }

    // Perform login
    const loginResult = await authService.login(mobile, password, ipAddress, userAgent, req.restaurantId);
    if (!loginResult.success) {
      return res.status(401).json({
        status: 'error',
        message: loginResult.error,
      });
    }

    // Return tokens and admin info
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: loginResult.data,
    });
  } catch (error) {
    logger.error('Admin login error', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Login failed',
    });
  }
};

// ============================================================================
// REFRESH TOKEN ENDPOINT
// ============================================================================
// Issues new access token using refresh token

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'Refresh token is required',
      });
    }

    // Refresh access token
    const refreshResult = await authService.refreshAccessToken(token);
    if (!refreshResult.success) {
      return res.status(401).json({
        status: 'error',
        message: refreshResult.error,
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: refreshResult.data,
    });
  } catch (error) {
    logger.error('Token refresh error', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Token refresh failed',
    });
  }
};

// ============================================================================
// LOGOUT ENDPOINT
// ============================================================================
// Invalidates current session

export const adminLogout = async (req, res) => {
  try {
    const accessToken = req.accessToken;

    if (!accessToken) {
      return res.status(400).json({
        status: 'error',
        message: 'No active session',
      });
    }

    // Logout admin
    const logoutResult = await authService.logout(accessToken);
    if (!logoutResult.success) {
      return res.status(400).json({
        status: 'error',
        message: logoutResult.error,
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Admin logout error', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Logout failed',
    });
  }
};

// ============================================================================
// GET CURRENT ADMIN PROFILE
// ============================================================================
// Returns current authenticated admin's information

export const getCurrentAdmin = async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated',
      });
    }

    res.status(200).json({
      status: 'success',
      data: req.admin,
    });
  } catch (error) {
    logger.error('Get current admin error', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get admin profile',
    });
  }
};
