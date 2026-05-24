-- ============================================================================
-- Admin Authentication Table & Session Management
-- ============================================================================

-- ============================================================================
-- 1. ADMIN TABLE
-- ============================================================================
-- Stores admin credentials with bcrypt hashed passwords
-- Roles: owner, manager
-- Primary Key: adminId (UUID)

CREATE TABLE IF NOT EXISTS admin (
  "adminId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "mobile" VARCHAR(20) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL, -- bcrypt hashed password
  "name" VARCHAR(255) NOT NULL,
  "role" VARCHAR(50) NOT NULL, -- Values: 'owner', 'manager'
  "email" VARCHAR(255),
  "isActive" BOOLEAN DEFAULT true,
  "lastLogIn" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on mobile for faster login lookups
CREATE INDEX IF NOT EXISTS idx_admin_mobile ON admin("mobile");
CREATE INDEX IF NOT EXISTS idx_admin_role ON admin("role");

-- ============================================================================
-- 2. ADMIN_SESSION TABLE
-- ============================================================================
-- Tracks active sessions for each admin
-- Prevents double login and manages session lifecycle
-- Primary Key: sessionId (UUID)

CREATE TABLE IF NOT EXISTS admin_session (
  "sessionId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "adminId" UUID NOT NULL REFERENCES admin("adminId") ON DELETE CASCADE,
  "accessToken" VARCHAR(500) NOT NULL, -- JWT token
  "refreshToken" VARCHAR(500), -- Refresh token for renewal
  "tokenExpiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "refreshTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
  "ipAddress" VARCHAR(50), -- Client IP address for security
  "userAgent" TEXT, -- Browser/device info
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for session lookups
CREATE INDEX IF NOT EXISTS idx_admin_session_adminId ON admin_session("adminId");
CREATE INDEX IF NOT EXISTS idx_admin_session_accessToken ON admin_session("accessToken");
CREATE INDEX IF NOT EXISTS idx_admin_session_isActive ON admin_session("isActive");

-- ============================================================================
-- 3. LOGIN_ATTEMPT TABLE
-- ============================================================================
-- Tracks login attempts for rate limiting and security
-- Helps detect brute force attacks
-- Primary Key: attemptId (UUID)

CREATE TABLE IF NOT EXISTS login_attempt (
  "attemptId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "mobile" VARCHAR(20) NOT NULL,
  "ipAddress" VARCHAR(50),
  "success" BOOLEAN NOT NULL,
  "failureReason" VARCHAR(255), -- e.g., 'invalid_password', 'user_not_found'
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for rate limiting checks
CREATE INDEX IF NOT EXISTS idx_login_attempt_mobile ON login_attempt("mobile", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempt_ip ON login_attempt("ipAddress", "createdAt" DESC);

-- ============================================================================
-- NOTES FOR DEVELOPERS
-- ============================================================================
-- 1. password field stores bcrypt hashed values only
-- 2. accessToken is the JWT for API requests
-- 3. refreshToken is used to get new accessToken when expired
-- 4. isActive flag in session allows logout without deleting record
-- 5. login_attempt table helps implement rate limiting
-- 6. ipAddress and userAgent help track suspicious login patterns
-- 7. Session is created on successful login
-- 8. Only one active session per admin at a time (enforce at app level)
-- ============================================================================