import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChefHat, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { restaurantOrdersQuery } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/restaurant-panel")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(restaurantOrdersQuery()),
  component: RestaurantPanelPage,
  head: () => ({ meta: [{ title: "Restaurant Panel — FoodRush" }] }),
});

const NEXT_STATUS: Record<string, string> = {
  placed: "accepted",
  accepted: "preparing",
  preparing: "out_for_delivery",
  out_for_delivery: "delivered",
};

const STATUS_LABEL: Record<string, string> = {
  placed: "Accept",
  accepted: "Start Preparing",
  preparing: "Out for Delivery",
  out_for_delivery: "Mark Delivered",
};

function RestaurantPanelPage() {
  const { user } = useAuth();
  const { data: orders } = useSuspenseQuery(restaurantOrdersQuery());
  const qc = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["restaurant-orders"] });
      toast.success("Order status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">Sign in to access the restaurant panel.</p>
        <Button asChild><Link to="/auth">Sign in</Link></Button>
      </div>
    );
  }

  const activeOrders = orders.filter((o) =>
    ["placed", "accepted", "preparing", "out_for_delivery"].includes(o.status),
  );
  const completedOrders = orders.filter((o) =>
    ["delivered", "cancelled"].includes(o.status),
  );

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16">
      <div className="mt-6 flex items-center gap-3">
        <ChefHat className="size-7 text-primary" />
        <h1 className="font-display text-4xl text-navy-deep">RESTAURANT PANEL</h1>
      </div>

      {/* Active orders */}
      <section className="mt-6">
        <h2 className="mb-3 font-semibold text-foreground">
          Active orders ({activeOrders.length})
        </h2>
        {activeOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            No active orders right now.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {activeOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onAdvance={() =>
                  updateStatus.mutate({
                    orderId: order.id,
                    status: NEXT_STATUS[order.status],
                  })
                }
                actionLabel={STATUS_LABEL[order.status]}
                isPending={updateStatus.isPending}
              />
            ))}
          </div>
        )}
      </section>

      {/* Completed orders */}
      {completedOrders.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold text-foreground">
            Completed ({completedOrders.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {completedOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function OrderCard({
  order,
  onAdvance,
  actionLabel,
  isPending,
}: {
  order: {
    id: string;
    status: string;
    total: number;
    created_at: string;
    delivery_address: string;
    order_items?: { name: string; qty: number }[];
  };
  onAdvance?: () => void;
  actionLabel?: string;
  isPending?: boolean;
}) {
  const isActive = !!onAdvance;

  return (
    <div
      className={`rounded-2xl border bg-card p-4 shadow-sm ${
        isActive ? "border-primary/30" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-mono text-muted-foreground">
          #{order.id.slice(0, 8).toUpperCase()}
        </p>
        <Badge
          variant={isActive ? "default" : "secondary"}
          className="capitalize text-xs"
        >
          {order.status.replace(/_/g, " ")}
        </Badge>
      </div>

      <ul className="mt-3 space-y-0.5 text-sm">
        {(order.order_items ?? []).map((item, i) => (
          <li key={i} className="flex justify-between text-muted-foreground">
            <span>{item.name}</span>
            <span>×{item.qty}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="size-3.5" />
          {new Date(order.created_at).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
        <span className="font-semibold text-sm">₹{order.total}</span>
      </div>

      <p className="mt-1 text-xs text-muted-foreground truncate">
        📍 {order.delivery_address}
      </p>

      {onAdvance && actionLabel && (
        <Button
          size="sm"
          className="mt-3 w-full"
          onClick={onAdvance}
          disabled={isPending}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
