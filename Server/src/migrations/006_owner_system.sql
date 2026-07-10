-- Migration 006_owner_system.sql
-- Create Owner entity and Owner Session tables to support the new Owner Portal.

-- 1. Create retrop_owner table
CREATE TABLE IF NOT EXISTS retrop_owner (
  "ownerId"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"               VARCHAR(255) NOT NULL,
  "email"              VARCHAR(255) UNIQUE NOT NULL,
  "mobile"             VARCHAR(20) UNIQUE NOT NULL,
  "password"           VARCHAR(255) NOT NULL,
  "needsPasswordReset" BOOLEAN DEFAULT true, -- default true for new accounts
  "isActive"           BOOLEAN DEFAULT true,
  "lastLogIn"          TIMESTAMP WITH TIME ZONE,
  "createdAt"          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"          TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on owner mobile/email
CREATE INDEX IF NOT EXISTS idx_retrop_owner_email ON retrop_owner("email");
CREATE INDEX IF NOT EXISTS idx_retrop_owner_mobile ON retrop_owner("mobile");

-- 2. Create retrop_owner_session table
CREATE TABLE IF NOT EXISTS retrop_owner_session (
  "sessionId"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ownerId"                UUID NOT NULL REFERENCES retrop_owner("ownerId") ON DELETE CASCADE,
  "accessToken"            VARCHAR(500) NOT NULL,
  "refreshToken"           VARCHAR(500),
  "tokenExpiresAt"         TIMESTAMP WITH TIME ZONE NOT NULL,
  "refreshTokenExpiresAt"  TIMESTAMP WITH TIME ZONE,
  "ipAddress"              VARCHAR(50),
  "userAgent"              TEXT,
  "isActive"               BOOLEAN DEFAULT true,
  "createdAt"              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"              TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_owner_session_ownerId ON retrop_owner_session("ownerId");
CREATE INDEX IF NOT EXISTS idx_owner_session_isActive ON retrop_owner_session("isActive");

-- 3. Add ownerId foreign key column to retrop_restaurant
ALTER TABLE retrop_restaurant ADD COLUMN IF NOT EXISTS "ownerId" UUID REFERENCES retrop_owner("ownerId") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_retrop_restaurant_ownerId ON retrop_restaurant("ownerId");
