-- Migration 007_inventory.sql
-- Create Inventory, Vendor, Purchase Entry, Recipe/BOM, and Stock Adjustment tables

-- 1. Vendors / Suppliers
CREATE TABLE IF NOT EXISTS vendor (
  "vendorId"       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId"   UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "name"           VARCHAR(255) NOT NULL,
  "mobile"         VARCHAR(20),
  "email"          VARCHAR(255),
  "gstin"          VARCHAR(15),
  "address"        TEXT,
  "paymentTerms"   VARCHAR(100),
  "isActive"       BOOLEAN DEFAULT true,
  "createdAt"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("restaurantId", "mobile")
);
CREATE INDEX IF NOT EXISTS idx_vendor_restaurant ON vendor("restaurantId");

-- 2. Raw materials / ingredients
CREATE TABLE IF NOT EXISTS inventory_item (
  "itemId"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId"   UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "name"           VARCHAR(255) NOT NULL,
  "unit"           VARCHAR(50) NOT NULL,    -- kg, litre, piece, packet, dozen
  "category"       VARCHAR(100),            -- Vegetables, Dairy, Spices, Meat, etc.
  "currentStock"   DECIMAL(10,3) DEFAULT 0,
  "reorderLevel"   DECIMAL(10,3) DEFAULT 0,
  "costPerUnit"    DECIMAL(10,2) DEFAULT 0, -- last purchase price
  "isActive"       BOOLEAN DEFAULT true,
  "createdAt"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("restaurantId", "name")
);
CREATE INDEX IF NOT EXISTS idx_inventory_item_restaurant ON inventory_item("restaurantId");

-- 3. Purchase entries
CREATE TABLE IF NOT EXISTS purchase_entry (
  "purchaseId"     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId"   UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "vendorId"       UUID REFERENCES vendor("vendorId") ON DELETE SET NULL,
  "invoiceNo"      VARCHAR(100),
  "items"          JSONB NOT NULL,           -- [{itemId, quantity, unitPrice, totalPrice}]
  "totalAmount"    DECIMAL(10,2) NOT NULL,
  "paymentStatus"  VARCHAR(30) DEFAULT 'unpaid' CHECK ("paymentStatus" IN ('paid','unpaid','partial')),
  "paymentMethod"  VARCHAR(30),
  "purchaseDate"   DATE NOT NULL,
  "notes"          TEXT,
  "createdAt"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_purchase_entry_restaurant ON purchase_entry("restaurantId");

-- 4. Recipe / Bill of Materials
CREATE TABLE IF NOT EXISTS recipe (
  "recipeId"       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "dishId"         UUID NOT NULL REFERENCES menu("dishId") ON DELETE CASCADE,
  "restaurantId"   UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "ingredients"    JSONB NOT NULL,           -- [{itemId, itemName, quantity, unit}]
  "yieldQuantity"  DECIMAL(10,2) DEFAULT 1,  -- portions per recipe
  "createdAt"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("dishId", "restaurantId")
);
CREATE INDEX IF NOT EXISTS idx_recipe_restaurant ON recipe("restaurantId");

-- 5. Stock adjustments (wastage, theft, corrections)
CREATE TABLE IF NOT EXISTS stock_adjustment (
  "adjustmentId"   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "restaurantId"   UUID NOT NULL REFERENCES retrop_restaurant("restaurantId") ON DELETE CASCADE,
  "itemId"         UUID NOT NULL REFERENCES inventory_item("itemId") ON DELETE CASCADE,
  "type"           VARCHAR(30) NOT NULL CHECK ("type" IN ('wastage','theft','damage','correction','opening_stock')),
  "quantity"       DECIMAL(10,3) NOT NULL,   -- positive = add, negative = deduct
  "reason"         TEXT,
  "adjustedBy"     UUID,                     -- adminId who made the adjustment
  "createdAt"      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_stock_adjustment_restaurant ON stock_adjustment("restaurantId");
