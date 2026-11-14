import { useQuery } from "@tanstack/react-query";
import {
  ENDPOINTS,
  normalisePage,
  queryKeys,
  request,
  type Page,
  type ProductListParams,
  type ProductResponse,
} from "@/core/api";

/** Product list (catalog grid, home's featured section). Filters live in the URL upstream. */
export function useProductList(params: ProductListParams = {}) {
  return useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: () =>
      request<Page<ProductResponse>>(ENDPOINTS.products.list(), { params: { ...params } }).then(
        (raw) => normalisePage<ProductResponse>(raw),
      ),
    staleTime: 60_000,
  });
}
