-- ============================================================================
-- 004_CUSTOM_BILLING.SQL — Custom Billing Parameters for Subscriptions
-- ============================================================================

-- Alter subscription table to store custom billing cycle and grace periods per restaurant
ALTER TABLE subscription ADD COLUMN IF NOT EXISTS "billingCycleDays" INTEGER DEFAULT 28;
ALTER TABLE subscription ADD COLUMN IF NOT EXISTS "gracePeriodDays" INTEGER DEFAULT 10;
