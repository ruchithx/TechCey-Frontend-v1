"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Textarea } from "@repo/ui/components/textarea";
import { formatMoney } from "@/core/api";
import { DEFAULT_COUNTRY } from "@/core/config/constants";
import { Field } from "@/components/shared/form-field";
import { QueryState, EmptyState } from "@/components/shared/data-state";
import { useToast } from "@/components/shared/toast";
import { getErrorMessage } from "@/components/shared/error-message";
import { applyFieldErrors } from "@/components/shared/apply-field-errors";
import { checkoutSchema, type CheckoutFormValues } from "../models/checkout-schema";
import { skuFor, useCartForCheckout, useCreateOrder } from "../services/useCheckout";

const FIELDS = ["line1", "line2", "city", "state", "zip", "country", "notes"] as const;

export function CheckoutPage() {
  const { toast } = useToast();
  const cartQuery = useCartForCheckout();
  const createOrder = useCreateOrder();

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { line1: "", line2: "", city: "", state: "", zip: "", country: DEFAULT_COUNTRY, notes: "" },
  });

  const cart = cartQuery.data;
  const items = cart?.items ?? [];

  const onSubmit = form.handleSubmit(async (values) => {
    if (items.length === 0) return;
    try {
      await createOrder.mutateAsync({
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          productSku: skuFor(item.productId),
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        })),
        shippingAddress: {
          line1: values.line1,
          line2: values.line2 || null,
          city: values.city,
          state: values.state,
          zip: values.zip,
          country: values.country,
        },
        notes: values.notes || null,
      });
      toast({ title: "Order placed", variant: "success" });
    } catch (error) {
      if (!applyFieldErrors(error, form.setError, FIELDS)) {
        toast({ title: "Couldn't place order", description: getErrorMessage(error), variant: "destructive" });
      }
    }
  });

  return (
    <QueryState
      isLoading={cartQuery.isLoading}
      isError={cartQuery.isError}
      error={cartQuery.error}
      onRetry={cartQuery.refetch}
      isEmpty={items.length === 0}
      empty={
        <EmptyState
          title="Your cart is empty"
          description="Add something to your cart before checking out."
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
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <h1 className="font-display text-2xl font-bold text-foreground">Shipping address</h1>

          <Field label="Street address" htmlFor="line1" required error={form.formState.errors.line1?.message}>
            <Input id="line1" {...form.register("line1")} />
          </Field>
          <Field label="Apartment, suite, etc." htmlFor="line2" error={form.formState.errors.line2?.message}>
            <Input id="line2" {...form.register("line2")} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="City" htmlFor="city" required error={form.formState.errors.city?.message}>
              <Input id="city" {...form.register("city")} />
            </Field>
            <Field label="State" htmlFor="state" required error={form.formState.errors.state?.message}>
              <Input id="state" {...form.register("state")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="ZIP / postal code" htmlFor="zip" required error={form.formState.errors.zip?.message}>
              <Input id="zip" {...form.register("zip")} />
            </Field>
            <Field label="Country" htmlFor="country" required error={form.formState.errors.country?.message}>
              <Input id="country" {...form.register("country")} />
            </Field>
          </div>
          <Field label="Order notes" htmlFor="notes" error={form.formState.errors.notes?.message}>
            <Textarea id="notes" rows={3} {...form.register("notes")} />
          </Field>

          <Button type="submit" size="lg" disabled={createOrder.isPending} className="w-full">
            {createOrder.isPending ? "Placing order…" : "Place order"}
          </Button>
        </form>

        <div className="flex h-fit flex-col gap-3 rounded-lg border border-border bg-card p-4">
          <h2 className="font-medium text-foreground">Order summary</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-2">
                <span className="min-w-0 truncate text-muted-foreground">
                  {item.productName} × {item.quantity}
                </span>
                <span className="font-tabular text-foreground">{formatMoney(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold text-foreground">
            <span>Total</span>
            <span className="font-tabular">{formatMoney(cart?.totalPrice ?? "0.00")}</span>
          </div>
        </div>
      </div>
    </QueryState>
  );
}
