-- ============================================================================
-- Migration 010: Add discount fields to orders table
-- ============================================================================
-- Stores the computed discount amount and breakdown on each order for
-- accurate bill display and analytics.
-- ============================================================================

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "discountBreakdown" JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN "orders"."discountAmount" IS
  'Total discount amount applied to this order (in rupees).';

COMMENT ON COLUMN "orders"."discountBreakdown" IS
  'Array of applied discounts: [{ name, percent, amount }].';
