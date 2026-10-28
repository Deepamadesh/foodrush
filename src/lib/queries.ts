import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Restaurant = Awaited<ReturnType<typeof fetchRestaurants>>[number];
export type MenuData = Awaited<ReturnType<typeof fetchMenu>>;

async function fetchRestaurants() {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("is_open", true)
    .order("rating", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function fetchMenu(id: string) {
  const [restaurantResult, categoriesResult, itemsResult] = await Promise.all([
    supabase.from("restaurants").select("*").eq("id", id).single(),
    supabase
      .from("menu_categories")
      .select("*")
      .eq("restaurant_id", id)
      .order("sort_order"),
    supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", id)
      .eq("is_available", true)
      .order("sort_order"),
  ]);
  if (restaurantResult.error) throw restaurantResult.error;
  if (categoriesResult.error) throw categoriesResult.error;
  if (itemsResult.error) throw itemsResult.error;
  return {
    restaurant: restaurantResult.data,
    categories: categoriesResult.data ?? [],
    items: itemsResult.data ?? [],
  };
}

async function fetchOrder(id: string) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), restaurants(name)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

async function fetchOrders() {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), restaurants(name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function fetchRestaurantOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), restaurants(name)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

async function fetchAdminOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), restaurants(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export const restaurantsQuery = queryOptions({
  queryKey: ["restaurants"],
  queryFn: fetchRestaurants,
});

export const restaurantMenuQuery = (id: string) =>
  queryOptions({
    queryKey: ["restaurant-menu", id],
    queryFn: () => fetchMenu(id),
  });

export const orderQuery = (id: string) =>
  queryOptions({
    queryKey: ["order", id],
    queryFn: () => fetchOrder(id),
  });

export const ordersQuery = () =>
  queryOptions({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

export const restaurantOrdersQuery = () =>
  queryOptions({
    queryKey: ["restaurant-orders"],
    queryFn: fetchRestaurantOrders,
  });

export const adminOrdersQuery = () =>
  queryOptions({
    queryKey: ["admin-orders"],
    queryFn: fetchAdminOrders,
  });
