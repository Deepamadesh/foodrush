-- FoodRush initial schema: roles, profiles, restaurants, menus + seed data

-- ===== Roles =====
create type public.app_role as enum ('admin', 'restaurant_owner', 'customer');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

create policy "Users can view own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- ===== Profiles =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Auto-create profile + customer role on signup (works for email and social)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  insert into public.user_roles (user_id, role) values (new.id, 'customer');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ===== Restaurants =====
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cuisine text not null,
  description text not null default '',
  image_key text not null default 'southindian',
  rating numeric(2,1) not null default 4.0,
  delivery_fee numeric(6,2) not null default 30,
  min_order numeric(6,2) not null default 99,
  delivery_minutes int not null default 30,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

grant select on public.restaurants to anon, authenticated;
grant all on public.restaurants to service_role;

alter table public.restaurants enable row level security;

create policy "Anyone can view restaurants"
on public.restaurants
for select
to anon, authenticated
using (true);

-- ===== Menu categories =====
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

grant select on public.menu_categories to anon, authenticated;
grant all on public.menu_categories to service_role;

alter table public.menu_categories enable row level security;

create policy "Anyone can view menu categories"
on public.menu_categories
for select
to anon, authenticated
using (true);

-- ===== Menu items =====
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  name text not null,
  description text not null default '',
  price numeric(6,2) not null,
  is_veg boolean not null default true,
  is_available boolean not null default true,
  sort_order int not null default 0
);

grant select on public.menu_items to anon, authenticated;
grant all on public.menu_items to service_role;

alter table public.menu_items enable row level security;

create policy "Anyone can view menu items"
on public.menu_items
for select
to anon, authenticated
using (true);

-- ===== Seed data =====
insert into public.restaurants (id, name, cuisine, description, image_key, rating, delivery_fee, min_order, delivery_minutes) values
  ('11111111-1111-1111-1111-111111111101', 'Dosa Junction', 'South Indian', 'Crispy dosas, fluffy idlis and strong filter coffee from a Madras-style kitchen.', 'southindian', 4.7, 25, 99, 25),
  ('11111111-1111-1111-1111-111111111102', 'Pizza Villa', 'Italian & Pizza', 'Wood-fired pizzas and pastas with fresh basil and mozzarella.', 'pizza', 4.5, 35, 149, 30),
  ('11111111-1111-1111-1111-111111111103', 'Bombay Burgers', 'Burgers & Fries', 'Smash burgers, loaded fries and thick shakes, Mumbai style.', 'burger', 4.3, 30, 99, 20),
  ('11111111-1111-1111-1111-111111111104', 'Biryani Bawarchi', 'Hyderabadi', 'Slow-cooked dum biryanis served with mirchi ka salan and raita.', 'biryani', 4.8, 40, 199, 35),
  ('11111111-1111-1111-1111-111111111105', 'Chaai Sq.', 'Snacks & Chaat', 'Samosas, pani puri and kadak masala chai for evening cravings.', 'chaat', 4.2, 20, 79, 15),
  ('11111111-1111-1111-1111-111111111106', 'Sugar & Spice', 'Desserts', 'Warm gulab jamuns, brownies and kulfi for the sweet tooth.', 'desserts', 4.6, 25, 79, 20);

insert into public.menu_categories (id, restaurant_id, name, sort_order) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Dosas', 1),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'Idli & Vada', 2),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101', 'Beverages', 3),
  ('22222222-2222-2222-2222-222222222211', '11111111-1111-1111-1111-111111111102', 'Pizzas', 1),
  ('22222222-2222-2222-2222-222222222212', '11111111-1111-1111-1111-111111111102', 'Pastas', 2),
  ('22222222-2222-2222-2222-222222222213', '11111111-1111-1111-1111-111111111102', 'Sides', 3),
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111103', 'Burgers', 1),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111103', 'Fries', 2),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111103', 'Shakes', 3),
  ('22222222-2222-2222-2222-222222222231', '11111111-1111-1111-1111-111111111104', 'Biryanis', 1),
  ('22222222-2222-2222-2222-222222222232', '11111111-1111-1111-1111-111111111104', 'Extras', 2),
  ('22222222-2222-2222-2222-222222222241', '11111111-1111-1111-1111-111111111105', 'Chaat & Snacks', 1),
  ('22222222-2222-2222-2222-222222222242', '11111111-1111-1111-1111-111111111105', 'Beverages', 2),
  ('22222222-2222-2222-2222-222222222251', '11111111-1111-1111-1111-111111111106', 'Indian Sweets', 1),
  ('22222222-2222-2222-2222-222222222252', '11111111-1111-1111-1111-111111111106', 'Bakes', 2),
  ('22222222-2222-2222-2222-222222222253', '11111111-1111-1111-1111-111111111106', 'Ice Cream', 3);

insert into public.menu_items (restaurant_id, category_id, name, description, price, is_veg, sort_order) values
  ('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 'Masala Dosa', 'Crispy crepe with spiced potato filling, sambar and chutneys', 129, true, 1),
  ('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 'Paper Dosa', 'Paper-thin two-foot dosa, crunchy and buttery', 149, true, 2),
  ('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 'Cheese Dosa', 'Masala dosa loaded with melted cheese', 179, true, 3),
  ('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222202', 'Idli Sambar (2 pc)', 'Steamed rice cakes with lentil soup and coconut chutney', 79, true, 1),
  ('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222202', 'Medu Vada (2 pc)', 'Crispy lentil donuts with sambar and chutney', 89, true, 2),
  ('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222203', 'Filter Coffee', 'Traditional South Indian filter coffee, frothy and strong', 49, true, 1),
  ('11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222203', 'Masala Chai', 'Spiced tea brewed with ginger and cardamom', 39, true, 2),
  ('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222211', 'Margherita', 'Classic tomato, fresh mozzarella and basil', 199, true, 1),
  ('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222211', 'Farmhouse', 'Peppers, mushrooms, onions and olives on a thick crust', 329, true, 2),
  ('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222211', 'Paneer Tikka Pizza', 'Char-grilled paneer tikka with mint drizzle', 359, true, 3),
  ('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222212', 'White Sauce Alfredo Pasta', 'Creamy alfredo with herbs and parmesan', 249, true, 1),
  ('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222212', 'Arrabbiata Pasta', 'Spicy tomato penne with basil and garlic', 229, true, 2),
  ('11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222213', 'Garlic Bread Sticks', 'Oven-baked sticks with herbed butter and cheese dip', 129, true, 1),
  ('11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222221', 'Classic Cheeseburger', 'Juicy patty with cheddar, lettuce and house sauce', 149, false, 1),
  ('11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222221', 'Crispy Veggie Burger', 'Golden veg patty with mayo and crunchy slaw', 119, true, 2),
  ('11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222221', 'Double Smash Burger', 'Two smashed patties, double cheese, caramelised onions', 229, false, 3),
  ('11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222222', 'Peri Peri Fries', 'Crispy fries tossed in peri peri spice', 99, true, 1),
  ('11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222222', 'Loaded Cheese Fries', 'Fries smothered in cheese sauce and jalapenos', 139, true, 2),
  ('11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222223', 'Chocolate Thick Shake', 'Belgian chocolate shake topped with whipped cream', 159, true, 1),
  ('11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222231', 'Chicken Dum Biryani', 'Slow-cooked basmati with saffron, served with salan and raita', 289, false, 1),
  ('11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222231', 'Mutton Biryani', 'Tender mutton, layered rice and fried onions', 389, false, 2),
  ('11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222231', 'Veg Dum Biryani', 'Garden vegetables and paneer in fragrant rice', 219, true, 3),
  ('11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222232', 'Mirchi ka Salan', 'Spicy chilli-peanut curry, the classic biryani side', 69, true, 1),
  ('11111111-1111-1111-1111-111111111104', '22222222-2222-2222-2222-222222222232', 'Double Ka Meetha', 'Hyderabadi bread pudding with nuts and saffron', 99, true, 2),
  ('11111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222241', 'Pani Puri (6 pc)', 'Crisp puris with spiced water, potato and tangy chutney', 69, true, 1),
  ('11111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222241', 'Samosa (2 pc)', 'Flaky pastries with spiced potato and peas', 49, true, 2),
  ('11111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222241', 'Bhel Puri', 'Puffed rice tossed with chutneys, onion and sev', 79, true, 3),
  ('11111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222242', 'Kadak Masala Chai', 'Strong cutting chai brewed with fresh spices', 39, true, 1),
  ('11111111-1111-1111-1111-111111111105', '22222222-2222-2222-2222-222222222242', 'Lemon Iced Tea', 'Chilled iced tea with lemon and mint', 89, true, 2),
  ('11111111-1111-1111-1111-111111111106', '22222222-2222-2222-2222-222222222251', 'Gulab Jamun (2 pc)', 'Warm milk dumplings in rose syrup', 89, true, 1),
  ('11111111-1111-1111-1111-111111111106', '22222222-2222-2222-2222-222222222251', 'Rasmalai (2 pc)', 'Soft cottage cheese discs in saffron milk', 129, true, 2),
  ('11111111-1111-1111-1111-111111111106', '22222222-2222-2222-2222-222222222252', 'Choco Lava Brownie', 'Fudgy brownie with a molten chocolate centre', 119, true, 1),
  ('11111111-1111-1111-1111-111111111106', '22222222-2222-2222-2222-222222222252', 'Blueberry Cheesecake Slice', 'Baked cheesecake with blueberry compote', 189, true, 2),
  ('11111111-1111-1111-1111-111111111106', '22222222-2222-2222-2222-222222222253', 'Kulfi Falooda', 'Traditional kulfi with vermicelli, rose and basil seeds', 149, true, 1);