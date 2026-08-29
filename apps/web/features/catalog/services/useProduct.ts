import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS, queryKeys, request, type ProductResponse } from "@/core/api";

export function useProduct(id: number) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => request<ProductResponse>(ENDPOINTS.products.byId(id)),
    staleTime: 60_000,
    enabled: id > 0,
  });
}
