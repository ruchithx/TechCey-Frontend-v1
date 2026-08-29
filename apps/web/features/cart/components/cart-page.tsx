"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { formatMoney, request, ENDPOINTS, type CartItemResponse } from "@/core/api";
import { PRODUCT_IMAGE_FALLBACK } from "@/core/config/constants";
import { useCart, useRemoveFromCart, useUpdateCartItem, useClearCart } from "../services/useCart";
import { CheckoutDialog, type CheckoutItem } from "@/features/checkout/components/checkout-dialog";

/* ------------------------------ Cart item row ----------------------------- */

function CartItem({ item }: { item: CartItemResponse }) {
  const remove = useRemoveFromCart();
  const update = useUpdateCartItem();

  return (
    <div className="flex items-start gap-4 py-4">
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
        <Image
          src={item.imageUrl ?? PRODUCT_IMAGE_FALLBACK}
          alt={item.productName}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-medium text-foreground">{item.productName}</h3>
          <p className="shrink-0 font-tabular text-sm font-semibold text-foreground">
            {formatMoney(item.subtotal)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">{formatMoney(item.unitPrice)} each</p>

        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center rounded-md border border-input">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-r-none"
              disabled={item.quantity <= 1 || update.isPending}
              onClick={() =>
                update.mutate({ productId: item.productId, quantity: item.quantity - 1 })
              }
              aria-label="Decrease quantity"
            >
              <Minus className="size-3" />
            </Button>
            <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-l-none"
              disabled={update.isPending}
              onClick={() =>
                update.mutate({ productId: item.productId, quantity: item.quantity + 1 })
              }
              aria-label="Increase quantity"
            >
              <Plus className="size-3" />
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground hover:text-destructive"
            disabled={remove.isPending}
            onClick={() => remove.mutate(item.productId)}
            aria-label={`Remove ${item.productName}`}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Main page --------------------------------- */

export function CartPage() {
  const { data: cart, isLoading, isError, error, refetch } = useCart();
  const clearCart = useClearCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [orderId, setOrderId] = useState("");

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0) return;
    try {
      // Create the order first, use the returned ID as PayHere order_id.
      const order = await request<{ id: string }>(ENDPOINTS.orders.create(), {
        method: "POST",
        body: {
          items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          shippingAddress: {
            line1: "TBD",
            line2: null,
            city: "TBD",
            state: "TBD",
            zip: "00000",
            country: "LK",
          },
        },
      });
      setOrderId(order.id);
    } catch {
      // Fallback: use a UUID-like string if order creation fails in demo.
      setOrderId(`demo-${Date.now()}`);
    }
    setCheckoutOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 py-4">
            <Skeleton className="size-20 rounded-lg" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-7 w-28 mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button variant="outline" onClick={() => refetch()}>Try again</Button>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-24 text-center">
        <ShoppingBag className="size-14 text-muted-foreground/40" aria-hidden />
        <div>
          <p className="text-lg font-semibold text-foreground">Your cart is empty</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add some products to get started.
          </p>
        </div>
        <Button asChild>
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  const checkoutItems: CheckoutItem[] = cart.items.map((i) => ({
    productId: i.productId,
    productName: i.productName,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    subtotal: i.subtotal,
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Your cart
          <span className="ml-2 text-lg font-normal text-muted-foreground">
            ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})
          </span>
        </h1>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          disabled={clearCart.isPending}
          onClick={() => clearCart.mutate()}
        >
          Clear all
        </Button>
      </div>

      {/* Items */}
      <div className="rounded-xl border border-border bg-card divide-y divide-border px-4">
        {cart.items.map((item) => (
          <CartItem key={item.productId} item={item} />
        ))}
      </div>

      {/* Order summary */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="font-semibold text-foreground">Order summary</p>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal ({cart.itemCount} items)</span>
          <span className="font-tabular font-semibold">{formatMoney(cart.totalAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-success font-medium">Free</span>
        </div>
        <div className="border-t border-border pt-3 flex justify-between font-semibold">
          <span>Total</span>
          <span className="font-tabular text-lg">{formatMoney(cart.totalAmount)}</span>
        </div>

        <Button size="lg" className="w-full" onClick={handleCheckout}>
          Proceed to checkout
        </Button>
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={checkoutItems}
        total={cart.totalAmount}
        orderId={orderId}
      />
    </div>
  );
}
