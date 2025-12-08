-- ============================================================================
-- Perfume Shop Inventory Management System - Database Schema
-- ============================================================================
-- Description: Simplified schema for tracking perfume inventory
--              Focuses on two core operations: Deliveries (in) and Sales (out)
-- Version: 1.0
-- Date: 2025-01-09
-- ============================================================================

-- Start transaction
BEGIN;

-- ============================================================================
-- ENABLE EXTENSIONS
-- ============================================================================

-- Enable UUID generation (for potential future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- User Table
-- ----------------------------------------------------------------------------
-- Stores user information linked to Supabase Auth
-- The id matches auth.users.id from Supabase authentication

CREATE TABLE "user" (
  id VARCHAR(255) PRIMARY KEY,  -- Matches Supabase auth.users.id
  username VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster username lookups
CREATE INDEX idx_user_username ON "user"(username);

-- ----------------------------------------------------------------------------
-- Product Table
-- ----------------------------------------------------------------------------
-- Stores perfume product information
-- Key addition: volume_ml to track bottle sizes

CREATE TABLE product (
  sku VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  volume_ml INTEGER NOT NULL,  -- Bottle size (e.g., 65ml, 100ml, 120ml)
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  min_stock_threshold INTEGER DEFAULT 5 CHECK (min_stock_threshold >= 0),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(255) REFERENCES "user"(id) ON DELETE SET NULL
);

-- Indexes for faster queries
CREATE INDEX idx_product_name ON product(name);
CREATE INDEX idx_product_volume ON product(volume_ml);
CREATE INDEX idx_product_created_at ON product(created_at);

-- ----------------------------------------------------------------------------
-- Inventory Transaction Table (Header)
-- ----------------------------------------------------------------------------
-- Records transaction header information
-- Only two types: 'Delivery' (stock in) and 'Sale' (stock out)

CREATE TABLE inventory_transaction (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('Delivery', 'Sale')),
  reference VARCHAR(100),  -- Transaction reference number
  performed_by VARCHAR(255) NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,  -- General transaction notes (maps to Remarks column)
  customer_name VARCHAR(255),  -- Optional: customer name for sales
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_transaction_type ON inventory_transaction(transaction_type);
CREATE INDEX idx_transaction_timestamp ON inventory_transaction(timestamp);
CREATE INDEX idx_transaction_performed_by ON inventory_transaction(performed_by);
CREATE INDEX idx_transaction_status ON inventory_transaction(status);

-- ----------------------------------------------------------------------------
-- Transaction Item Table (Line Items)
-- ----------------------------------------------------------------------------
-- Records individual products in each transaction
-- Quantity is POSITIVE for Deliveries, NEGATIVE for Sales

CREATE TABLE transaction_item (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER NOT NULL REFERENCES inventory_transaction(id) ON DELETE CASCADE,
  sku VARCHAR(50) NOT NULL REFERENCES product(sku) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity != 0),  -- Cannot be zero
  unit_price_at_transaction DECIMAL(10,2),  -- Historical price at time of transaction
  total_amount DECIMAL(10,2),  -- quantity * unit_price
  note TEXT,  -- Item-specific notes
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_transaction_item_transaction_id ON transaction_item(transaction_id);
CREATE INDEX idx_transaction_item_sku ON transaction_item(sku);

-- ============================================================================
-- CREATE VIEWS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Current Stock View
-- ----------------------------------------------------------------------------
-- Real-time view of current inventory levels
-- Calculates quantity on hand by summing all completed transaction items

CREATE OR REPLACE VIEW current_stock AS
SELECT
  p.sku,
  p.name,
  p.volume_ml,
  p.price,
  p.min_stock_threshold,
  p.description,
  COALESCE(SUM(ti.quantity), 0) AS quantity_on_hand,
  COALESCE(SUM(ti.quantity), 0) * p.price AS total_value,
  p.created_at,
  p.updated_at
FROM product p
LEFT JOIN transaction_item ti ON p.sku = ti.sku
LEFT JOIN inventory_transaction t ON ti.transaction_id = t.id
WHERE t.status = 'completed' OR t.status IS NULL
GROUP BY p.sku, p.name, p.volume_ml, p.price, p.min_stock_threshold, p.description, p.created_at, p.updated_at;

-- ============================================================================
-- CREATE FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Update Timestamp Trigger Function
-- ----------------------------------------------------------------------------
-- Automatically updates the updated_at column when a row is modified

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to product table
CREATE TRIGGER update_product_updated_at
  BEFORE UPDATE ON product
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to user table
CREATE TRIGGER update_user_updated_at
  BEFORE UPDATE ON "user"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Calculate Transaction Item Total Function
-- ----------------------------------------------------------------------------
-- Automatically calculates total_amount before insert/update

CREATE OR REPLACE FUNCTION calculate_transaction_item_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total_amount as absolute value for storage
  -- (quantity can be negative for sales)
  NEW.total_amount = ABS(NEW.quantity) * NEW.unit_price_at_transaction;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_transaction_item_total_trigger
  BEFORE INSERT OR UPDATE ON transaction_item
  FOR EACH ROW
  EXECUTE FUNCTION calculate_transaction_item_total();

-- ----------------------------------------------------------------------------
-- Validate Transaction Quantity Function
-- ----------------------------------------------------------------------------
-- Ensures Delivery transactions have positive quantities
-- Ensures Sale transactions have negative quantities

CREATE OR REPLACE FUNCTION validate_transaction_quantity()
RETURNS TRIGGER AS $$
DECLARE
  trans_type VARCHAR(20);
BEGIN
  -- Get transaction type
  SELECT transaction_type INTO trans_type
  FROM inventory_transaction
  WHERE id = NEW.transaction_id;

  -- Validate quantity based on transaction type
  IF trans_type = 'Delivery' AND NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Delivery transactions must have positive quantity';
  END IF;

  IF trans_type = 'Sale' AND NEW.quantity >= 0 THEN
    RAISE EXCEPTION 'Sale transactions must have negative quantity';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_transaction_quantity_trigger
  BEFORE INSERT OR UPDATE ON transaction_item
  FOR EACH ROW
  EXECUTE FUNCTION validate_transaction_quantity();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE product ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_item ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- User Policies
-- ----------------------------------------------------------------------------

-- Users can view all users
CREATE POLICY "Users can view all users"
ON "user" FOR SELECT
TO authenticated
USING (true);

-- Users can update their own record
CREATE POLICY "Users can update own record"
ON "user" FOR UPDATE
TO authenticated
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- ----------------------------------------------------------------------------
-- Product Policies
-- ----------------------------------------------------------------------------

-- All authenticated users can view products
CREATE POLICY "Users can view products"
ON product FOR SELECT
TO authenticated
USING (true);

-- All authenticated users can insert products
CREATE POLICY "Users can insert products"
ON product FOR INSERT
TO authenticated
WITH CHECK (true);

-- All authenticated users can update products
CREATE POLICY "Users can update products"
ON product FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- All authenticated users can delete products
CREATE POLICY "Users can delete products"
ON product FOR DELETE
TO authenticated
USING (true);

-- ----------------------------------------------------------------------------
-- Transaction Policies
-- ----------------------------------------------------------------------------

-- All authenticated users can view transactions
CREATE POLICY "Users can view transactions"
ON inventory_transaction FOR SELECT
TO authenticated
USING (true);

-- All authenticated users can insert transactions
CREATE POLICY "Users can insert transactions"
ON inventory_transaction FOR INSERT
TO authenticated
WITH CHECK (true);

-- All authenticated users can update transactions
CREATE POLICY "Users can update transactions"
ON inventory_transaction FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- All authenticated users can delete transactions
CREATE POLICY "Users can delete transactions"
ON inventory_transaction FOR DELETE
TO authenticated
USING (true);

-- ----------------------------------------------------------------------------
-- Transaction Item Policies
-- ----------------------------------------------------------------------------

-- All authenticated users can view transaction items
CREATE POLICY "Users can view transaction items"
ON transaction_item FOR SELECT
TO authenticated
USING (true);

-- All authenticated users can insert transaction items
CREATE POLICY "Users can insert transaction items"
ON transaction_item FOR INSERT
TO authenticated
WITH CHECK (true);

-- All authenticated users can update transaction items
CREATE POLICY "Users can update transaction items"
ON transaction_item FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- All authenticated users can delete transaction items
CREATE POLICY "Users can delete transaction items"
ON transaction_item FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Enable realtime for inventory_transaction table
-- This allows the app to receive instant updates when transactions are created
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_transaction;

-- ============================================================================
-- HELPER FUNCTIONS FOR APPLICATION USE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Get Inventory Ledger Function
-- ----------------------------------------------------------------------------
-- Returns ledger-style data for date range export
-- Shows: Product | ML | Beginning Inv | Deliveries | Sales | End Inv

CREATE OR REPLACE FUNCTION get_inventory_ledger(
  start_date TIMESTAMP,
  end_date TIMESTAMP
)
RETURNS TABLE (
  sku VARCHAR(50),
  name VARCHAR(255),
  volume_ml INTEGER,
  price DECIMAL(10,2),
  beginning_inventory BIGINT,
  total_deliveries BIGINT,
  total_sales BIGINT,
  ending_inventory BIGINT,
  inventory_value DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.sku,
    p.name,
    p.volume_ml,
    p.price,
    -- Beginning inventory: sum of all transactions before start_date
    COALESCE(
      (SELECT SUM(ti_before.quantity)
       FROM transaction_item ti_before
       JOIN inventory_transaction t_before ON ti_before.transaction_id = t_before.id
       WHERE ti_before.sku = p.sku
         AND t_before.timestamp < start_date
         AND t_before.status = 'completed'
      ), 0
    ) AS beginning_inventory,
    -- Total deliveries in date range
    COALESCE(
      (SELECT SUM(ti_del.quantity)
       FROM transaction_item ti_del
       JOIN inventory_transaction t_del ON ti_del.transaction_id = t_del.id
       WHERE ti_del.sku = p.sku
         AND t_del.transaction_type = 'Delivery'
         AND t_del.timestamp >= start_date
         AND t_del.timestamp <= end_date
         AND t_del.status = 'completed'
      ), 0
    ) AS total_deliveries,
    -- Total sales in date range (absolute value of negative quantities)
    COALESCE(
      ABS(
        (SELECT SUM(ti_sale.quantity)
         FROM transaction_item ti_sale
         JOIN inventory_transaction t_sale ON ti_sale.transaction_id = t_sale.id
         WHERE ti_sale.sku = p.sku
           AND t_sale.transaction_type = 'Sale'
           AND t_sale.timestamp >= start_date
           AND t_sale.timestamp <= end_date
           AND t_sale.status = 'completed'
        )
      ), 0
    ) AS total_sales,
    -- Ending inventory: sum of all transactions up to end_date
    COALESCE(
      (SELECT SUM(ti_end.quantity)
       FROM transaction_item ti_end
       JOIN inventory_transaction t_end ON ti_end.transaction_id = t_end.id
       WHERE ti_end.sku = p.sku
         AND t_end.timestamp <= end_date
         AND t_end.status = 'completed'
      ), 0
    ) AS ending_inventory,
    -- Inventory value
    COALESCE(
      (SELECT SUM(ti_end.quantity)
       FROM transaction_item ti_end
       JOIN inventory_transaction t_end ON ti_end.transaction_id = t_end.id
       WHERE ti_end.sku = p.sku
         AND t_end.timestamp <= end_date
         AND t_end.status = 'completed'
      ), 0
    ) * p.price AS inventory_value
  FROM product p
  ORDER BY p.name, p.volume_ml;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

-- Table comments
COMMENT ON TABLE "user" IS 'User accounts linked to Supabase Auth';
COMMENT ON TABLE product IS 'Perfume product catalog with volume tracking';
COMMENT ON TABLE inventory_transaction IS 'Transaction headers for Deliveries and Sales';
COMMENT ON TABLE transaction_item IS 'Line items for each transaction';

-- Column comments
COMMENT ON COLUMN product.volume_ml IS 'Bottle size in milliliters (e.g., 65, 100, 120)';
COMMENT ON COLUMN inventory_transaction.transaction_type IS 'Only two types: Delivery (stock in) or Sale (stock out)';
COMMENT ON COLUMN inventory_transaction.customer_name IS 'Optional customer name for sales transactions';
COMMENT ON COLUMN transaction_item.quantity IS 'Positive for Deliveries, negative for Sales';

-- ============================================================================
-- COMMIT TRANSACTION
-- ============================================================================

COMMIT;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
