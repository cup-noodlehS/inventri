import { supabase } from '@/lib/supabase';
import { TransactionType, UserPreferences } from '@/lib/types';

type PreferenceInput = Partial<{
  default_transaction_type: TransactionType;
  default_barcode_type: string;
  low_stock_threshold: number;
  notify_low_stock: boolean;
  notify_shipment_delay: boolean;
  theme_preference: 'system' | 'light' | 'dark';
}>;

export async function getUserPreferences(userId: string): Promise<{
  data: UserPreferences | null;
  error: any;
}> {
  if (!userId) {
    return { data: null, error: new Error('User ID is required') };
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    return { data: null, error };
  }

  if (!data) {
    return {
      data: {
        user_id: userId,
        default_transaction_type: 'Stock In',
        default_barcode_type: 'Code128',
        low_stock_threshold: 5,
        notify_low_stock: true,
        notify_shipment_delay: true,
        theme_preference: 'system',
        updated_at: new Date().toISOString(),
      },
      error: null,
    };
  }

  return { data, error: null };
}

export async function upsertUserPreferences(
  userId: string,
  payload: PreferenceInput
): Promise<{ data: UserPreferences | null; error: any }> {
  if (!userId) {
    return { data: null, error: new Error('User ID is required') };
  }

  const sanitized: PreferenceInput = { ...payload };

  if (
    sanitized.low_stock_threshold !== undefined &&
    sanitized.low_stock_threshold < 0
  ) {
    return {
      data: null,
      error: new Error('Low stock threshold must be zero or greater'),
    };
  }

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: userId,
        ...sanitized,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data, error: null };
}
