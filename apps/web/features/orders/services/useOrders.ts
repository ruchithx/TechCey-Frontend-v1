import { useQuery } from "@tanstack/react-query";
import {
  ENDPOINTS,
  normalisePage,
  queryKeys,
  request,
  type OrderListParams,
  type OrderResponse,
  type Page,
} from "@/core/api";

export function useOrders(params: OrderListParams = {}) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () =>
      request<Page<OrderResponse>>(ENDPOINTS.orders.list(), {
        params: params as Record<string, string | number | boolean | undefined | null>,
      }).then((raw) => normalisePage<OrderResponse>(raw)),
    staleTime: 30_000,
  });
}
