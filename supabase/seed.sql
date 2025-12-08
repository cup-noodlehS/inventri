-- ============================================================================
-- Perfume Shop Inventory - Seed Data
-- ============================================================================
-- Description: Mock data for testing the perfume shop inventory system
--              Based on actual products from client's notebook
-- Version: 1.0
-- Date: 2025-01-09
-- ============================================================================

BEGIN;

-- ============================================================================
-- SEED USER DATA
-- ============================================================================

-- Test shop owner account
-- NOTE: This only creates the user record.
-- The actual auth user must be created via Supabase Auth (signup)
-- Password for testing: Test123456!

INSERT INTO "user" (id, username, full_name, is_active, created_at, updated_at) VALUES
('00000000-0000-0000-0000-000000000001', 'shop_owner', 'Maria Santos', true, NOW(), NOW()),
('00000000-0000-0000-0000-000000000002', 'staff_member', 'Juan Dela Cruz', true, NOW(), NOW());

-- ============================================================================
-- SEED PRODUCT DATA
-- ============================================================================
-- Products from client's notebook (Page #1)
-- Format: SKU | Name | Volume (ML) | Price | Min Threshold

INSERT INTO product (sku, name, volume_ml, price, min_stock_threshold, description, created_by, created_at, updated_at) VALUES
-- 65ml Products (Page 1)
('GOOD-GIRL-65', 'Good Girl', 65, 45.00, 3, 'Carolina Herrera Good Girl - Women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('STRONGER-65', 'Stronger With You', 65, 42.00, 3, 'Emporio Armani Stronger With You - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('CREED-65', 'Creed', 65, 85.00, 2, 'Creed Aventus - Luxury men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('ELIXIR-DIOR-65', 'Elixir Dior', 65, 75.00, 2, 'Dior Sauvage Elixir - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('DIOR-SAUVAGE-65', 'Dior Sauvage', 65, 65.00, 3, 'Dior Sauvage EDT - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('INTENSELY-YOU-65', 'Intensely You', 65, 44.00, 3, 'Emporio Armani Intensely You - Women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('NAUTICA-VOYAGE-65', 'Nautica Voyage', 65, 28.00, 5, 'Nautica Voyage - Men''s aquatic fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('LE-MALE-65', 'Le Male Elixir', 65, 55.00, 3, 'Jean Paul Gaultier Le Male Elixir', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('TERRA-DURA-65', 'Terra Dura', 65, 38.00, 4, 'Terra Dura - Unisex fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('FLATME-65', 'Flatme', 65, 42.00, 3, 'Flatme - Women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('ULTRA-MALE-65', 'Ultra Male', 65, 52.00, 3, 'Jean Paul Gaultier Ultra Male', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('KAY-ALI-65', 'Kay Ali', 65, 68.00, 2, 'Kayali Vanilla - Luxury women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('COCO-CHANEL-65', 'Coco Chanel', 65, 95.00, 2, 'Chanel Coco Mademoiselle - Women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('SELENA-GOMEZ-65', 'Selena Gomez', 65, 35.00, 4, 'Selena Gomez Signature - Women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('INVICTUS-65', 'Invictus', 65, 58.00, 3, 'Paco Rabanne Invictus - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('OUD-WOOD-65', 'Oud Wood', 65, 88.00, 2, 'Tom Ford Oud Wood - Unisex luxury fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('YOURE-THE-ONE-65', 'You''re The One', 65, 40.00, 3, 'You''re The One - Unisex fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('CHOCO-VANILLA-65', 'Choco Vanilla', 65, 32.00, 4, 'Chocolate Vanilla - Sweet women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('CHANEL-CHANCE-65', 'Chanel Chance', 65, 92.00, 2, 'Chanel Chance Eau Tendre - Women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),

-- 100ml Products
('GOOD-GIRL-100', 'Good Girl', 100, 75.00, 3, 'Carolina Herrera Good Girl 100ml - Women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('CREED-100', 'Creed', 100, 130.00, 2, 'Creed Aventus 100ml - Luxury men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('ELIXIR-DIOR-100', 'Elixir Dior', 100, 115.00, 2, 'Dior Sauvage Elixir 100ml', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('JADORE-100', 'Jadore', 100, 98.00, 3, 'Dior J''adore - Women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),

-- 120ml Products
('DIOR-SAUVAGE-120', 'Dior Sauvage', 120, 95.00, 3, 'Dior Sauvage EDT 120ml', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('EROS-120', 'Eros', 120, 68.00, 3, 'Versace Eros - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('VANILLA-LATTE-120', 'Vanilla & Latte', 120, 42.00, 4, 'Vanilla Latte - Sweet women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('THE-ONE-120', 'The One', 120, 55.00, 3, 'Dolce & Gabbana The One - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('HAPPY-MEN-120', 'Happy Men', 120, 48.00, 4, 'Clinique Happy for Men', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('BACCARAT-120', 'Baccarat', 120, 105.00, 2, 'Baccarat Rouge 540 - Luxury unisex', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('AQUA-DI-GIO-120', 'Aqua Di Gio', 120, 72.00, 3, 'Giorgio Armani Aqua Di Gio - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('LOVE-STORY-120', 'Love Story', 120, 62.00, 3, 'Chloe Love Story - Women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('MISS-DIOR-120', 'Miss Dior', 120, 88.00, 2, 'Miss Dior Blooming Bouquet - Women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('FAHRENHEIT-120', 'Fahrenheit', 120, 78.00, 3, 'Dior Fahrenheit - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('BOMBSHELL-120', 'Bombshell', 120, 54.00, 3, 'Victoria''s Secret Bombshell - Women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('LACOSTE-WHITE-120', 'Lacoste White', 120, 52.00, 4, 'Lacoste L.12.12 White - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('JADORE-120', 'Jadore', 120, 115.00, 2, 'Dior J''adore 120ml - Women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('YSL-OPIUM-120', 'YSL Opium', 120, 92.00, 2, 'Yves Saint Laurent Black Opium - Women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('MEOUI-120', 'Meoui', 120, 45.00, 4, 'Meoui - Unisex fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('IMAGINATION-120', 'Imagination', 120, 58.00, 3, 'Louis Vuitton Imagination - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('LACOSTE-BLACK-120', 'Lacoste Black', 120, 52.00, 4, 'Lacoste L.12.12 Black - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('DRAKKAR-120', 'Drakkar', 120, 48.00, 4, 'Guy Laroche Drakkar Noir - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('OMNIA-120', 'Omnia', 120, 68.00, 3, 'Bvlgari Omnia - Women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('212-VIP-120', '212 VIP', 120, 65.00, 3, 'Carolina Herrera 212 VIP - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('CUCUMBER-MELON-120', 'Cucumber Melon', 120, 28.00, 5, 'Bath & Body Works Cucumber Melon - Fresh fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('ORANGE-BLOSSOM-120', 'Orange Blossom', 120, 32.00, 5, 'Orange Blossom - Fresh women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),

-- Additional popular perfumes for variety
('AXE-65', 'Axe', 65, 18.00, 8, 'Axe Body Spray - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('SWISS-ARMY-65', 'Swiss Army', 65, 35.00, 5, 'Swiss Army Classic - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('TOUCH-PINK-65', 'Touch of Pink', 65, 38.00, 4, 'Lacoste Touch of Pink - Women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('CK-ONE-65', 'CK One', 65, 42.00, 5, 'Calvin Klein CK One - Unisex fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('ECLAT-65', 'Eclat', 65, 52.00, 4, 'Lanvin Eclat d''Arpege - Women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('PRADA-65', 'Prada', 65, 78.00, 3, 'Prada L''Homme - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('LIGHT-BLUE-65', 'Light Blue Women', 65, 62.00, 4, 'Dolce & Gabbana Light Blue - Women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('BLEU-CHANEL-65', 'Bleu de Chanel', 65, 95.00, 2, 'Chanel Bleu de Chanel - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('PURE-SEDUCTION-65', 'Pure Seduction', 65, 32.00, 5, 'Victoria''s Secret Pure Seduction - Women''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('BAD-BOY-65', 'Bad Boy', 65, 68.00, 3, 'Carolina Herrera Bad Boy - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('POLO-BLACK-65', 'Polo Black', 65, 55.00, 4, 'Ralph Lauren Polo Black - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('EXTREME-65', 'Extreme', 65, 48.00, 4, 'Jimmy Choo Man Extreme - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('HUGO-BOSS-65', 'Hugo Boss', 65, 58.00, 4, 'Hugo Boss Bottled - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('GAP-65', 'GAP', 65, 25.00, 6, 'GAP Established 1969 - Unisex fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('HAWAS-75', 'Hawas', 75, 65.00, 3, 'Rasasi Hawas - Men''s aquatic fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('DIESEL-120', 'Diesel', 120, 62.00, 3, 'Diesel Only The Brave - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW()),
('ARMANI-CODE-120', 'Armani Code', 120, 75.00, 3, 'Giorgio Armani Code - Men''s fragrance', '00000000-0000-0000-0000-000000000001', NOW(), NOW());

-- ============================================================================
-- SEED BEGINNING INVENTORY (Initial Stock)
-- ============================================================================
-- These transactions establish the "beginning inventory" as of 2025-01-01
-- Using transaction_type = 'Delivery' with notes indicating it's initial stock

-- Create initial inventory transaction
INSERT INTO inventory_transaction (timestamp, transaction_type, reference, performed_by, status, notes, created_at) VALUES
('2025-01-01 08:00:00', 'Delivery', 'INIT-INV-2025', '00000000-0000-0000-0000-000000000001', 'completed', 'Beginning inventory for 2025', '2025-01-01 08:00:00');

-- Get the transaction ID (will be 1)
-- Add beginning inventory quantities for each product
INSERT INTO transaction_item (transaction_id, sku, quantity, unit_price_at_transaction, note, created_at) VALUES
-- From notebook image - Beginning Inventory column
(1, 'AXE-65', 2, 18.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'SWISS-ARMY-65', 2, 35.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'TOUCH-PINK-65', 2, 38.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'CK-ONE-65', 6, 42.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'ECLAT-65', 8, 52.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'PRADA-65', 6, 78.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'LIGHT-BLUE-65', 10, 62.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'BLEU-CHANEL-65', 11, 95.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'PURE-SEDUCTION-65', 2, 32.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'BAD-BOY-65', 4, 68.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'POLO-BLACK-65', 6, 55.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'EXTREME-65', 4, 48.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'HUGO-BOSS-65', 7, 58.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'GAP-65', 7, 25.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'STRONGER-65', 9, 42.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'INTENSELY-YOU-65', 8, 44.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'HAPPY-MEN-120', 9, 48.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'HAWAS-75', 8, 65.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'JADORE-100', 3, 98.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'GOOD-GIRL-100', 5, 75.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'FLATME-65', 3, 42.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'AQUA-DI-GIO-120', 3, 72.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'INVICTUS-65', 3, 58.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'DIESEL-120', 2, 62.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'DIOR-SAUVAGE-120', 2, 95.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'SELENA-GOMEZ-65', 2, 35.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'CUCUMBER-MELON-120', 3, 28.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'CHOCO-VANILLA-65', 3, 32.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'ARMANI-CODE-120', 2, 75.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'DRAKKAR-120', 2, 48.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'CREED-65', 4, 85.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'BACCARAT-120', 5, 105.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'ELIXIR-DIOR-100', 5, 115.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'NAUTICA-VOYAGE-65', 6, 28.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'LE-MALE-65', 4, 55.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'COCO-CHANEL-65', 3, 95.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'OUD-WOOD-65', 2, 88.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'BOMBSHELL-120', 5, 54.00, 'Initial stock', '2025-01-01 08:00:00'),
(1, 'ORANGE-BLOSSOM-120', 8, 32.00, 'Initial stock', '2025-01-01 08:00:00');

-- ============================================================================
-- SEED SAMPLE DELIVERY TRANSACTIONS
-- ============================================================================
-- Simulate realistic delivery (stock in) transactions

-- Delivery 1: January 5, 2025 - Restocking popular items
INSERT INTO inventory_transaction (timestamp, transaction_type, reference, performed_by, status, notes, created_at) VALUES
('2025-01-05 10:30:00', 'Delivery', 'DEL-20250105-001', '00000000-0000-0000-0000-000000000001', 'completed', 'Weekly restock from supplier', '2025-01-05 10:30:00');

INSERT INTO transaction_item (transaction_id, sku, quantity, unit_price_at_transaction, note, created_at) VALUES
(2, 'GOOD-GIRL-100', 10, 75.00, 'Best seller - restock', '2025-01-05 10:30:00'),
(2, 'DIOR-SAUVAGE-120', 8, 95.00, 'High demand item', '2025-01-05 10:30:00'),
(2, 'BLEU-CHANEL-65', 5, 95.00, 'Premium restock', '2025-01-05 10:30:00'),
(2, 'CREED-65', 6, 85.00, 'Luxury item', '2025-01-05 10:30:00'),
(2, 'BACCARAT-120', 4, 105.00, 'Premium restock', '2025-01-05 10:30:00');

-- Delivery 2: January 8, 2025 - Mid-range products
INSERT INTO inventory_transaction (timestamp, transaction_type, reference, performed_by, status, notes, created_at) VALUES
('2025-01-08 14:15:00', 'Delivery', 'DEL-20250108-001', '00000000-0000-0000-0000-000000000002', 'completed', 'Mid-week delivery', '2025-01-08 14:15:00');

INSERT INTO transaction_item (transaction_id, sku, quantity, unit_price_at_transaction, note, created_at) VALUES
(3, 'CK-ONE-65', 12, 42.00, 'Popular unisex', '2025-01-08 14:15:00'),
(3, 'STRONGER-65', 10, 42.00, 'Men''s favorite', '2025-01-08 14:15:00'),
(3, 'LIGHT-BLUE-65', 8, 62.00, 'Women''s favorite', '2025-01-08 14:15:00'),
(3, 'AQUA-DI-GIO-120', 7, 72.00, 'Classic men''s', '2025-01-08 14:15:00'),
(3, 'BOMBSHELL-120', 10, 54.00, 'Best seller', '2025-01-08 14:15:00');

-- ============================================================================
-- SEED SAMPLE SALE TRANSACTIONS
-- ============================================================================
-- Simulate realistic sale (stock out) transactions
-- NOTE: Quantities are NEGATIVE for sales

-- Sale 1: January 2, 2025 - Morning sales
INSERT INTO inventory_transaction (timestamp, transaction_type, reference, performed_by, status, customer_name, notes, created_at) VALUES
('2025-01-02 11:20:00', 'Sale', 'SALE-20250102-001', '00000000-0000-0000-0000-000000000001', 'completed', 'Maria Cruz', 'Gift purchase', '2025-01-02 11:20:00');

INSERT INTO transaction_item (transaction_id, sku, quantity, unit_price_at_transaction, note, created_at) VALUES
(4, 'GOOD-GIRL-100', -1, 75.00, 'Birthday gift', '2025-01-02 11:20:00');

-- Sale 2: January 2, 2025 - Afternoon sales
INSERT INTO inventory_transaction (timestamp, transaction_type, reference, performed_by, status, customer_name, created_at) VALUES
('2025-01-02 15:45:00', 'Sale', 'SALE-20250102-002', '00000000-0000-0000-0000-000000000001', 'completed', 'John Santos', '2025-01-02 15:45:00');

INSERT INTO transaction_item (transaction_id, sku, quantity, unit_price_at_transaction, note, created_at) VALUES
(5, 'DIOR-SAUVAGE-120', -1, 95.00, 'Personal use', '2025-01-02 15:45:00'),
(5, 'BLEU-CHANEL-65', -1, 95.00, 'Personal use', '2025-01-02 15:45:00');

-- Sale 3: January 3, 2025
INSERT INTO inventory_transaction (timestamp, transaction_type, reference, performed_by, status, customer_name, created_at) VALUES
('2025-01-03 10:30:00', 'Sale', 'SALE-20250103-001', '00000000-0000-0000-0000-000000000002', 'completed', 'Ana Reyes', '2025-01-03 10:30:00');

INSERT INTO transaction_item (transaction_id, sku, quantity, unit_price_at_transaction, created_at) VALUES
(6, 'LIGHT-BLUE-65', -2, 62.00, '2025-01-03 10:30:00');

-- Sale 4: January 3, 2025 - Walk-in customer
INSERT INTO inventory_transaction (timestamp, transaction_type, reference, performed_by, status, created_at) VALUES
('2025-01-03 16:20:00', 'Sale', 'SALE-20250103-002', '00000000-0000-0000-0000-000000000001', 'completed', '2025-01-03 16:20:00');

INSERT INTO transaction_item (transaction_id, sku, quantity, unit_price_at_transaction, note, created_at) VALUES
(7, 'CK-ONE-65', -1, 42.00, 'Walk-in customer', '2025-01-03 16:20:00');

-- Sale 5: January 4, 2025 - Multiple items
INSERT INTO inventory_transaction (timestamp, transaction_type, reference, performed_by, status, customer_name, notes, created_at) VALUES
('2025-01-04 13:15:00', 'Sale', 'SALE-20250104-001', '00000000-0000-0000-0000-000000000001', 'completed', 'Pedro Garcia', 'Anniversary gifts', '2025-01-04 13:15:00');

INSERT INTO transaction_item (transaction_id, sku, quantity, unit_price_at_transaction, created_at) VALUES
(8, 'GOOD-GIRL-100', -1, 75.00, '2025-01-04 13:15:00'),
(8, 'JADORE-100', -1, 98.00, '2025-01-04 13:15:00'),
(8, 'STRONGER-65', -1, 42.00, '2025-01-04 13:15:00');

-- Sale 6: January 5, 2025
INSERT INTO inventory_transaction (timestamp, transaction_type, reference, performed_by, status, customer_name, created_at) VALUES
('2025-01-05 09:45:00', 'Sale', 'SALE-20250105-001', '00000000-0000-0000-0000-000000000002', 'completed', 'Lisa Fernandez', '2025-01-05 09:45:00');

INSERT INTO transaction_item (transaction_id, sku, quantity, unit_price_at_transaction, created_at) VALUES
(9, 'BACCARAT-120', -1, 105.00, '2025-01-05 09:45:00');

-- Sale 7: January 6, 2025 - Afternoon
INSERT INTO inventory_transaction (timestamp, transaction_type, reference, performed_by, status, customer_name, created_at) VALUES
('2025-01-06 14:30:00', 'Sale', 'SALE-20250106-001', '00000000-0000-0000-0000-000000000001', 'completed', 'Carlos Mendoza', '2025-01-06 14:30:00');

INSERT INTO transaction_item (transaction_id, sku, quantity, unit_price_at_transaction, created_at) VALUES
(10, 'CREED-65', -1, 85.00, '2025-01-06 14:30:00'),
(10, 'AQUA-DI-GIO-120', -1, 72.00, '2025-01-06 14:30:00');

-- Sale 8: January 7, 2025
INSERT INTO inventory_transaction (timestamp, transaction_type, reference, performed_by, status, created_at) VALUES
('2025-01-07 11:00:00', 'Sale', 'SALE-20250107-001', '00000000-0000-0000-0000-000000000001', 'completed', '2025-01-07 11:00:00');

INSERT INTO transaction_item (transaction_id, sku, quantity, unit_price_at_transaction, note, created_at) VALUES
(11, 'BOMBSHELL-120', -2, 54.00, 'Walk-in sale', '2025-01-07 11:00:00'),
(11, 'PURE-SEDUCTION-65', -1, 32.00, 'Walk-in sale', '2025-01-07 11:00:00');

-- Sale 9: January 8, 2025
INSERT INTO inventory_transaction (timestamp, transaction_type, reference, performed_by, status, customer_name, created_at) VALUES
('2025-01-08 16:45:00', 'Sale', 'SALE-20250108-001', '00000000-0000-0000-0000-000000000002', 'completed', 'Rosa Diaz', '2025-01-08 16:45:00');

INSERT INTO transaction_item (transaction_id, sku, quantity, unit_price_at_transaction, created_at) VALUES
(12, 'COCO-CHANEL-65', -1, 95.00, '2025-01-08 16:45:00');

-- Sale 10: January 9, 2025 - Today's sales
INSERT INTO inventory_transaction (timestamp, transaction_type, reference, performed_by, status, customer_name, notes, created_at) VALUES
('2025-01-09 10:15:00', 'Sale', 'SALE-20250109-001', '00000000-0000-0000-0000-000000000001', 'completed', 'Miguel Torres', 'Regular customer', '2025-01-09 10:15:00');

INSERT INTO transaction_item (transaction_id, sku, quantity, unit_price_at_transaction, created_at) VALUES
(13, 'DIOR-SAUVAGE-120', -1, 95.00, '2025-01-09 10:15:00'),
(13, 'BLEU-CHANEL-65', -1, 95.00, '2025-01-09 10:15:00');

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================
-- Uncomment these to verify the seed data

-- Check total products
-- SELECT COUNT(*) as total_products FROM product;

-- Check current stock levels
-- SELECT sku, name, volume_ml, quantity_on_hand, total_value
-- FROM current_stock
-- ORDER BY name, volume_ml;

-- Check transaction summary
-- SELECT
--   transaction_type,
--   COUNT(*) as transaction_count,
--   SUM(ABS((SELECT SUM(quantity) FROM transaction_item WHERE transaction_id = inventory_transaction.id))) as total_units
-- FROM inventory_transaction
-- WHERE status = 'completed'
-- GROUP BY transaction_type;

-- Check low stock items
-- SELECT sku, name, volume_ml, quantity_on_hand, min_stock_threshold
-- FROM current_stock
-- WHERE quantity_on_hand <= min_stock_threshold
-- ORDER BY quantity_on_hand ASC;

-- Test ledger function for January 2025
-- SELECT * FROM get_inventory_ledger('2025-01-01', '2025-01-09');

COMMIT;

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================

-- Summary of seeded data:
-- - 2 test users (shop_owner, staff_member)
-- - 65+ perfume products across different volumes (65ml, 75ml, 100ml, 120ml)
-- - 1 initial inventory transaction (beginning inventory)
-- - 2 delivery transactions (restocking)
-- - 10 sale transactions (various customers)
-- - Total of 13 transactions with ~100+ line items
--
-- The data simulates a real perfume shop from January 1-9, 2025
-- Beginning inventory → Deliveries → Daily sales → Current stock
