-- ============================================================================
-- Migration 005: New Tables for Full Order System
-- ============================================================================
-- Run AFTER 001, 002, 003, 004 migrations.
-- Tables: kitchen, kitchen_session, restaurant_info, order additions to orders
-- ============================================================================

-- ============================================================================
-- 1. KITCHEN TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS kitchen (
  "kitchenId"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "kitchenName"   VARCHAR(255) NOT NULL,
  "mobile"        VARCHAR(20) UNIQUE NOT NULL,
  "password"      VARCHAR(255) NOT NULL,
  "isActive"      BOOLEAN DEFAULT true,
  "lastLogIn"     TIMESTAMP WITH TIME ZONE,
  "createdAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kitchen_mobile ON kitchen("mobile");

-- ============================================================================
-- 2. KITCHEN_SESSION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS kitchen_session (
  "sessionId"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "kitchenId"     UUID NOT NULL REFERENCES kitchen("kitchenId") ON DELETE CASCADE,
  "socketId"      VARCHAR(255),
  "ipAddress"     VARCHAR(50),
  "userAgent"     TEXT,
  "isActive"      BOOLEAN DEFAULT true,
  "createdAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kitchen_session_kitchenId ON kitchen_session("kitchenId");
CREATE INDEX IF NOT EXISTS idx_kitchen_session_isActive ON kitchen_session("isActive");

-- ============================================================================
-- 3. RESTAURANT_INFO TABLE
-- ============================================================================
-- Single-row table like restaurant_settings (infoId = 1 always)
CREATE TABLE IF NOT EXISTS restaurant_info (
  "infoId"          INTEGER PRIMARY KEY DEFAULT 1,
  "restaurantName"  VARCHAR(255),
  "address"         TEXT,
  "mobile"          VARCHAR(20),
  "isGST"           BOOLEAN DEFAULT false,
  "GSTIN"           VARCHAR(50),         -- GST Identification Number
  "taxes"           JSONB DEFAULT '[]',  -- [{name: "CGST", percent: 9}, {name: "SGST", percent: 9}]
  "createdAt"       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT restaurant_info_single_row CHECK ("infoId" = 1)
);

-- Seed default row
INSERT INTO restaurant_info ("infoId", "restaurantName")
VALUES (1, 'My Restaurant')
ON CONFLICT ("infoId") DO NOTHING;

-- ============================================================================
-- 4. ALTER ORDERS TABLE — add new fields needed for full flow
-- ============================================================================
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "dailyOrderNo"         INTEGER,
  ADD COLUMN IF NOT EXISTS "orderNumber"           VARCHAR(20),   -- e.g. "#42"
  ADD COLUMN IF NOT EXISTS "finalAmount"           DECIMAL(10,2), -- After taxes
  ADD COLUMN IF NOT EXISTS "taxBreakdown"          JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "gstAmount"             DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "readyAt"               TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "preparationStartedAt"  TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "completedAt"           TIMESTAMP WITH TIME ZONE;

-- Index for daily order number lookups
CREATE INDEX IF NOT EXISTS idx_orders_dailyOrderNo ON "orders"("dailyOrderNo");

-- ============================================================================
-- 5. ALTER WAITER TABLE — add lastLogIn if missing
-- ============================================================================
ALTER TABLE waiter
  ADD COLUMN IF NOT EXISTS "lastLogIn" TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 6. ALTER WAITER_SESSION TABLE — add updatedAt if missing
-- ============================================================================
ALTER TABLE waiter_session
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ============================================================================
-- NOTES FOR DEVELOPERS
-- ============================================================================
-- 1. kitchen table = staff who login to kitchen React Native app
-- 2. restaurant_info is edited by manager in app
-- 3. orders.dailyOrderNo = counter that resets each day (managed by Redis INCR)
-- 4. orders.finalAmount = subtotal + all taxes
-- 5. orders.taxBreakdown = [{name, percent, amount}] snapshot at billing time
-- ============================================================================