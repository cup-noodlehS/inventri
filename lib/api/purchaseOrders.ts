import { supabase } from '@/lib/supabase';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
} from '@/lib/types';

interface PurchaseOrderFilters {
  status?: PurchaseOrderStatus;
  supplier_id?: string;
  limit?: number;
}

export async function getPurchaseOrders(
  filters: PurchaseOrderFilters = {}
): Promise<{ data: PurchaseOrder[] | null; error: any }> {
  try {
    let query = supabase
      .from('purchase_order')
      .select('*, purchase_order_item(*), supplier(*)')
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    return { data: data as PurchaseOrder[], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function createPurchaseOrder(
  input: {
    reference: string;
    supplier_id?: string;
    expected_date?: string | null;
    notes?: string | null;
    items: Array<Pick<PurchaseOrderItem, 'sku' | 'quantity' | 'unit_cost'>>;
    created_by: string;
  }
): Promise<{ data: PurchaseOrder | null; error: any }> {
  if (!input.reference.trim()) {
    return { data: null, error: new Error('Reference is required') };
  }

  if (!input.items.length) {
    return { data: null, error: new Error('At least one line item is required') };
  }

  const sanitizedItems = input.items.map((item) => ({
    ...item,
    sku: item.sku.trim().toUpperCase(),
  }));

  const totalAmount = sanitizedItems.reduce(
    (sum, item) => sum + item.unit_cost * item.quantity,
    0
  );

  const { data: order, error } = await supabase
    .from('purchase_order')
    .insert({
      reference: input.reference.trim(),
      supplier_id: input.supplier_id || null,
      expected_date: input.expected_date || null,
      notes: input.notes || null,
      total_amount: totalAmount,
      created_by: input.created_by,
      status: 'ordered',
    })
    .select()
    .single();

  if (error || !order) {
    return { data: null, error };
  }

  const { error: itemError } = await supabase
    .from('purchase_order_item')
    .insert(
      sanitizedItems.map((item) => ({
        ...item,
        purchase_order_id: order.id,
      }))
    );

  if (itemError) {
    return { data: null, error: itemError };
  }

  return { data: order as PurchaseOrder, error: null };
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: PurchaseOrderStatus
): Promise<{ data: PurchaseOrder | null; error: any }> {
  if (!id) {
    return { data: null, error: new Error('Purchase order ID is required') };
  }

  const { data, error } = await supabase
    .from('purchase_order')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data: data as PurchaseOrder, error: null };
}
