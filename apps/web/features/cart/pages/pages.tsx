"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { formatMoney } from "@/core/api";
import { useAuth } from "@/core/auth";
import { QueryState, EmptyState } from "@/components/shared/data-state";
import { useToast } from "@/components/shared/toast";
import { getErrorMessage } from "@/components/shared/error-message";
import { useCart } from "../services/useCart";
import { useClearCart, useRemoveCartItem, useUpdateCartItem } from "../services/useCartMutations";

export function CartPage() {
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();

  if (!authLoading && !isAuthenticated) {
    return (
      <EmptyState
        title="Sign in to view your cart"
        description="Your cart is tied to your account, so we need you signed in first."
        icon={<ShoppingCart className="size-8" />}
        action={<Button onClick={() => login("/cart")}>Sign in</Button>}
      />
    );
  }

  return <CartContent />;
}

function CartContent() {
  const { toast } = useToast();
  const cartQuery = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();

  const cart = cartQuery.data;
  const items = cart?.items ?? [];

  async function changeQuantity(productId: number, quantity: number) {
    if (quantity < 1) return;
    try {
      await updateItem.mutateAsync({ productId, quantity });
    } catch (error) {
      toast({ title: "Couldn't update quantity", description: getErrorMessage(error), variant: "destructive" });
    }
  }

  async function remove(productId: number, productName: string) {
    try {
      await removeItem.mutateAsync({ productId });
      toast({ title: "Removed from cart", description: productName });
    } catch (error) {
      toast({ title: "Couldn't remove item", description: getErrorMessage(error), variant: "destructive" });
    }
  }

  async function clear() {
    try {
      await clearCart.mutateAsync();
      toast({ title: "Cart cleared" });
    } catch (error) {
      toast({ title: "Couldn't clear cart", description: getErrorMessage(error), variant: "destructive" });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Your cart</h1>
        {items.length > 0 ? (
          <Button variant="ghost" size="sm" onClick={clear} disabled={clearCart.isPending}>
            Clear cart
          </Button>
        ) : null}
      </div>

      <QueryState
        isLoading={cartQuery.isLoading}
        isError={cartQuery.isError}
        error={cartQuery.error}
        onRetry={cartQuery.refetch}
        isEmpty={items.length === 0}
        empty={
          <EmptyState
            title="Your cart is empty"
            description="Browse the catalog and add something you like."
            icon={<ShoppingCart className="size-8" />}
            action={
              <Button asChild>
                <Link href="/products">Shop products</Link>
              </Button>
            }
          />
        }
      >
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{item.productName}</p>
                  <p className="font-tabular text-sm text-muted-foreground">{formatMoney(item.unitPrice)} each</p>
                </div>

                <div className="flex items-center gap-1 rounded-md border border-border">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Decrease quantity"
                    disabled={updateItem.isPending}
                    onClick={() => changeQuantity(item.productId, item.quantity - 1)}
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="w-6 text-center font-tabular text-sm">{item.quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Increase quantity"
                    disabled={updateItem.isPending}
                    onClick={() => changeQuantity(item.productId, item.quantity + 1)}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>

                <p className="w-20 shrink-0 text-right font-tabular font-semibold text-foreground">
                  {formatMoney(item.lineTotal)}
                </p>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove item"
                  disabled={removeItem.isPending}
                  onClick={() => remove(item.productId, item.productName)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>

          <div className="flex h-fit flex-col gap-4 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Items ({cart?.totalQuantity ?? 0})</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4 text-base font-semibold text-foreground">
              <span>Total</span>
              <span className="font-tabular">{formatMoney(cart?.totalPrice ?? "0.00")}</span>
            </div>
            <Button asChild size="lg" className="w-full">
              <Link href="/checkout">Proceed to checkout</Link>
            </Button>
          </div>
        </div>
      </QueryState>
    </div>
  );
}
