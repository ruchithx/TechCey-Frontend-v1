"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, queryKeys, request, type CartResponse } from "@/core/api";

export interface AddToCartBody {
  productId: number;
  quantity: number;
}

export function useCart() {
  return useQuery({
    queryKey: queryKeys.cart.all,
    queryFn: () => request<CartResponse>(ENDPOINTS.cart.get()),
    staleTime: 30_000,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AddToCartBody) =>
      request<CartResponse>(ENDPOINTS.cart.addItem(), { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cart.all }),
  });
}

export function useRemoveFromCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: number) =>
      request<CartResponse>(ENDPOINTS.cart.removeItem(productId), { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cart.all }),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      request<CartResponse>(ENDPOINTS.cart.updateItem(productId), {
        method: "PUT",
        body: { quantity },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cart.all }),
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => request<CartResponse>(ENDPOINTS.cart.clear(), { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cart.all }),
  });
}
