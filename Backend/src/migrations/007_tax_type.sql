-- ============================================================================
-- Migration 007: Add taxType column to restaurant_info table
-- ============================================================================
-- Purpose: Support inclusive and exclusive tax modes.
--   'exclusive' (default): taxes are added ON TOP of dish prices.
--                          finalAmount = subtotal + sum(taxes)
--   'inclusive': taxes are ALREADY EMBEDDED in dish prices.
--                finalAmount = subtotal (displayed as-is)
--                taxBreakdown shows extracted amounts for transparency.
-- Run AFTER migrations 001–006.
-- ============================================================================

ALTER TABLE restaurant_info
  ADD COLUMN IF NOT EXISTS "taxType" VARCHAR(20) DEFAULT 'exclusive';

-- Constraint to ensure only valid values
ALTER TABLE restaurant_info
  DROP CONSTRAINT IF EXISTS chk_taxType;

ALTER TABLE restaurant_info
  ADD CONSTRAINT chk_taxType CHECK ("taxType" IN ('inclusive', 'exclusive'));

-- ============================================================================
-- NOTES
-- ============================================================================
-- Default is 'exclusive' to match existing system behaviour.
-- Manager can change this via the App's Restaurant Info settings screen.
-- ============================================================================
