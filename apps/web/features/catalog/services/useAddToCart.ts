import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ENDPOINTS, queryKeys, request, type CartResponse } from "@/core/api";

/**
 * Add-to-cart from a product page. Deliberately a thin, catalog-owned copy of
 * cart-service's POST call rather than importing features/cart (cross-feature
 * imports are lint-banned, D5 rule 1) — both features key off the same
 * `queryKeys.cart.all`, so React Query keeps them in sync regardless.
 */
export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { productId: number; quantity: number }) =>
      request<CartResponse>(ENDPOINTS.cart.addItem(), { method: "POST", body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
    },
  });
}
