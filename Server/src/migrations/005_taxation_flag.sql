-- ============================================================================
-- 005_TAXATION_FLAG.SQL — Dynamic Taxation and GSTIN Toggle
-- ============================================================================

-- Alter retrop_business_config table to store isTaxEnabled flag
ALTER TABLE retrop_business_config ADD COLUMN IF NOT EXISTS "isTaxEnabled" BOOLEAN DEFAULT true;
