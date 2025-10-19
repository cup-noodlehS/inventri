export type TransactionType = 'Stock In' | 'Stock Out' | 'Adjustment';

export interface Transaction {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  type: TransactionType;
  quantity: number;
  date: Date;
  notes?: string;
}

// Sample transaction history
export const transactions: Transaction[] = [
  {
    id: 1,
    productId: 1,
    productName: 'Chanel No. 5',
    productSku: 'P001',
    type: 'Stock In',
    quantity: 20,
    date: new Date('2025-10-15T10:30:00'),
    notes: 'Initial stock',
  },
  {
    id: 2,
    productId: 2,
    productName: 'Dior Sauvage',
    productSku: 'P002',
    type: 'Stock Out',
    quantity: 5,
    date: new Date('2025-10-16T14:20:00'),
    notes: 'Customer order',
  },
  {
    id: 3,
    productId: 3,
    productName: 'Creed Aventus',
    productSku: 'P003',
    type: 'Stock In',
    quantity: 15,
    date: new Date('2025-10-17T09:15:00'),
  },
  {
    id: 4,
    productId: 4,
    productName: 'Jo Malone London',
    productSku: 'P004',
    type: 'Adjustment',
    quantity: -2,
    date: new Date('2025-10-18T16:45:00'),
    notes: 'Damaged items',
  },
];

