-- ============================================================================
-- 008_expense_staff_loyalty_schema.sql
-- Retrop V3 — Expense Tracking, Day Close, Custom Staff Roles & Loyalty Engine
-- ============================================================================

-- 1. RESTAURANT METADATA
ALTER TABLE restaurant_info
  ADD COLUMN IF NOT EXISTS "gstChangedAt" TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS "logoUrl"      VARCHAR(500);

-- 2. ORDERS ENHANCEMENTS (COGS & PROFITABILITY)
ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "costOfGoods" DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "grossProfit"  DECIMAL(10,2) DEFAULT 0;

-- 3. EXPENSE TRACKING
CREATE TABLE IF NOT EXISTS expense (
  "expenseId"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId" UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "amount"       DECIMAL(10,2) NOT NULL,
  "category"     VARCHAR(100) NOT NULL, -- Rent, Utilities, Ingredients, Salaries, Maintenance, Other
  "description"  TEXT,
  "paymentMode"  VARCHAR(50) DEFAULT 'Cash', -- Cash, UPI, Card, Bank Transfer
  "receiptUrl"   VARCHAR(500),
  "expenseDate"  DATE NOT NULL,
  "createdBy"    UUID REFERENCES admin("adminId") ON DELETE SET NULL,
  "createdAt"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expense_restaurant ON expense("restaurantId");
CREATE INDEX IF NOT EXISTS idx_expense_date       ON expense("restaurantId", "expenseDate" DESC);
CREATE INDEX IF NOT EXISTS idx_expense_category   ON expense("restaurantId", "category");

-- 4. CASH REGISTER / DAY CLOSE
CREATE TABLE IF NOT EXISTS day_close (
  "closeId"       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId"  UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "closeDate"     DATE NOT NULL,
  "openingCash"   DECIMAL(10,2) NOT NULL DEFAULT 0,
  "cashSales"     DECIMAL(10,2) NOT NULL DEFAULT 0,
  "cashExpenses"  DECIMAL(10,2) NOT NULL DEFAULT 0,
  "expectedCash"  DECIMAL(10,2) NOT NULL DEFAULT 0,
  "actualCash"    DECIMAL(10,2) NOT NULL DEFAULT 0,
  "variance"      DECIMAL(10,2) NOT NULL DEFAULT 0,
  "notes"         TEXT,
  "closedBy"      UUID REFERENCES admin("adminId") ON DELETE SET NULL,
  "createdAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("restaurantId", "closeDate")
);

CREATE INDEX IF NOT EXISTS idx_day_close_restaurant ON day_close("restaurantId");
CREATE INDEX IF NOT EXISTS idx_day_close_date       ON day_close("restaurantId", "closeDate" DESC);

-- 5. MENU COMPLIANCE (HSN/SAC)
ALTER TABLE menu
  ADD COLUMN IF NOT EXISTS "hsnCode" VARCHAR(20);

-- 6. UNIFIED CUSTOM STAFF ROLES
CREATE TABLE IF NOT EXISTS retrop_other_staff (
  "staffId"      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId" UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "name"         VARCHAR(255) NOT NULL,
  "mobile"       VARCHAR(20) NOT NULL,
  "password"     VARCHAR(255) NOT NULL,
  "role"         VARCHAR(100) NOT NULL, -- e.g. Cashier, Storekeeper, Valet, Cleaner
  "isActive"     BOOLEAN DEFAULT true,
  "lastLogIn"    TIMESTAMP WITH TIME ZONE,
  "createdAt"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("restaurantId", "mobile")
);

CREATE INDEX IF NOT EXISTS idx_other_staff_restaurant ON retrop_other_staff("restaurantId");
CREATE INDEX IF NOT EXISTS idx_other_staff_mobile     ON retrop_other_staff("mobile");

-- 7. LOYALTY & REWARDS
CREATE TABLE IF NOT EXISTS loyalty_points (
  "pointId"      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId" UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "mobile"       VARCHAR(20) NOT NULL,
  "totalPoints"  INTEGER NOT NULL DEFAULT 0,
  "lifetimeEarned" INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("restaurantId", "mobile")
);

CREATE INDEX IF NOT EXISTS idx_loyalty_restaurant ON loyalty_points("restaurantId");
CREATE INDEX IF NOT EXISTS idx_loyalty_mobile     ON loyalty_points("mobile");

-- 8. CUSTOMER FEEDBACK
CREATE TABLE IF NOT EXISTS customer_feedback (
  "feedbackId"   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId" UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "orderId"      UUID REFERENCES "orders"("ordersId") ON DELETE SET NULL,
  "mobile"       VARCHAR(20) NOT NULL,
  "rating"       SMALLINT NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
  "comment"      TEXT,
  "createdAt"    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_restaurant ON customer_feedback("restaurantId");
CREATE INDEX IF NOT EXISTS idx_feedback_order      ON customer_feedback("orderId");
CREATE INDEX IF NOT EXISTS idx_feedback_mobile     ON customer_feedback("mobile");
CREATE INDEX IF NOT EXISTS idx_feedback_date       ON customer_feedback("restaurantId", "createdAt" DESC);
