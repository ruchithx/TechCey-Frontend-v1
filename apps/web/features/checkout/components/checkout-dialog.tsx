"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { env } from "@/core/config/env";
import { formatMoney } from "@/core/api";
import type { Money } from "@/core/api";

/* -------------------------------------------------------------------------- */

export interface CheckoutItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: Money;
  subtotal: Money;
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CheckoutItem[];
  total: Money;
  /** Resolved order ID to use as PayHere order_id (UUID from order-service). */
  orderId: string;
}

interface CustomerForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

const EMPTY_FORM: CustomerForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
};

/* -------------------------------------------------------------------------- */

declare global {
  interface Window {
    payhere: {
      startPayment: (payment: Record<string, unknown>) => void;
      onCompleted: (orderId: string) => void;
      onDismissed: () => void;
      onError: (error: string) => void;
    };
  }
}

/* -------------------------------------------------------------------------- */

export function CheckoutDialog({
  open,
  onOpenChange,
  items,
  total,
  orderId,
}: CheckoutDialogProps) {
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const scriptSrc = env.payhereSandbox
    ? "https://www.payhere.lk/lib/payhere.js"
    : "https://www.payhere.lk/lib/payhere.js";

  const field = (key: keyof CustomerForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handlePay = async () => {
    if (!scriptReady || !window.payhere) {
      setError("Payment system is still loading. Please try again.");
      return;
    }

    const missingFields = (["firstName", "lastName", "email", "phone", "address", "city"] as const).filter(
      (k) => !form[k].trim(),
    );
    if (missingFields.length > 0) {
      setError("Please fill in all required fields.");
      return;
    }

    setError(null);
    setPaying(true);

    try {
      const amount = parseFloat(total).toFixed(2);
      const currency = "USD";

      // Fetch hash from the server-side API route (merchant_secret never leaves server).
      const hashRes = await fetch("/api/payhere-hash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: env.payhereMerchantId,
          order_id: orderId,
          amount,
          currency,
        }),
      });

      if (!hashRes.ok) {
        const body = (await hashRes.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Failed to initialise payment");
      }

      const { hash } = (await hashRes.json()) as { hash: string };

      const itemsSummary = items.map((i) => `${i.productName} x${i.quantity}`).join(", ");

      window.payhere.onCompleted = (completedOrderId) => {
        setPaying(false);
        onOpenChange(false);
        window.location.href = `/orders?paid=${completedOrderId}`;
      };
      window.payhere.onDismissed = () => setPaying(false);
      window.payhere.onError = (err) => {
        setPaying(false);
        setError(`Payment error: ${err}`);
      };

      window.payhere.startPayment({
        sandbox: env.payhereSandbox,
        merchant_id: env.payhereMerchantId,
        return_url: `${window.location.origin}/orders`,
        cancel_url: `${window.location.origin}/cart`,
        notify_url: `${env.apiBaseUrl}/api/v1/payments/webhook`,
        order_id: orderId,
        items: itemsSummary,
        amount,
        currency,
        hash,
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        country: "LK",
      });
    } catch (err) {
      setPaying(false);
      setError(err instanceof Error ? err.message : "Payment setup failed. Please try again.");
    }
  };

  return (
    <>
      {/* Load PayHere JS once globally */}
      <Script
        src={scriptSrc}
        strategy="lazyOnload"
        onLoad={() => setScriptReady(true)}
        onError={() => setError("Failed to load payment system.")}
      />

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
          </DialogHeader>

          {/* Order summary */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Order summary</p>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-foreground">
                    {item.productName}
                    <span className="ml-1 text-muted-foreground">× {item.quantity}</span>
                  </span>
                  <span className="font-medium tabular-nums">{formatMoney(item.subtotal)}</span>
                </div>
              ))}
              <div className="mt-2 border-t border-border pt-2 flex justify-between text-sm font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(total)}</span>
              </div>
            </div>
          </div>

          {/* Shipping / customer form */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Your details</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ph-first">First name</Label>
                <Input id="ph-first" placeholder="Sam" {...field("firstName")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ph-last">Last name</Label>
                <Input id="ph-last" placeholder="Smith" {...field("lastName")} />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="ph-email">Email</Label>
              <Input id="ph-email" type="email" placeholder="sam@example.com" {...field("email")} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="ph-phone">Phone</Label>
              <Input id="ph-phone" type="tel" placeholder="+94 77 000 0000" {...field("phone")} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="ph-address">Address</Label>
              <Input id="ph-address" placeholder="123 Main Street" {...field("address")} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="ph-city">City</Label>
              <Input id="ph-city" placeholder="Colombo" {...field("city")} />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            className="w-full"
            size="lg"
            onClick={handlePay}
            disabled={paying || !scriptReady}
          >
            {paying ? "Redirecting to PayHere…" : !scriptReady ? "Loading payment…" : "Pay with PayHere"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Secured by PayHere · Your card details are never shared with us
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
