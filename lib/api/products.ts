import { supabase } from '@/lib/supabase';
import { CurrentStock, Product } from '@/lib/types';

export async function getProducts(): Promise<{
  data: CurrentStock[] | null;
  error: any;
}> {
  try {
    const { data, error } = await supabase
      .from('current_stock')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getProducts:', error);
    return { data: null, error };
  }
}

export async function getProductBySku(sku: string): Promise<{
  data: CurrentStock | null;
  error: any;
}> {
  try {
    const { data, error } = await supabase
      .from('current_stock')
      .select('*')
      .eq('sku', sku)
      .single();

    if (error) {
      console.error('Error fetching product by SKU:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getProductBySku:', error);
    return { data: null, error };
  }
}

export async function searchProducts(query: string): Promise<{
  data: CurrentStock[] | null;
  error: any;
}> {
  try {
    const { data, error } = await supabase
      .from('current_stock')
      .select('*')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`);

    if (error) {
      console.error('Error searching products:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in searchProducts:', error);
    return { data: null, error };
  }
}

export async function createProduct(
  product: Omit<Product, 'created_at' | 'updated_at' | 'created_by'>
): Promise<{
  data: Product | null;
  error: any;
}> {
  try {
    const { data, error } = await supabase
      .from('product')
      .insert(product)
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in createProduct:', error);
    return { data: null, error };
  }
}

export async function updateProduct(
  sku: string,
  updates: Partial<Product>
): Promise<{
  data: Product | null;
  error: any;
}> {
  try {
    const { data, error } = await supabase
      .from('product')
      .update(updates)
      .eq('sku', sku)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in updateProduct:', error);
    return { data: null, error };
  }
}

export async function deleteProduct(sku: string): Promise<{
  data: boolean;
  error: any;
}> {
  try {
    const { error } = await supabase.from('product').delete().eq('sku', sku);

    if (error) {
      console.error('Error deleting product:', error);
      return { data: false, error };
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    return { data: false, error };
  }
}

