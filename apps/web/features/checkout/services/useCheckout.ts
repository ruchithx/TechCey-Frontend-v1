import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  ENDPOINTS,
  queryKeys,
  request,
  type CartResponse,
  type CreateOrderRequest,
  type OrderResponse,
  type ShippingAddress,
} from "@/core/api";

/**
 * Own thin copy of "read the cart" — cross-feature imports of features/cart are
 * lint-banned (D5 rule 1). Same `queryKeys.cart.all`, so the cache is shared.
 */
export function useCartForCheckout() {
  return useQuery({
    queryKey: queryKeys.cart.all,
    queryFn: () => request<CartResponse>(ENDPOINTS.cart.get()),
    staleTime: 10_000,
  });
}

/**
 * Places the order, then clears the now-purchased cart. Nothing in this stack
 * clears cart-service automatically when an order is created (they are
 * separate services with no saga wired between them yet), so the frontend
 * does it explicitly to avoid re-billing the same items.
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (body: CreateOrderRequest) =>
      request<OrderResponse>(ENDPOINTS.orders.create(), { method: "POST", body }),
    onSuccess: async (order) => {
      try {
        await request<void>(ENDPOINTS.cart.clear(), { method: "DELETE" });
      } finally {
        void queryClient.invalidateQueries({ queryKey: queryKeys.cart.all });
        void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
        router.push(`/orders/${order.id}`);
      }
    },
  });
}

/**
 * Product-service has no SKU field (see CreateOrderRequest's productSku), so
 * there is no real SKU to send. Using the product id as a stable stand-in
 * rather than inventing one — flagged in the audit as a backend gap.
 */
export function skuFor(productId: number): string {
  return `PRODUCT-${productId}`;
}

export type { ShippingAddress };
