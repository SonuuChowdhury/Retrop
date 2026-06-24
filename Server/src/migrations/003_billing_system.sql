-- ============================================================================
-- 003_BILLING_SYSTEM.SQL — Billing, Subscription, and Multi-Business Upgrades
-- ============================================================================

-- 1. Create Business Config table (Retrop's own billing details)
CREATE TABLE IF NOT EXISTS retrop_business_config (
  "configId"      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "legalName"     VARCHAR(255) NOT NULL,
  "address"       TEXT NOT NULL,
  "gstin"         VARCHAR(15) NOT NULL,
  "mobile"        VARCHAR(20) NOT NULL,
  "email"         VARCHAR(255) NOT NULL,
  "bankDetails"   JSONB NOT NULL DEFAULT '{"bankName": "", "accountNo": "", "ifsc": ""}'::jsonb,
  "gstRate"       DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
  "updatedAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Business Type registry table
CREATE TABLE IF NOT EXISTS business_type (
  "typeId"        VARCHAR(50) PRIMARY KEY,
  "displayName"   VARCHAR(100) NOT NULL,
  "isActive"      BOOLEAN DEFAULT true,
  "createdAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Business Types
INSERT INTO business_type ("typeId", "displayName", "isActive") VALUES
  ('restaurant', 'Restaurant SaaS', true),
  ('gym', 'Gym SaaS', true),
  ('manufacturing', 'Manufacturing Ledger', true)
ON CONFLICT ("typeId") DO UPDATE SET "displayName" = EXCLUDED."displayName";

-- 3. Modify retrop_restaurant table to add columns for GST and Business Type
ALTER TABLE retrop_restaurant ADD COLUMN IF NOT EXISTS "businessTypeId" VARCHAR(50) REFERENCES business_type("typeId") DEFAULT 'restaurant';
ALTER TABLE retrop_restaurant ADD COLUMN IF NOT EXISTS "hasGst" BOOLEAN DEFAULT false;
ALTER TABLE retrop_restaurant ADD COLUMN IF NOT EXISTS "gstin" VARCHAR(15);

-- 4. Create Pricing Plans table
CREATE TABLE IF NOT EXISTS pricing_plan (
  "planId"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "businessTypeId"   VARCHAR(50) NOT NULL REFERENCES business_type("typeId") ON DELETE CASCADE,
  "name"             VARCHAR(100) NOT NULL,
  "planType"         VARCHAR(30) NOT NULL CHECK ("planType" IN ('monthly', 'lifetime', 'support')),
  "billingCycleDays" INTEGER DEFAULT 28,
  "basePrice"        DECIMAL(10, 2) NOT NULL,
  "gstPercent"       DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
  "description"      TEXT,
  "isActive"         BOOLEAN DEFAULT true,
  "createdAt"        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pricing_plan_business ON pricing_plan("businessTypeId");
CREATE INDEX IF NOT EXISTS idx_pricing_plan_active   ON pricing_plan("isActive");

-- Seed default pricing plans for Restaurant SaaS
INSERT INTO pricing_plan ("planId", "businessTypeId", "name", "planType", "billingCycleDays", "basePrice", "description") VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'restaurant', 'Monthly Subscription (28 Days)', 'monthly', 28, 2000.00, 'Regular 28 days cycle SaaS subscription'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'restaurant', 'Lifetime Plan', 'lifetime', NULL, 15000.00, 'One-time license buy'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'restaurant', 'Tech Support (Incidents)', 'support', NULL, 500.00, 'Pay-per-incident maintenance support charge')
ON CONFLICT ("planId") DO NOTHING;

-- 5. Create Subscriptions table
CREATE TABLE IF NOT EXISTS subscription (
  "subscriptionId"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId"      UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "planId"            UUID NOT NULL REFERENCES pricing_plan("planId") ON DELETE RESTRICT,
  "status"            VARCHAR(30) NOT NULL DEFAULT 'pending_payment' CHECK ("status" IN ('active', 'grace_period', 'suspended', 'pending_payment')),
  "startDate"         TIMESTAMP WITH TIME ZONE,
  "endDate"           TIMESTAMP WITH TIME ZONE,
  "gracePeriodEndsAt" TIMESTAMP WITH TIME ZONE,
  "nextBillingDate"   TIMESTAMP WITH TIME ZONE,
  "createdAt"         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscription_restaurant ON subscription("restaurantId");
CREATE INDEX IF NOT EXISTS idx_subscription_status     ON subscription("status");

-- 6. Create Transactions table
CREATE TABLE IF NOT EXISTS transaction (
  "transactionId"    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId"      UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "subscriptionId"    UUID REFERENCES subscription("subscriptionId") ON DELETE SET NULL,
  "invoiceNo"         VARCHAR(50) UNIQUE NOT NULL,
  "paymentMethod"     VARCHAR(20) NOT NULL CHECK ("paymentMethod" IN ('Cash', 'UPI')),
  "upiTransactionId"  VARCHAR(100),
  "baseAmount"        DECIMAL(10, 2) NOT NULL,
  "gstAmount"         DECIMAL(10, 2) NOT NULL,
  "finalAmount"       DECIMAL(10, 2) NOT NULL,
  "status"            VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK ("status" IN ('paid', 'pending', 'failed')),
  "invoiceUrl"        VARCHAR(500),
  "description"       VARCHAR(255) NOT NULL,
  "createdAt"         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transaction_restaurant ON transaction("restaurantId");
CREATE INDEX IF NOT EXISTS idx_transaction_invoice    ON transaction("invoiceNo");

-- 7. Create Support Service Ticket table
CREATE TABLE IF NOT EXISTS support_service_ticket (
  "ticketId"      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId"  UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "title"         VARCHAR(255) NOT NULL,
  "description"   TEXT NOT NULL,
  "ticketStatus"  VARCHAR(30) NOT NULL DEFAULT 'pending_payment' CHECK ("ticketStatus" IN ('pending_payment', 'open', 'resolved')),
  "cost"          DECIMAL(10, 2) NOT NULL DEFAULT 500.00,
  "createdAt"     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial Retrop business configuration
INSERT INTO retrop_business_config ("legalName", "address", "gstin", "mobile", "email", "bankDetails", "gstRate") VALUES
  ('Retrop Software Solutions', '123 Tech Park, Sector 62, Noida, UP, India', '09AAAAA1111A1Z1', '9876543210', 'billing@retrop.com', '{"bankName": "HDFC Bank", "accountNo": "501002233445566", "ifsc": "HDFC0000123"}', 18.00);
