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
    if (!sku || typeof sku !== 'string' || sku.trim().length === 0) {
      return { data: null, error: new Error('Invalid SKU') };
    }

    const sanitizedSku = sku.trim();

    const { data, error } = await supabase
      .from('current_stock')
      .select('*')
      .eq('sku', sanitizedSku)
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
    if (!query || typeof query !== 'string') {
      return { data: [], error: null };
    }

    const sanitizedQuery = query.trim();
    
    if (sanitizedQuery.length === 0) {
      return { data: [], error: null };
    }

    // Search both name and SKU fields
    // PostgREST handles parameterization automatically
    const searchPattern = `%${sanitizedQuery}%`;
    
    const { data, error } = await supabase
      .from('current_stock')
      .select('*')
      .or(`name.ilike.${searchPattern},sku.ilike.${searchPattern}`);

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
    if (!product.sku || !product.name) {
      return { data: null, error: new Error('SKU and name are required') };
    }

    if (typeof product.price !== 'number' || product.price < 0) {
      return { data: null, error: new Error('Price must be a positive number') };
    }

    if (typeof product.min_stock_threshold !== 'number' || product.min_stock_threshold < 0) {
      return { data: null, error: new Error('Min stock threshold must be a positive number') };
    }

    // Normalize SKU to uppercase, trim all strings
    const sanitizedProduct = {
      ...product,
      sku: product.sku.trim().toUpperCase(),
      name: product.name.trim(),
      description: product.description?.trim() || null,
      barcode_value: product.barcode_value?.trim() || null,
    };

    const { data, error } = await supabase
      .from('product')
      .insert(sanitizedProduct)
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
    if (!sku || typeof sku !== 'string' || sku.trim().length === 0) {
      return { data: null, error: new Error('Invalid SKU') };
    }

    if (updates.price !== undefined && (typeof updates.price !== 'number' || updates.price < 0)) {
      return { data: null, error: new Error('Price must be a positive number') };
    }

    if (updates.min_stock_threshold !== undefined && 
        (typeof updates.min_stock_threshold !== 'number' || updates.min_stock_threshold < 0)) {
      return { data: null, error: new Error('Min stock threshold must be a positive number') };
    }

    // Normalize string fields
    const sanitizedUpdates: Partial<Product> = {
      ...updates,
    };

    if (updates.name !== undefined) {
      sanitizedUpdates.name = updates.name.trim();
    }

    if (updates.sku !== undefined) {
      sanitizedUpdates.sku = updates.sku.trim().toUpperCase();
    }

    if (updates.description !== undefined) {
      sanitizedUpdates.description = updates.description?.trim() || null;
    }

    if (updates.barcode_value !== undefined) {
      sanitizedUpdates.barcode_value = updates.barcode_value?.trim() || null;
    }

    const sanitizedSku = sku.trim().toUpperCase();

    const { data, error } = await supabase
      .from('product')
      .update(sanitizedUpdates)
      .eq('sku', sanitizedSku)
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
    if (!sku || typeof sku !== 'string' || sku.trim().length === 0) {
      return { data: false, error: new Error('Invalid SKU') };
    }

    const sanitizedSku = sku.trim().toUpperCase();

    const { error } = await supabase.from('product').delete().eq('sku', sanitizedSku);

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

