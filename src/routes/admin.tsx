import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ShieldCheck, Users, UtensilsCrossed } from "lucide-react";
import { adminOrdersQuery } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adminOrdersQuery()),
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — FoodRush" }] }),
});

function AdminPage() {
  const { user } = useAuth();
  const { data: orders } = useSuspenseQuery(adminOrdersQuery());

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">Admin access required.</p>
        <Button asChild><Link to="/auth">Sign in</Link></Button>
      </div>
    );
  }

  const stats = {
    total: orders.length,
    active: orders.filter((o) =>
      ["placed", "accepted", "preparing", "out_for_delivery"].includes(o.status),
    ).length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    revenue: orders
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + Number(o.total), 0),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      <div className="mt-6 flex items-center gap-3">
        <ShieldCheck className="size-7 text-primary" />
        <h1 className="font-display text-4xl text-navy-deep">ADMIN PANEL</h1>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total orders", value: stats.total, icon: UtensilsCrossed },
          { label: "Active", value: stats.active, icon: Users },
          { label: "Delivered", value: stats.delivered, icon: ShieldCheck },
          { label: "Revenue", value: `₹${stats.revenue}`, icon: ShieldCheck },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-1 font-display text-3xl text-navy-deep">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* All orders table */}
      <section className="mt-8">
        <h2 className="mb-3 font-semibold">All orders</h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Restaurant</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      {order.restaurants?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">₹{order.total}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          order.status === "delivered"
                            ? "default"
                            : order.status === "cancelled"
                              ? "destructive"
                              : "secondary"
                        }
                        className="capitalize text-xs"
                      >
                        {order.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="ghost" asChild>
                        <Link to="/orders/$id" params={{ id: order.id }}>
                          View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">No orders yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
