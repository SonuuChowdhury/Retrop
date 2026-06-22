-- ============================================================================
-- MIGRATION 012: Add cancellationReason column to orders table
-- ============================================================================

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;
