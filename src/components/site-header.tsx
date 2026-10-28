import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Package, ShoppingBag, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/lib/cart";
import { CartDrawer } from "@/components/cart-drawer";

export function SiteHeader() {
  const { user, profile, loading, signOut } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [cartOpen, setCartOpen] = useState(false);

  const firstName = (profile?.full_name ?? user?.email ?? "")
    .split(/[@ ]/)[0]
    .replace(/^\w/, (c) => c.toUpperCase());

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-baseline gap-1">
            <span className="font-display text-3xl tracking-wide text-navy-deep">FOOD</span>
            <span className="font-display text-3xl tracking-wide text-primary">RUSH</span>
          </Link>

          <div className="flex items-center gap-2">
            {user && (
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link to="/orders" className="flex items-center gap-1.5 text-sm">
                  <Package className="size-4" /> Orders
                </Link>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Cart"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag className="size-5" />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {count}
                </span>
              )}
            </Button>

            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <span className="hidden items-center gap-2 text-sm font-medium text-foreground sm:flex">
                  <UserRound className="size-4 text-primary" />
                  {firstName || "Foodie"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Sign out"
                  onClick={async () => {
                    await signOut();
                    navigate({ to: "/" });
                    toast("Signed out");
                  }}
                >
                  <LogOut className="size-4" />
                </Button>
              </div>
            ) : (
              <Button variant="hero" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
