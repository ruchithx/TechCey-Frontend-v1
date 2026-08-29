"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, queryKeys, request, type CartResponse } from "@/core/api";

interface AddToCartBody {
  productId: number;
  quantity: number;
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AddToCartBody) =>
      request<CartResponse>(ENDPOINTS.cart.addItem(), { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cart.all }),
  });
}
