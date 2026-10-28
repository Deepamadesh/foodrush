-- FoodRush: orders and order_items tables

-- ===== Orders =====
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id),
  status text not null default 'placed'
    check (status in ('placed','accepted','preparing','out_for_delivery','delivered','cancelled')),
  subtotal numeric(8,2) not null,
  tax numeric(8,2) not null,
  delivery_fee numeric(8,2) not null,
  total numeric(8,2) not null,
  delivery_address text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert on public.orders to authenticated;
grant all on public.orders to service_role;

alter table public.orders enable row level security;

create policy "Users can view own orders"
on public.orders for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own orders"
on public.orders for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Restaurant owners and admins can view all orders"
on public.orders for select
to authenticated
using (
  public.has_role(auth.uid(), 'restaurant_owner') or
  public.has_role(auth.uid(), 'admin')
);

create policy "Restaurant owners and admins can update orders"
on public.orders for update
to authenticated
using (
  public.has_role(auth.uid(), 'restaurant_owner') or
  public.has_role(auth.uid(), 'admin')
);

-- ===== Order items =====
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid not null,
  name text not null,
  price numeric(6,2) not null,
  qty int not null check (qty > 0)
);

grant select, insert on public.order_items to authenticated;
grant all on public.order_items to service_role;

alter table public.order_items enable row level security;

create policy "Users can view own order items"
on public.order_items for select
to authenticated
using (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and (orders.user_id = auth.uid()
        or public.has_role(auth.uid(), 'restaurant_owner')
        or public.has_role(auth.uid(), 'admin'))
  )
);

create policy "Users can insert own order items"
on public.order_items for insert
to authenticated
with check (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);

-- Auto-update updated_at on orders
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();
