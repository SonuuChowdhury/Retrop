-- ============================================================================
-- Migration 009: Add discounts JSONB column to restaurant_info
-- ============================================================================
-- Allows manager to configure named discounts (with percentage) that are
-- applied to orders at bill conclusion time.
-- Structure: [{ name: string, percent: number, isActive: boolean }]
-- ============================================================================

ALTER TABLE "restaurant_info"
  ADD COLUMN IF NOT EXISTS "discounts" JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN "restaurant_info"."discounts" IS
  'Array of named discounts: [{ name, percent, isActive }]. 
   Active discounts are applied to the subtotal before tax calculation.';
