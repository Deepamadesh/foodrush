import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
  head: () => ({ meta: [{ title: "Checkout — FoodRush" }] }),
});

const schema = z.object({
  address_line: z.string().min(5, "Enter your street address"),
  city: z.string().min(2, "Enter your city"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  phone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
});

type CheckoutForm = z.infer<typeof schema>;

const TAX_RATE = 0.05;
const DELIVERY_FEE = 40;

function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal, restaurantId, clear } = useCart();
  const navigate = useNavigate();

  const tax = Math.round(subtotal * TAX_RATE);
  const total = subtotal + tax + DELIVERY_FEE;

  const form = useForm<CheckoutForm>({ resolver: zodResolver(schema) });

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">Sign in to place your order.</p>
        <Button asChild><Link to="/auth">Sign in</Link></Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button asChild variant="outline"><Link to="/">Browse restaurants</Link></Button>
      </div>
    );
  }

  const onSubmit = async (values: CheckoutForm) => {
    if (!restaurantId) return;

    const deliveryAddress = `${values.address_line}, ${values.city} - ${values.pincode}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        restaurant_id: restaurantId,
        status: "placed",
        subtotal,
        tax,
        delivery_fee: DELIVERY_FEE,
        total,
        delivery_address: deliveryAddress,
        phone: values.phone,
      })
      .select()
      .single();

    if (orderError || !order) {
      toast.error("Failed to place order. Please try again.");
      return;
    }

    const orderItems = items.map((i) => ({
      order_id: order.id,
      menu_item_id: i.itemId,
      name: i.name,
      price: i.price,
      qty: i.qty,
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    if (itemsError) {
      toast.error("Order created but items failed. Contact support.");
      return;
    }

    clear();
    toast.success("Order placed successfully!");
    navigate({ to: "/orders/$id", params: { id: order.id } });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16">
      <Link to="/" className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back
      </Link>

      <h1 className="mt-4 font-display text-4xl text-navy-deep">CHECKOUT</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Delivery form */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 lg:col-span-3"
        >
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <MapPin className="size-4 text-primary" /> Delivery address
            </h2>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="address_line">Street address</Label>
                <Input id="address_line" placeholder="123, MG Road" {...form.register("address_line")} />
                {form.formState.errors.address_line && (
                  <p className="text-xs text-destructive">{form.formState.errors.address_line.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="Bengaluru" {...form.register("city")} />
                  {form.formState.errors.city && (
                    <p className="text-xs text-destructive">{form.formState.errors.city.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" placeholder="560001" maxLength={6} {...form.register("pincode")} />
                  {form.formState.errors.pincode && (
                    <p className="text-xs text-destructive">{form.formState.errors.pincode.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" placeholder="9876543210" maxLength={10} {...form.register("phone")} />
                {form.formState.errors.phone && (
                  <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Place order · ₹{total}
          </Button>
        </form>

        {/* Order summary */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 font-semibold">Order summary</h2>
            <ul className="space-y-2 text-sm">
              {items.map((item) => (
                <li key={item.itemId} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {item.name} × {item.qty}
                  </span>
                  <span>₹{item.qty * item.price}</span>
                </li>
              ))}
            </ul>
            <Separator className="my-3" />
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>GST (5%)</span><span>₹{tax}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span><span>₹{DELIVERY_FEE}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-foreground">
                <span>Total</span><span>₹{total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
