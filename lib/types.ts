export interface Product {
  sku: string;
  name: string;
  category_id: number | null;
  price: number;
  min_stock_threshold: number;
  barcode_value: string | null;
  barcode_type: 'code128' | 'qr' | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface CurrentStock extends Product {
  category_name: string | null;
  quantity_on_hand: number;
  total_value: number;
}

export interface Transaction {
  id: number;
  timestamp: string;
  transaction_type: 'Stock In' | 'Stock Out' | 'Adjustment';
  reference: string | null;
  performed_by: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes: string | null;
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

export interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  full_name: string;
  role_id: number;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface CreateTransactionInput {
  transaction_type: 'Stock In' | 'Stock Out' | 'Adjustment';
  reference: string | null;
  notes: string | null;
  items: Array<{
    sku: string;
    quantity: number;
  }>;
}

