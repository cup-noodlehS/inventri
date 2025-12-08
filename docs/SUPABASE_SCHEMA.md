# Supabase Schema – Phase 2 Alignment

This document captures the current schema the mobile app expects after completing Phase 2. It combines the legacy inventory entities with the new logistics + preferences tables introduced for this milestone.

## Core Inventory

| Table | Columns (type) | Notes |
| ----- | -------------- | ----- |
| `product` | `sku (text, pk)`, `name (text)`, `category_id (int, fk category)`, `price (numeric)`, `min_stock_threshold (int)`, `barcode_value (text)`, `barcode_type (text)`, `description (text)`, `lead_time_days (int)`, `reorder_quantity (int)`, timestamps, `created_by (uuid)` | SKU is uppercase/trimmed in the app. Lead time & reorder info were added to support logistics. |
| `category` | `id (serial, pk)`, `name (text)`, `description (text)`, `created_at` | Reference data. |
| `inventory_transaction` | `id (serial, pk)`, `timestamp`, `transaction_type (Stock In/Stock Out/Adjustment/Sale/Transfer)`, `reference`, `performed_by (uuid fk user)`, `status (pending/completed/cancelled)`, `notes` | Transaction headers. |
| `transaction_item` | `id`, `transaction_id (fk)`, `sku (fk product)`, `quantity`, `unit_price_at_transaction`, `total_amount`, `note` | Quantity sign is normalized in the API. |
| `current_stock` (view) | Extends `product` with `quantity_on_hand`, `total_value`, `category_name`. | Used for dashboard + product list. |
| `user` | `id (uuid)`, `username`, `full_name`, `role_id`, `is_active`, `last_login`, timestamps | Populated after Supabase auth succeeds. |
| `role` | `id`, `name`, `description`, `created_at` | Permissions reference. |

## Logistics & Sales Extensions

| Table | Columns (type) | Notes |
| ----- | -------------- | ----- |
| `supplier` | `id (uuid)`, `name`, `contact_person`, `email`, `phone`, `lead_time_days`, `notes`, timestamps | Linked from purchase orders and optional on products. |
| `purchase_order` | `id (uuid)`, `reference`, `supplier_id (fk supplier)`, `status (draft/ordered/received/cancelled)`, `expected_date`, `total_amount`, `notes`, `created_by`, timestamps | Represents inbound replenishment. |
| `purchase_order_item` | `id`, `purchase_order_id (fk)`, `sku (fk product)`, `quantity`, `unit_cost` | Lines tied to products. |
| `shipment` | `id (uuid)`, `direction (inbound/outbound)`, `carrier`, `tracking_number`, `status (pending/in_transit/delivered/delayed/cancelled)`, `linked_transaction_id (fk inventory_transaction)`, `eta`, `notes`, timestamps | Used for logistics timeline and export scopes. |

## User Preferences

| Table | Columns (type) | Notes |
| ----- | -------------- | ----- |
| `user_preferences` | `user_id (pk, fk user)`, `default_transaction_type`, `default_barcode_type`, `low_stock_threshold` (int), `notify_low_stock` (bool), `notify_shipment_delay` (bool), `theme_preference (system/light/dark)`, `updated_at` | Synced in Settings and consumed by other tabs (e.g., default transaction type). |

## RLS & Access Expectations

- All new tables inherit Supabase row-level security using policies similar to the existing inventory tables (authenticated users can read; writes require matching `performed_by`/`user_id` or role-based grants).
- The mobile app always sends the authenticated `user.id` when mutating `purchase_order`, `shipment`, or `user_preferences`.
- Views/functions should be updated server-side to surface shipment & purchase order aggregates if needed (`inventory_kpis` view is recommended but optional).

Refer to `supabase/migrations/202402101200_phase2_logistics.sql` for the DDL introduced in this phase.
