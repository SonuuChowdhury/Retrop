-- ============================================================================
-- Restaurant Settings Table
-- ============================================================================
-- Stores global restaurant configuration as a single-row settings table.
-- Run this in Supabase SQL Editor after running 001, 002, and 003 migrations.

-- ============================================================================
-- 1. RESTAURANT_SETTINGS TABLE
-- ============================================================================
-- Single-row table (enforced by the check constraint on settingsId = 1).
-- isRestaurantOpen: controls whether the restaurant is open for business.
--   - false (default): restaurant is closed, all waiters go inactive.
--   - true: restaurant is open, waiters can be active.

CREATE TABLE IF NOT EXISTS restaurant_settings (
  "settingsId"        INTEGER PRIMARY KEY DEFAULT 1,
  "isRestaurantOpen"  BOOLEAN NOT NULL DEFAULT false,
  "updatedAt"         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedBy"         UUID REFERENCES admin("adminId") ON DELETE SET NULL,

  -- Enforce single-row: only settingsId = 1 is ever allowed
  CONSTRAINT restaurant_settings_single_row CHECK ("settingsId" = 1)
);

-- ============================================================================
-- 2. SEED DEFAULT ROW
-- ============================================================================
-- Insert the one and only settings row with restaurant closed by default.
-- ON CONFLICT DO NOTHING ensures re-running this migration is safe.

INSERT INTO restaurant_settings ("settingsId", "isRestaurantOpen")
VALUES (1, false)
ON CONFLICT ("settingsId") DO NOTHING;

-- ============================================================================
-- NOTES FOR DEVELOPERS
-- ============================================================================
-- 1. This is a single-row config table — never INSERT a second row.
-- 2. Always UPDATE WHERE "settingsId" = 1.
-- 3. When isRestaurantOpen is set to false, the backend also sets
--    isActive = false on all rows in the waiter table (bulk update).
-- 4. updatedBy stores the adminId of whoever toggled the setting last.
-- 5. Use GET  /api/manager/settings        to fetch current state.
--    Use PATCH /api/manager/settings/toggle to flip isRestaurantOpen.
-- ============================================================================