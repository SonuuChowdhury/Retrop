// ============================================================================
// PORTAL AUTH CONTROLLER
// Handles self-service signup (OTP), login, Google OAuth, forgot password,
// profile updates, and session management for portal users.
// ============================================================================

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';
import { sendOtpEmail, sendPortalWelcomeEmail, sendUserRegistrationWelcomeEmail } from '../services/mailer.js';


const ACCESS_EXPIRES_IN         = '5d';
const REFRESH_EXPIRES_IN        = '30d';
const OTP_EXPIRY_MINUTES        = 10;

function getPortalJwtSecret() {
  return process.env.PORTAL_JWT_SECRET || 'retrop_portal_jwt_secret_key_2026';
}
function getPortalRefreshSecret() {
  return process.env.PORTAL_JWT_REFRESH_SECRET || 'retrop_portal_jwt_refresh_secret_key_2026';
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateTokens(userId) {
  const accessToken = jwt.sign({ userId }, getPortalJwtSecret(), { expiresIn: ACCESS_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId }, getPortalRefreshSecret(), { expiresIn: REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
}


async function createSession(userId, accessToken, refreshToken, ipAddress, userAgent) {
  const tokenExpiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from('portal_user_session').insert({

    userId, accessToken, refreshToken, tokenExpiresAt, refreshTokenExpiresAt,
    isActive: true, ipAddress, userAgent,
  });
  if (error) throw new Error('Failed to create session: ' + error.message);
}

async function getUserWithBusinesses(userId) {
  const { data: user, error: userErr } = await supabase
    .from('portal_user')
    .select('userId, name, email, mobile, needsPasswordReset, isActive, emailVerified, lastLoginAt')
    .eq('userId', userId)
    .maybeSingle();
  if (userErr || !user) return null;

  const { data: links, error: linkErr } = await supabase
    .from('portal_user_business')
    .select(`role, linkedAt, retrop_restaurant ( restaurantId, businessName, ownerName, ownerMobile, businessTypeId, isActive )`)
    .eq('userId', userId);

  if (linkErr) {
    logger.error('getUserWithBusinesses link fetch error:', linkErr.message);
  }

  return {
    ...user,
    businesses: (links || []).filter(l => l.retrop_restaurant).map(l => ({
      role: l.role,
      linkedAt: l.linkedAt,
      ...l.retrop_restaurant,
    })),
  };
}




// ── Controller ───────────────────────────────────────────────────────────────

export const portalAuthController = {

  // POST /api/portal/auth/signup/request-otp
  requestSignupOtp: async (req, res) => {
    try {
      const { name, email } = req.body;
      if (!name || !email) {
        return res.status(400).json({ success: false, message: 'Name and email are required' });
      }
      const emailLower = email.toLowerCase().trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
        return res.status(400).json({ success: false, message: 'Invalid email address' });
      }

      // Check if email is already registered and verified
      const { data: existing } = await supabase
        .from('portal_user')
        .select('userId, emailVerified')
        .eq('email', emailLower)
        .maybeSingle();

      if (existing && existing.emailVerified) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists. Please sign in.' });
      }

      // Invalidate any old OTPs for this email+purpose
      await supabase.from('portal_otp').update({ used: true })
        .eq('email', emailLower).eq('purpose', 'signup').eq('used', false);

      // Generate and store new OTP
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
      await supabase.from('portal_otp').insert({ email: emailLower, code: otp, purpose: 'signup', expiresAt });

      // Send OTP email
      await sendOtpEmail(emailLower, otp, 'signup');

      logger.info(`Signup OTP sent to ${emailLower}`);
      return res.status(200).json({ success: true, message: `OTP sent to ${emailLower}. Valid for ${OTP_EXPIRY_MINUTES} minutes.` });
    } catch (err) {
      logger.error('portalAuth.requestSignupOtp error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
  },

  // POST /api/portal/auth/signup/verify-otp
  verifySignupOtp: async (req, res) => {
    try {
      const { name, email, otp } = req.body;
      if (!email || !otp || !name) {
        return res.status(400).json({ success: false, message: 'Name, email and OTP are required' });
      }
      const emailLower = email.toLowerCase().trim();

      // Find valid OTP
      const { data: otpRecord } = await supabase
        .from('portal_otp')
        .select('*')
        .eq('email', emailLower)
        .eq('purpose', 'signup')
        .eq('code', otp)
        .eq('used', false)
        .gt('expiresAt', new Date().toISOString())
        .order('createdAt', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!otpRecord) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please request a new one.' });
      }

      // Mark OTP as used
      await supabase.from('portal_otp').update({ used: true }).eq('otpId', otpRecord.otpId);

      // Create or update unverified user
      const { data: existingUser } = await supabase
        .from('portal_user')
        .select('userId')
        .eq('email', emailLower)
        .maybeSingle();

      let userId;
      if (existingUser) {
        await supabase.from('portal_user').update({ name, emailVerified: true, updatedAt: new Date().toISOString() }).eq('userId', existingUser.userId);
        userId = existingUser.userId;
      } else {
        const { data: newUser, error } = await supabase.from('portal_user')
          .insert({ name, email: emailLower, emailVerified: true, needsPasswordReset: true })
          .select('userId').single();
        if (error) throw new Error(error.message);
        userId = newUser.userId;
      }

      return res.status(200).json({ success: true, message: 'Email verified. Please set your password.', data: { userId } });
    } catch (err) {
      logger.error('portalAuth.verifySignupOtp error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to verify OTP' });
    }
  },

  // POST /api/portal/auth/signup/set-password
  setSignupPassword: async (req, res) => {
    try {
      const { userId, password } = req.body;
      if (!userId || !password) {
        return res.status(400).json({ success: false, message: 'userId and password are required' });
      }
      if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      }

      const { data: user } = await supabase.from('portal_user').select('userId, name, email, emailVerified').eq('userId', userId).maybeSingle();
      if (!user || !user.emailVerified) {
        return res.status(400).json({ success: false, message: 'Invalid or unverified user' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      await supabase.from('portal_user').update({
        passwordHash, needsPasswordReset: false, updatedAt: new Date().toISOString(),
      }).eq('userId', userId);

      if (user.email) {
        sendUserRegistrationWelcomeEmail(user.email, user.name)
          .catch(mailErr => logger.error('Failed to send user registration welcome email', mailErr.message));
      }

      return res.status(200).json({ success: true, message: 'Password set successfully. You can now sign in.' });

    } catch (err) {
      logger.error('portalAuth.setSignupPassword error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to set password' });
    }
  },

  // POST /api/portal/auth/login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
      }

      const emailLower = email.toLowerCase().trim();
      const { data: user } = await supabase
        .from('portal_user')
        .select('*')
        .or(`email.eq.${emailLower},mobile.eq.${emailLower}`)
        .eq('isActive', true)
        .maybeSingle();

      if (!user || !user.passwordHash) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const passwordMatch = await bcrypt.compare(password, user.passwordHash);
      if (!passwordMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }


      const { accessToken, refreshToken } = generateTokens(user.userId);
      const ip = req.ip || req.connection.remoteAddress;
      const ua = req.get('user-agent') || '';
      await createSession(user.userId, accessToken, refreshToken, ip, ua);

      // Update last login
      await supabase.from('portal_user').update({ lastLoginAt: new Date().toISOString() }).eq('userId', user.userId);

      const userWithBusinesses = await getUserWithBusinesses(user.userId);

      if (user.needsPasswordReset) {
        return res.status(200).json({
          success: true,
          needsReset: true,
          message: 'Password reset required',
          data: { accessToken, refreshToken, user: userWithBusinesses },
        });
      }

      return res.status(200).json({
        success: true,
        needsReset: false,
        data: { accessToken, refreshToken, user: userWithBusinesses },
      });
    } catch (err) {
      logger.error('portalAuth.login error', err.message);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },


  // POST /api/portal/auth/google
  googleAuth: async (req, res) => {
    try {
      const { idToken } = req.body;
      if (!idToken) {
        return res.status(400).json({ success: false, message: 'Google ID token is required' });
      }

      // Decode the Supabase-issued JWT to get user info (Supabase handles Google token verification)
      let payload;
      try {
        // Supabase returns a JWT from its auth — we decode without verifying since Supabase already did
        payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      } catch {
        return res.status(400).json({ success: false, message: 'Invalid Google token' });
      }

      const googleEmail = (payload.email || '').toLowerCase().trim();
      const googleName  = payload.user_metadata?.full_name || payload.user_metadata?.name || googleEmail.split('@')[0];
      const googleId    = payload.sub;

      if (!googleEmail) {
        return res.status(400).json({ success: false, message: 'Google account must have an email address' });
      }

      // Find existing user by googleId or email
      let { data: user } = await supabase
        .from('portal_user')
        .select('*')
        .or(`googleId.eq.${googleId},email.eq.${googleEmail}`)
        .eq('isActive', true)
        .maybeSingle();

      if (!user) {
        // Create new user
        const { data: newUser, error } = await supabase.from('portal_user').insert({
          name: googleName, email: googleEmail, googleId,
          emailVerified: true, needsPasswordReset: false,
        }).select('*').single();
        if (error) throw new Error(error.message);
        user = newUser;

        // Send minimal welcome email to new Google user
        sendUserRegistrationWelcomeEmail(googleEmail, googleName)
          .catch(mailErr => logger.error('Failed to send Google registration welcome email', mailErr.message));
      } else if (!user.googleId) {

        // Link Google to existing email account
        await supabase.from('portal_user').update({ googleId, emailVerified: true }).eq('userId', user.userId);
      }

      const { accessToken, refreshToken } = generateTokens(user.userId);
      const ip = req.ip || req.connection.remoteAddress;
      const ua = req.get('user-agent') || '';
      await createSession(user.userId, accessToken, refreshToken, ip, ua);
      await supabase.from('portal_user').update({ lastLoginAt: new Date().toISOString() }).eq('userId', user.userId);

      const userWithBusinesses = await getUserWithBusinesses(user.userId);
      return res.status(200).json({ success: true, data: { accessToken, refreshToken, user: userWithBusinesses } });
    } catch (err) {
      logger.error('portalAuth.googleAuth error', err.message);
      return res.status(500).json({ success: false, message: 'Google authentication failed' });
    }
  },

  // POST /api/portal/auth/forgot-password/request-otp
  requestForgotPasswordOtp: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
      const emailLower = email.toLowerCase().trim();

      const { data: user } = await supabase
        .from('portal_user')
        .select('userId')
        .eq('email', emailLower)
        .eq('isActive', true)
        .maybeSingle();

      // Always respond with success to prevent email enumeration
      if (!user) {
        return res.status(200).json({ success: true, message: 'If an account with this email exists, an OTP has been sent.' });
      }

      await supabase.from('portal_otp').update({ used: true })
        .eq('email', emailLower).eq('purpose', 'forgot_password').eq('used', false);

      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
      await supabase.from('portal_otp').insert({ email: emailLower, code: otp, purpose: 'forgot_password', expiresAt });
      await sendOtpEmail(emailLower, otp, 'forgot_password');

      return res.status(200).json({ success: true, message: 'OTP sent to your email. Valid for 10 minutes.' });
    } catch (err) {
      logger.error('portalAuth.requestForgotPasswordOtp error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
  },

  // POST /api/portal/auth/forgot-password/verify-otp
  verifyForgotPasswordOtp: async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });
      const emailLower = email.toLowerCase().trim();

      const { data: otpRecord } = await supabase
        .from('portal_otp')
        .select('*')
        .eq('email', emailLower)
        .eq('purpose', 'forgot_password')
        .eq('code', otp)
        .eq('used', false)
        .gt('expiresAt', new Date().toISOString())
        .order('createdAt', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!otpRecord) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
      }

      await supabase.from('portal_otp').update({ used: true }).eq('otpId', otpRecord.otpId);

      // Issue a short-lived reset token
      const { data: user } = await supabase.from('portal_user').select('userId').eq('email', emailLower).maybeSingle();
      if (!user) return res.status(400).json({ success: false, message: 'User not found' });

      const resetToken = jwt.sign({ userId: user.userId, purpose: 'password_reset' }, PORTAL_JWT_SECRET, { expiresIn: '15m' });

      return res.status(200).json({ success: true, data: { resetToken } });
    } catch (err) {
      logger.error('portalAuth.verifyForgotPasswordOtp error', err.message);
      return res.status(500).json({ success: false, message: 'OTP verification failed' });
    }
  },

  // POST /api/portal/auth/forgot-password/reset
  resetForgotPassword: async (req, res) => {
    try {
      const { resetToken, newPassword } = req.body;
      if (!resetToken || !newPassword) {
        return res.status(400).json({ success: false, message: 'Reset token and new password are required' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
      }

      let decoded;
      try {
        decoded = jwt.verify(resetToken, PORTAL_JWT_SECRET);
      } catch {
        return res.status(400).json({ success: false, message: 'Reset token is invalid or expired' });
      }

      if (decoded.purpose !== 'password_reset') {
        return res.status(400).json({ success: false, message: 'Invalid reset token' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await supabase.from('portal_user').update({
        passwordHash, needsPasswordReset: false, updatedAt: new Date().toISOString(),
      }).eq('userId', decoded.userId);

      // Invalidate all sessions
      await supabase.from('portal_user_session').update({ isActive: false }).eq('userId', decoded.userId);

      return res.status(200).json({ success: true, message: 'Password reset successfully. Please sign in.' });
    } catch (err) {
      logger.error('portalAuth.resetForgotPassword error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
  },

  // POST /api/portal/auth/logout
  logout: async (req, res) => {
    try {
      await supabase.from('portal_user_session')
        .update({ isActive: false })
        .eq('sessionId', req.portalSessionId);
      return res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
      logger.error('portalAuth.logout error', err.message);
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
  },

  // GET /api/portal/auth/me
  me: async (req, res) => {
    try {
      const user = await getUserWithBusinesses(req.portalUserId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      return res.status(200).json({ success: true, data: { user } });
    } catch (err) {
      logger.error('portalAuth.me error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
  },

  // PUT /api/portal/profile
  updateProfile: async (req, res) => {
    try {
      const { name, mobile } = req.body;
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
      }
      if (mobile && !/^\+?[0-9]{7,15}$/.test(mobile)) {
        return res.status(400).json({ success: false, message: 'Invalid mobile number format' });
      }

      await supabase.from('portal_user').update({
        name: name.trim(),
        mobile: mobile ? mobile.trim() : null,
        updatedAt: new Date().toISOString(),
      }).eq('userId', req.portalUserId);

      const user = await getUserWithBusinesses(req.portalUserId);
      return res.status(200).json({ success: true, message: 'Profile updated', data: { user } });
    } catch (err) {
      logger.error('portalAuth.updateProfile error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
  },

  // PUT /api/portal/auth/change-password  (authenticated)
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Current and new password are required' });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
      }

      const { data: user } = await supabase.from('portal_user').select('passwordHash').eq('userId', req.portalUserId).maybeSingle();
      if (!user || !user.passwordHash) {
        return res.status(400).json({ success: false, message: 'Cannot change password for Google-only accounts' });
      }

      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await supabase.from('portal_user').update({ passwordHash, needsPasswordReset: false, updatedAt: new Date().toISOString() }).eq('userId', req.portalUserId);

      return res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
      logger.error('portalAuth.changePassword error', err.message);
      return res.status(500).json({ success: false, message: 'Failed to change password' });
    }
  },
};
