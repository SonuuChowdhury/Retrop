-- ============================================================================
-- Migration 008: Add lockedItems column to orders table
-- ============================================================================
-- lockedItems stores a snapshot of ordersInfo at the point the order becomes
-- "ready". Once items are locked, customers cannot remove them from the order,
-- preventing malpractice (ordering, consuming, then removing before payment).
-- ============================================================================

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "lockedItems" JSONB DEFAULT '[]'::jsonb;

-- Index is not needed here since this is rarely queried independently
-- It will be accessed via the full order row lookup.

COMMENT ON COLUMN "orders"."lockedItems" IS
  'Snapshot of ordersInfo items locked when order status reaches ''ready''. 
   Customer cannot remove these items, ensuring served dishes are always billed.';
