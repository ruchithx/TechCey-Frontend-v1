import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS, queryKeys, request, type CategoryResponse } from "@/core/api";

/** Single category — CategoryPage's header. See catalog README re: no slug field yet. */
export function useCategory(id: number) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => request<CategoryResponse>(ENDPOINTS.categories.byId(id)),
    enabled: Number.isFinite(id),
    staleTime: 5 * 60_000,
  });
}
