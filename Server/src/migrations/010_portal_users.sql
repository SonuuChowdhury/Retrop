-- Migration 010_portal_users.sql
-- Creates the Portal User system — separate from the RMS owner/admin system.
-- Users sign up via email+OTP and can be linked to multiple businesses.

-- 1. Portal Users table
CREATE TABLE IF NOT EXISTS portal_user (
  "userId"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"                VARCHAR(255) NOT NULL,
  "email"               VARCHAR(255) UNIQUE NOT NULL,
  "mobile"              VARCHAR(20),
  "passwordHash"        VARCHAR(255),                                    -- null until first login reset
  "googleId"            TEXT UNIQUE,                                     -- populated if user uses Google login
  "needsPasswordReset"  BOOLEAN DEFAULT true,
  "isActive"            BOOLEAN DEFAULT true,
  "emailVerified"       BOOLEAN DEFAULT false,
  "lastLoginAt"         TIMESTAMP WITH TIME ZONE,
  "createdAt"           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portal_user_email    ON portal_user("email");
CREATE INDEX IF NOT EXISTS idx_portal_user_googleId ON portal_user("googleId");

-- 2. OTP table — for email verification (signup) and password reset
CREATE TABLE IF NOT EXISTS portal_otp (
  "otpId"      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"      VARCHAR(255) NOT NULL,
  "code"       VARCHAR(6) NOT NULL,
  "purpose"    VARCHAR(20) NOT NULL CHECK (purpose IN ('signup', 'forgot_password')),
  "expiresAt"  TIMESTAMP WITH TIME ZONE NOT NULL,
  "used"       BOOLEAN DEFAULT false,
  "createdAt"  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portal_otp_email ON portal_otp("email");

-- 3. Portal User Sessions
CREATE TABLE IF NOT EXISTS portal_user_session (
  "sessionId"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"                UUID NOT NULL REFERENCES portal_user("userId") ON DELETE CASCADE,
  "accessToken"           TEXT NOT NULL,
  "refreshToken"          TEXT,
  "tokenExpiresAt"        TIMESTAMP WITH TIME ZONE NOT NULL,
  "refreshTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "isActive"              BOOLEAN DEFAULT true,
  "ipAddress"             VARCHAR(50),
  "userAgent"             TEXT,
  "createdAt"             TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portal_session_userId   ON portal_user_session("userId");
CREATE INDEX IF NOT EXISTS idx_portal_session_isActive ON portal_user_session("isActive");

-- 4. User ↔ Business mapping table
CREATE TABLE IF NOT EXISTS portal_user_business (
  "userId"        UUID NOT NULL REFERENCES portal_user("userId") ON DELETE CASCADE,
  "restaurantId"  UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "role"          VARCHAR(20) DEFAULT 'owner',
  "linkedAt"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("userId", "restaurantId")
);

CREATE INDEX IF NOT EXISTS idx_portal_user_business_userId ON portal_user_business("userId");

