import { supabase } from '@/lib/supabase';
import { Category } from '@/lib/types';

export async function getCategories(): Promise<{
  data: Category[] | null;
  error: any;
}> {
  try {
    const { data, error } = await supabase
      .from('category')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getCategories:', error);
    return { data: null, error };
  }
}

export async function getCategoryById(id: number): Promise<{
  data: Category | null;
  error: any;
}> {
  try {
    const { data, error } = await supabase
      .from('category')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching category by ID:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getCategoryById:', error);
    return { data: null, error };
  }
}

