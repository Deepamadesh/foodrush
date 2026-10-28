import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  itemId: string;
  restaurantId: string;
  name: string;
  price: number;
  qty: number;
};

type CartState = {
  items: CartItem[];
  restaurantId: string | null;
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "qty">) => "ok" | "conflict";
  updateQty: (itemId: string, qty: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartState>({
  items: [],
  restaurantId: null,
  count: 0,
  subtotal: 0,
  add: () => "ok",
  updateQty: () => {},
  clear: () => {},
});

const STORAGE_KEY = "foodrush-cart";

function loadCart(): { items: CartItem[]; restaurantId: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], restaurantId: null };
    const parsed = JSON.parse(raw);
    return { items: parsed.items ?? [], restaurantId: parsed.restaurantId ?? null };
  } catch {
    return { items: [], restaurantId: null };
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = loadCart();
    setItems(saved.items);
    setRestaurantId(saved.restaurantId);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, restaurantId }));
  }, [items, restaurantId, hydrated]);

  const add = (item: Omit<CartItem, "qty">): "ok" | "conflict" => {
    let result: "ok" | "conflict" = "ok";
    setItems((prev) => {
      if (restaurantId && item.restaurantId !== restaurantId && prev.length > 0) {
        result = "conflict";
        return prev;
      }
      const existing = prev.find((i) => i.itemId === item.itemId);
      if (existing) {
        return prev.map((i) =>
          i.itemId === item.itemId ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
    if (result === "ok" && !restaurantId) setRestaurantId(item.restaurantId);
    return result;
  };

  const updateQty = (itemId: string, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) {
        const next = prev.filter((i) => i.itemId !== itemId);
        if (next.length === 0) setRestaurantId(null);
        return next;
      }
      return prev.map((i) => (i.itemId === itemId ? { ...i, qty } : i));
    });
  };

  const clear = () => {
    setItems([]);
    setRestaurantId(null);
  };

  const value = useMemo<CartState>(() => {
    const count = items.reduce((sum, i) => sum + i.qty, 0);
    const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);
    return { items, restaurantId, count, subtotal, add, updateQty, clear };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, restaurantId, hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
