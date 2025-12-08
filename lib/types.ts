export interface Product {
  sku: string;
  name: string;
  volume_ml: number;  // Bottle size in milliliters (e.g., 65, 100, 120)
  price: number;
  min_stock_threshold: number;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CurrentStock extends Product {
  quantity_on_hand: number;
  total_value: number;
}

export type TransactionType = 'Delivery' | 'Sale';

export interface Transaction {
  id: number;
  timestamp: string;
  transaction_type: TransactionType;  // Only 'Delivery' (stock in) or 'Sale' (stock out)
  reference: string | null;
  performed_by: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes: string | null;
  customer_name: string | null;  // Optional customer name for sales
}

export interface TransactionItem {
  id: number;
  transaction_id: number;
  sku: string;
  quantity: number;
  unit_price_at_transaction: number;
  total_amount: number;
  note: string | null;
}

export interface User {
  id: string;
  username: string;
  full_name: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTransactionInput {
  transaction_type: TransactionType;  // 'Delivery' or 'Sale'
  reference: string | null;
  notes: string | null;
  customer_name?: string | null;  // Optional: for sales transactions
  items: Array<{
    sku: string;
    quantity: number;  // Positive for Delivery, negative for Sale
  }>;
}

// Ledger-style inventory data for exports
export interface InventoryLedger {
  sku: string;
  name: string;
  volume_ml: number;
  price: number;
  beginning_inventory: number;  // Stock before date range
  total_deliveries: number;  // Sum of deliveries in date range
  total_sales: number;  // Sum of sales in date range (absolute value)
  ending_inventory: number;  // Stock after date range
  inventory_value: number;  // ending_inventory * price
}

// Date range for filtering exports
export interface DateRange {
  start: Date;
  end: Date;
}

// Predefined date range options
export type DateRangePreset = 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';

