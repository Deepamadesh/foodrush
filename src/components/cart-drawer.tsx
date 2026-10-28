import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

const TAX_RATE = 0.05;
const DELIVERY_FEE = 40;

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, subtotal, updateQty, clear } = useCart();

  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax + (items.length > 0 ? DELIVERY_FEE : 0);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display text-2xl">
            <ShoppingBag className="size-5 text-primary" />
            Your Cart
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <ShoppingBag className="size-16 text-muted-foreground/30" />
            <p className="text-muted-foreground">Your cart is empty</p>
            <Button variant="outline" onClick={onClose} asChild>
              <Link to="/">Browse restaurants</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-2">
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item.itemId} className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQty(item.itemId, item.qty - 1)}
                        className="flex size-7 items-center justify-center rounded-full border border-border bg-card hover:bg-accent"
                        aria-label="Decrease quantity"
                      >
                        {item.qty === 1 ? (
                          <Trash2 className="size-3.5 text-destructive" />
                        ) : (
                          <Minus className="size-3.5" />
                        )}
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.itemId, item.qty + 1)}
                        className="flex size-7 items-center justify-center rounded-full border border-border bg-card hover:bg-accent"
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    <p className="w-16 text-right text-sm font-semibold">
                      ₹{item.qty * item.price}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST (5%)</span>
                  <span>₹{tax}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery fee</span>
                  <span>₹{DELIVERY_FEE}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>

              <Button className="w-full" size="lg" asChild onClick={onClose}>
                <Link to="/checkout">Proceed to checkout</Link>
              </Button>
              <button
                onClick={clear}
                className="w-full text-center text-xs text-muted-foreground hover:text-destructive"
              >
                Clear cart
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
