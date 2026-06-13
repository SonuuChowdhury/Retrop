-- ============================================================================
-- Migration 006: Add customer token fields to orders table
-- ============================================================================
-- Purpose: Allow customers to re-scan QR code and resume their order
--          session by validating a short-lived customerToken.
-- Run AFTER migrations 001–005.
-- ============================================================================

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "customerToken"    VARCHAR(64),
  ADD COLUMN IF NOT EXISTS "tokenValidUntil"  TIMESTAMP WITH TIME ZONE;

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_orders_customerToken ON "orders"("customerToken");

-- ============================================================================
-- NOTES
-- ============================================================================
-- customerToken: set when waiter accepts the order (in Redis session).
--                Stored in DB when order is placed.
-- tokenValidUntil: acceptedAt + 5 hours.
--                  Customer can re-scan QR and resume their order view
--                  as long as this timestamp has not passed.
-- ============================================================================
