"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/core/api";
import { onLoginSuccess } from "@/core/auth";
import { useCart } from "../services/useCart";

/**
 * Fills the header's `cart-badge` slot with the current item count, and owns
 * the guest->user cart transition: cart-service has no anonymous cart, so
 * there is nothing to POST /api/cart/merge with — this just makes sure the
 * disabled, signed-out cart query refetches the moment a session exists.
 */
export function CartBadge() {
  const queryClient = useQueryClient();
  useEffect(() => onLoginSuccess(() => queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })), [
    queryClient,
  ]);

  const { data } = useCart();
  const count = data?.totalQuantity ?? 0;
  if (count <= 0) return null;

  return (
    <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
      {count > 99 ? "99+" : count}
    </span>
  );
}
