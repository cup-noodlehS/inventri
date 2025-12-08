-- Phase 2 Logistics + Preferences schema
-- Run inside the Supabase SQL editor or through supabase db push.

create table if not exists public.supplier (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  email text,
  phone text,
  lead_time_days integer default 7,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.purchase_order (
  id uuid primary key default gen_random_uuid(),
  reference text unique not null,
  supplier_id uuid references public.supplier(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','ordered','received','cancelled')),
  expected_date date,
  total_amount numeric(12,2) default 0,
  notes text,
  created_by uuid references public.user(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.purchase_order_item (
  id bigserial primary key,
  purchase_order_id uuid not null references public.purchase_order(id) on delete cascade,
  sku text not null references public.product(sku) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12,2) not null check (unit_cost >= 0),
  created_at timestamptz default now()
);

create table if not exists public.shipment (
  id uuid primary key default gen_random_uuid(),
  direction text not null check (direction in ('inbound','outbound')),
  carrier text,
  tracking_number text,
  status text not null default 'pending'
    check (status in ('pending','in_transit','delivered','delayed','cancelled')),
  linked_transaction_id bigint references public.inventory_transaction(id) on delete set null,
  eta timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.user(id) on delete cascade,
  default_transaction_type text default 'Stock In'
    check (default_transaction_type in ('Stock In','Stock Out','Adjustment','Sale','Transfer')),
  default_barcode_type text default 'Code128',
  low_stock_threshold integer default 5 check (low_stock_threshold >= 0),
  notify_low_stock boolean default true,
  notify_shipment_delay boolean default true,
  theme_preference text default 'system' check (theme_preference in ('system','light','dark')),
  updated_at timestamptz default now()
);

create index if not exists purchase_order_supplier_idx on public.purchase_order (supplier_id);
create index if not exists shipment_status_idx on public.shipment (status);
create index if not exists shipment_direction_idx on public.shipment (direction);

-- Triggers to keep updated_at in sync
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_purchase_order_updated_at
before update on public.purchase_order
for each row execute function public.touch_updated_at();

create trigger set_shipment_updated_at
before update on public.shipment
for each row execute function public.touch_updated_at();

create trigger set_user_preferences_updated_at
before update on public.user_preferences
for each row execute function public.touch_updated_at();
