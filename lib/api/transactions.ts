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
    // Step 1: Create the transaction
    const { data: transaction, error: transError } = await supabase
      .from('inventory_transaction')
      .insert({
        transaction_type: input.transaction_type,
        reference: input.reference,
        performed_by: input.userId,
        notes: input.notes,
      })
      .select()
      .single();

    if (transError || !transaction) {
      console.error('Error creating transaction:', transError);
      return { data: null, error: transError };
    }

    // Step 2: Create transaction items
    const transactionItems: TransactionItem[] = [];

    for (const item of input.items) {
      // Get product price
      const { data: product, error: productError } = await supabase
        .from('product')
        .select('price')
        .eq('sku', item.sku)
        .single();

      if (productError || !product) {
        console.error(`Error fetching product ${item.sku}:`, productError);
        // Rollback transaction by deleting it
        await supabase
          .from('inventory_transaction')
          .delete()
          .eq('id', transaction.id);
        return { data: null, error: productError || new Error('Product not found') };
      }

      // Calculate quantity based on transaction type
      let quantity = item.quantity;
      if (input.transaction_type === 'Stock Out') {
        quantity = -Math.abs(item.quantity);
      } else if (input.transaction_type === 'Stock In') {
        quantity = Math.abs(item.quantity);
      }
      // For Adjustment, use quantity as-is (can be positive or negative)

      // Calculate total amount
      const totalAmount = quantity * product.price;

      // Insert transaction item
      const { data: transactionItem, error: itemError } = await supabase
        .from('transaction_item')
        .insert({
          transaction_id: transaction.id,
          sku: item.sku,
          quantity: quantity,
          unit_price_at_transaction: product.price,
          total_amount: totalAmount,
        })
        .select()
        .single();

      if (itemError || !transactionItem) {
        console.error('Error creating transaction item:', itemError);
        // Rollback transaction and items
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

    // Return transaction with items
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
    const { data, error } = await supabase
      .from('inventory_transaction')
      .select('*, transaction_item(*)')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

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
    const { data, error } = await supabase
      .from('inventory_transaction')
      .select('*, transaction_item(*)')
      .order('timestamp', { ascending: false })
      .limit(limit);

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

