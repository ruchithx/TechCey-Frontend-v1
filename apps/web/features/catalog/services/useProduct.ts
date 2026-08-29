import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS, queryKeys, request, type ProductResponse } from "@/core/api";

/** Single product detail. */
export function useProduct(id: number) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => request<ProductResponse>(ENDPOINTS.products.byId(id)),
    enabled: Number.isFinite(id),
    staleTime: 60_000,
  });
}
