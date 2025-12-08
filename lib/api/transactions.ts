import { supabase } from '@/lib/supabase';
import {
    CreateTransactionInput,
    Transaction,
    TransactionItem,
} from '@/lib/types';

export interface TransactionWithItems extends Transaction {
  transaction_item: TransactionItem[];
}

export async function createTransaction(
  input: CreateTransactionInput & { userId: string }
): Promise<{
  data: TransactionWithItems | null;
  error: any;
}> {
  try {
    if (!input.userId || typeof input.userId !== 'string') {
      return { data: null, error: new Error('Valid user ID is required') };
    }

    if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
      return { data: null, error: new Error('At least one transaction item is required') };
    }

    if (!['Stock In', 'Stock Out', 'Adjustment', 'Sale', 'Transfer'].includes(input.transaction_type)) {
      return { data: null, error: new Error('Invalid transaction type') };
    }

    // Validate all items before processing
    for (const item of input.items) {
      if (!item.sku || typeof item.sku !== 'string' || item.sku.trim().length === 0) {
        return { data: null, error: new Error('Valid SKU is required for all items') };
      }

      if (typeof item.quantity !== 'number' || item.quantity === 0) {
        return { data: null, error: new Error('Valid quantity is required for all items') };
      }
    }

    const sanitizedReference = input.reference?.trim() || null;
    const sanitizedNotes = input.notes?.trim() || null;
    const { data: transaction, error: transError } = await supabase
      .from('inventory_transaction')
      .insert({
        transaction_type: input.transaction_type,
        reference: sanitizedReference,
        performed_by: input.userId,
        notes: sanitizedNotes,
      })
      .select()
      .single();

    if (transError || !transaction) {
      console.error('Error creating transaction:', transError);
      return { data: null, error: transError };
    }

    const transactionItems: TransactionItem[] = [];

    for (const item of input.items) {
      const sanitizedSku = item.sku.trim().toUpperCase();

      // Fetch current product price for historical accuracy
      const { data: product, error: productError } = await supabase
        .from('product')
        .select('price')
        .eq('sku', sanitizedSku)
        .single();

      if (productError || !product) {
        console.error(`Error fetching product ${sanitizedSku}:`, productError);
        // Rollback: delete the transaction if product lookup fails
        await supabase
          .from('inventory_transaction')
          .delete()
          .eq('id', transaction.id);
        return { data: null, error: productError || new Error(`Product not found: ${sanitizedSku}`) };
      }

      // Normalize quantity: Stock Out becomes negative, Stock In positive, Adjustment stays as-is
      let quantity = item.quantity;
      if (input.transaction_type === 'Stock Out' || input.transaction_type === 'Sale') {
        quantity = -Math.abs(item.quantity);
      } else if (input.transaction_type === 'Stock In') {
        quantity = Math.abs(item.quantity);
      } else if (input.transaction_type === 'Transfer') {
        quantity = item.quantity;
      }

      const totalAmount = quantity * product.price;
      const { data: transactionItem, error: itemError } = await supabase
        .from('transaction_item')
        .insert({
          transaction_id: transaction.id,
          sku: sanitizedSku,
          quantity: quantity,
          unit_price_at_transaction: product.price,
          total_amount: totalAmount,
        })
        .select()
        .single();

      if (itemError || !transactionItem) {
        console.error('Error creating transaction item:', itemError);
        // Rollback: clean up items and transaction
        await supabase
          .from('transaction_item')
          .delete()
          .eq('transaction_id', transaction.id);
        await supabase
          .from('inventory_transaction')
          .delete()
          .eq('id', transaction.id);
        return { data: null, error: itemError };
      }

      transactionItems.push(transactionItem);
    }

    return {
      data: {
        ...transaction,
        transaction_item: transactionItems,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error in createTransaction:', error);
    return { data: null, error };
  }
}

export async function getTransactions(
  limit: number = 50,
  offset: number = 0
): Promise<{
  data: TransactionWithItems[] | null;
  error: any;
}> {
  try {
    // Prevent excessive queries
    const validatedLimit = Math.max(1, Math.min(100, limit));
    const validatedOffset = Math.max(0, offset);

    const { data, error } = await supabase
      .from('inventory_transaction')
      .select('*, transaction_item(*)')
      .order('timestamp', { ascending: false })
      .range(validatedOffset, validatedOffset + validatedLimit - 1);

    if (error) {
      console.error('Error fetching transactions:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getTransactions:', error);
    return { data: null, error };
  }
}

export async function getTransactionById(
  id: number
): Promise<{
  data: TransactionWithItems | null;
  error: any;
}> {
  try {
    if (!id || typeof id !== 'number' || id <= 0 || !Number.isInteger(id)) {
      return { data: null, error: new Error('Invalid transaction ID') };
    }

    const { data, error } = await supabase
      .from('inventory_transaction')
      .select('*, transaction_item(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching transaction by ID:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getTransactionById:', error);
    return { data: null, error };
  }
}

export async function getRecentTransactions(
  limit: number = 10
): Promise<{
  data: TransactionWithItems[] | null;
  error: any;
}> {
  try {
    const validatedLimit = Math.max(1, Math.min(100, limit));

    const { data, error } = await supabase
      .from('inventory_transaction')
      .select('*, transaction_item(*)')
      .order('timestamp', { ascending: false })
      .limit(validatedLimit);

    if (error) {
      console.error('Error fetching recent transactions:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getRecentTransactions:', error);
    return { data: null, error };
  }
}
