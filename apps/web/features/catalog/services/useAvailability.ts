import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS, queryKeys, request, type AvailabilityResponse } from "@/core/api";

/**
 * Live stock for a single product (inventory-service, envelope-wrapped).
 * product-service's own `stock` field is a snapshot; this reflects committed
 * reservations too, so the product detail page's add-to-cart gating uses this
 * rather than `product.stock`.
 */
export function useAvailability(productId: number) {
  return useQuery({
    queryKey: queryKeys.inventory.byProductId(productId),
    queryFn: () => request<AvailabilityResponse>(ENDPOINTS.inventory.byProductId(productId)),
    enabled: Number.isFinite(productId),
    staleTime: 30_000,
  });
}
