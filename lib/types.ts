export type TransactionType = 'Stock In' | 'Stock Out' | 'Adjustment' | 'Sale' | 'Transfer';

export interface Product {
  sku: string;
  name: string;
  category_id: number | null;
  price: number;
  min_stock_threshold: number;
  barcode_value: string | null;
  barcode_type: 'code128' | 'qr' | null;
  description: string | null;
  lead_time_days?: number | null;
  reorder_quantity?: number | null;
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
  transaction_type: TransactionType;
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
  transaction_type: TransactionType;
  reference: string | null;
  notes: string | null;
  items: Array<{
    sku: string;
    quantity: number;
  }>;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  lead_time_days: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'received' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  reference: string;
  supplier_id: string | null;
  status: PurchaseOrderStatus;
  expected_date: string | null;
  total_amount: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier | null;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: string;
  sku: string;
  quantity: number;
  unit_cost: number;
}

export type ShipmentDirection = 'inbound' | 'outbound';
export type ShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'delayed' | 'cancelled';

export interface Shipment {
  id: string;
  direction: ShipmentDirection;
  carrier: string | null;
  tracking_number: string | null;
  status: ShipmentStatus;
  linked_transaction_id: number | null;
  eta: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  default_transaction_type: TransactionType;
  default_barcode_type: string;
  low_stock_threshold: number;
  notify_low_stock: boolean;
  notify_shipment_delay: boolean;
  theme_preference: 'system' | 'light' | 'dark';
  updated_at: string;
}
