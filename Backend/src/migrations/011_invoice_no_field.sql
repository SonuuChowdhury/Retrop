-- ============================================================================
-- MIGRATION 011: Add invoiceNo column to orders table
-- ============================================================================
-- Invoice number format: INV + YYYYMMDD + 4-digit dailyOrderNo
-- Example: INV202606200001 (Invoice, June 20 2026, order #1)
-- Generated at order placement time and stored for immutability.
-- ============================================================================

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "invoiceNo" VARCHAR(20);

-- Index for fast lookups by invoice number (e.g., manager search)
CREATE INDEX IF NOT EXISTS idx_orders_invoiceNo ON "orders"("invoiceNo");

-- Backfill existing orders that have both dailyOrderNo and createdAt set
-- This derives YYYYMMDD from createdAt (stored as IST-offset strings)
UPDATE "orders"
SET "invoiceNo" = 'INV' ||
  TO_CHAR(
    (CAST("createdAt" AS TIMESTAMPTZ) AT TIME ZONE 'Asia/Kolkata'),
    'YYYYMMDD'
  ) ||
  LPAD(CAST("dailyOrderNo" AS TEXT), 4, '0')
WHERE "invoiceNo" IS NULL
  AND "dailyOrderNo" IS NOT NULL
  AND "createdAt" IS NOT NULL;
