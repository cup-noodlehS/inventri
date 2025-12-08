import { supabase } from '@/lib/supabase';
import { Shipment, ShipmentDirection, ShipmentStatus } from '@/lib/types';

interface ShipmentFilters {
  direction?: ShipmentDirection;
  status?: ShipmentStatus;
  limit?: number;
}

export async function getShipments(
  filters: ShipmentFilters = {}
): Promise<{ data: Shipment[] | null; error: any }> {
  try {
    let query = supabase
      .from('shipment')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.direction) {
      query = query.eq('direction', filters.direction);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      return { data: null, error };
    }

    return { data: data as Shipment[], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function createShipment(
  payload: Omit<Shipment, 'id' | 'created_at' | 'updated_at'>
): Promise<{ data: Shipment | null; error: any }> {
  const { data, error } = await supabase
    .from('shipment')
    .insert(payload)
    .select()
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data: data as Shipment, error: null };
}

export async function updateShipmentStatus(
  id: string,
  status: ShipmentStatus,
  updates: Partial<Pick<Shipment, 'carrier' | 'tracking_number' | 'eta' | 'notes'>> = {}
): Promise<{ data: Shipment | null; error: any }> {
  if (!id) {
    return { data: null, error: new Error('Shipment ID is required') };
  }

  const { data, error } = await supabase
    .from('shipment')
    .update({ status, ...updates })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error };
  }

  return { data: data as Shipment, error: null };
}
