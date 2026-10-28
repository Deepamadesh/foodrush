import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Clock, Package, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ordersQuery } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/orders/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(ordersQuery()),
  component: OrdersPage,
  head: () => ({ meta: [{ title: "My Orders — FoodRush" }] }),
});

const STATUS_COLORS: Record<string, string> = {
  placed: "secondary",
  accepted: "secondary",
  preparing: "secondary",
  out_for_delivery: "default",
  delivered: "default",
  cancelled: "destructive",
};

function OrdersPage() {
  const { user } = useAuth();
  const { data: orders } = useSuspenseQuery(ordersQuery());
  const { add, clear, restaurantId } = useCart();

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">Sign in to view your orders.</p>
        <Button asChild><Link to="/auth">Sign in</Link></Button>
      </div>
    );
  }

  const handleReorder = (order: typeof orders[number]) => {
    if (restaurantId && restaurantId !== order.restaurant_id) {
      clear();
    }
    let added = 0;
    for (const item of order.order_items ?? []) {
      const result = add({
        itemId: item.menu_item_id,
        restaurantId: order.restaurant_id,
        name: item.name,
        price: Number(item.price),
      });
      if (result === "ok") added++;
    }
    if (added > 0) toast.success("Items added to cart!");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <h1 className="mt-6 font-display text-4xl text-navy-deep">MY ORDERS</h1>

      {orders.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <Package className="size-16 text-muted-foreground/30" />
          <p className="text-muted-foreground">No orders yet.</p>
          <Button asChild><Link to="/">Start ordering</Link></Button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="mt-0.5 font-semibold">
                    {order.restaurants?.name ?? "Restaurant"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {(order.order_items ?? [])
                      .map((i) => `${i.name} ×${i.qty}`)
                      .join(", ")}
                  </p>
                </div>
                <Badge variant={STATUS_COLORS[order.status] as "default" | "secondary" | "destructive" ?? "secondary"} className="shrink-0 capitalize">
                  {order.status.replace(/_/g, " ")}
                </Badge>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="font-medium text-foreground">₹{order.total}</span>
                </div>
                <div className="flex gap-2">
                  {["placed", "accepted", "preparing", "out_for_delivery"].includes(order.status) && (
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/orders/$id" params={{ id: order.id }}>Track</Link>
                    </Button>
                  )}
                  {order.status === "delivered" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReorder(order)}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="size-3.5" /> Reorder
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
