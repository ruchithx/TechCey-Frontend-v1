import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS, queryKeys, request, type CategoryResponse } from "@/core/api";

/** Full category list — small and changes rarely, so it can stay fresh longer than product data. */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => request<CategoryResponse[]>(ENDPOINTS.categories.list()),
    staleTime: 5 * 60_000,
  });
}
