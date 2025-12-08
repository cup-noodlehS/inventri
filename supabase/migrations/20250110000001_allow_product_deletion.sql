-- ============================================================================
-- Allow product deletion with CASCADE
-- ============================================================================
-- Description: Changes foreign key constraint to allow product deletion
--              Transaction items will be deleted when product is deleted
-- Version: 1.0
-- Date: 2025-01-10
-- ============================================================================

BEGIN;

-- Drop the existing foreign key constraint
ALTER TABLE transaction_item
DROP CONSTRAINT IF EXISTS transaction_item_sku_fkey;

-- Recreate with CASCADE instead of RESTRICT
ALTER TABLE transaction_item
ADD CONSTRAINT transaction_item_sku_fkey
FOREIGN KEY (sku)
REFERENCES product(sku)
ON DELETE CASCADE;

COMMIT;

