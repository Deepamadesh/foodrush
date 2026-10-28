import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Leaf, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { restaurantMenuQuery } from "@/lib/queries";
import { coverFor } from "@/lib/covers";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/restaurants/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(restaurantMenuQuery(params.id)),
  component: RestaurantPage,
});

function RestaurantPage() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(restaurantMenuQuery(id));
  const { restaurant, categories, items } = data;
  const { add, items: cartItems, restaurantId } = useCart();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const visibleCategories = activeCategory
    ? categories.filter((c) => c.id === activeCategory)
    : categories;

  const itemsForCategory = (catId: string) =>
    items.filter((i) => i.category_id === catId);

  const cartQty = (itemId: string) =>
    cartItems.find((i) => i.itemId === itemId)?.qty ?? 0;

  const handleAdd = (item: typeof items[number]) => {
    if (restaurantId && restaurantId !== id && cartItems.length > 0) {
      toast.error("Your cart has items from another restaurant. Clear it first.");
      return;
    }
    add({
      itemId: item.id,
      restaurantId: id,
      name: item.name,
      price: Number(item.price),
    });
    toast.success(`${item.name} added to cart`);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16">
      {/* Back */}
      <Link to="/" className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All restaurants
      </Link>

      {/* Hero */}
      <div className="relative mt-3 overflow-hidden rounded-2xl">
        <img
          src={coverFor(restaurant.image_key)}
          alt={restaurant.name}
          className="h-52 w-full object-cover sm:h-72"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h1 className="font-display text-4xl text-background sm:text-5xl">{restaurant.name}</h1>
          <p className="mt-1 text-sm text-background/80">{restaurant.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-background/70">
            <span className="flex items-center gap-1">
              <Star className="size-3.5 fill-rating text-rating" />
              {Number(restaurant.rating).toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5 text-primary" />
              {restaurant.delivery_minutes} min
            </span>
            <span className="flex items-center gap-1">
              <Truck className="size-3.5 text-primary" />
              ₹{Number(restaurant.delivery_fee)} delivery
            </span>
            <Badge variant="secondary" className="text-xs">{restaurant.cuisine}</Badge>
          </div>
        </div>
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="scrollbar-hide mt-5 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === null
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(activeCategory === c.id ? null : c.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                activeCategory === c.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Menu sections */}
      <div className="mt-6 space-y-8">
        {visibleCategories.map((cat) => {
          const catItems = itemsForCategory(cat.id);
          if (catItems.length === 0) return null;
          return (
            <section key={cat.id}>
              <h2 className="font-display text-2xl text-navy-deep">{cat.name}</h2>
              <div className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
                {catItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block size-3.5 shrink-0 rounded-sm border-2 ${
                            item.is_veg ? "border-green-600" : "border-red-500"
                          }`}
                        >
                          <span
                            className={`block size-1.5 rounded-full m-0.5 ${
                              item.is_veg ? "bg-green-600" : "bg-red-500"
                            }`}
                          />
                        </span>
                        <span className="font-medium text-foreground">{item.name}</span>
                        {item.is_veg && (
                          <Leaf className="size-3.5 text-green-600" />
                        )}
                      </div>
                      {item.description && (
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <p className="mt-2 font-semibold text-foreground">₹{Number(item.price)}</p>
                    </div>
                    <div className="shrink-0">
                      {cartQty(item.id) > 0 ? (
                        <div className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 px-2 py-1">
                          <span className="text-sm font-semibold text-primary">
                            {cartQty(item.id)} in cart
                          </span>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => handleAdd(item)}>
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {items.length === 0 && (
        <p className="mt-16 text-center text-muted-foreground">
          No menu items available right now.
        </p>
      )}
    </div>
  );
}
