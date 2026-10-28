import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Circle, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { orderQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/orders/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(orderQuery(params.id)),
  component: OrderTrackingPage,
  head: () => ({ meta: [{ title: "Track Order — FoodRush" }] }),
});

const STATUSES = [
  { key: "placed", label: "Order Placed", icon: "🧾" },
  { key: "accepted", label: "Accepted", icon: "✅" },
  { key: "preparing", label: "Preparing", icon: "👨‍🍳" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: "🛵" },
  { key: "delivered", label: "Delivered", icon: "🎉" },
] as const;

type OrderStatus = (typeof STATUSES)[number]["key"];

function OrderTrackingPage() {
  const { id } = Route.useParams();
  const { data: initialOrder } = useSuspenseQuery(orderQuery(id));
  const [status, setStatus] = useState<OrderStatus>(
    initialOrder.status as OrderStatus,
  );
  const [updatedAt, setUpdatedAt] = useState(initialOrder.updated_at);

  useEffect(() => {
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          const updated = payload.new as { status: OrderStatus; updated_at: string };
          setStatus(updated.status);
          setUpdatedAt(updated.updated_at);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const currentIndex = STATUSES.findIndex((s) => s.key === status);
  const isDelivered = status === "delivered";

  return (
    <div className="mx-auto max-w-lg px-4 pb-16">
      <Link
        to="/orders"
        className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> My orders
      </Link>

      <div className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl text-navy-deep">ORDER TRACKING</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Order #{id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <Badge
            variant={isDelivered ? "default" : "secondary"}
            className="capitalize"
          >
            {status.replace(/_/g, " ")}
          </Badge>
        </div>

        {/* Timeline */}
        <div className="mt-8 space-y-0">
          {STATUSES.map((step, idx) => {
            const isDone = idx <= currentIndex;
            const isCurrent = idx === currentIndex;
            const isLast = idx === STATUSES.length - 1;

            return (
              <div key={step.key} className="flex gap-4">
                {/* Connector */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-base transition-all duration-500 ${
                      isDone
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {isCurrent && !isDelivered ? (
                      <Loader2 className="size-4 animate-spin text-primary" />
                    ) : isDone ? (
                      <CheckCircle2 className="size-4 text-primary" />
                    ) : (
                      <Circle className="size-4" />
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={`w-0.5 flex-1 transition-all duration-700 ${
                        idx < currentIndex ? "bg-primary" : "bg-border"
                      }`}
                      style={{ minHeight: "2rem" }}
                    />
                  )}
                </div>

                {/* Label */}
                <div className={`pb-6 pt-1.5 ${isLast ? "pb-0" : ""}`}>
                  <p
                    className={`text-sm font-medium ${
                      isDone ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {step.icon} {step.label}
                  </p>
                  {isCurrent && (
                    <p className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(updatedAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {isDelivered && (
          <div className="mt-6 rounded-xl bg-primary/10 p-4 text-center">
            <p className="font-semibold text-primary">Enjoy your meal! 🍽️</p>
          </div>
        )}
      </div>

      {/* Order details */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 font-semibold">Order details</h2>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{initialOrder.subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">GST</span>
            <span>₹{initialOrder.tax}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery</span>
            <span>₹{initialOrder.delivery_fee}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>₹{initialOrder.total}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          📍 {initialOrder.delivery_address}
        </p>
      </div>

      <Button variant="outline" className="mt-4 w-full" asChild>
        <Link to="/">Order more food</Link>
      </Button>
    </div>
  );
}
