import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ENDPOINTS,
  normalisePage,
  queryKeys,
  request,
  type OrderListParams,
  type OrderResponse,
  type Page,
} from "@/core/api";

/** Order history for the current customer. Envelope-wrapped + PagedResponse. */
export function useOrderList(params: OrderListParams) {
  return useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () =>
      request<Page<OrderResponse>>(ENDPOINTS.orders.list(), { params: { ...params } }).then((raw) =>
        normalisePage<OrderResponse>(raw),
      ),
    staleTime: 30_000,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => request<OrderResponse>(ENDPOINTS.orders.byId(id)),
    enabled: Boolean(id),
  });
}

/** Only succeeds server-side when the order is still PENDING. */
export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<OrderResponse>(ENDPOINTS.orders.cancel(id), { method: "PATCH" }),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(order.id), order);
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}
