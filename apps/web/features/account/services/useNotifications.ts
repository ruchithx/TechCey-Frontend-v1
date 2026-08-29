import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ENDPOINTS,
  normalisePage,
  queryKeys,
  request,
  type NotificationListParams,
  type NotificationResponse,
  type Page,
} from "@/core/api";

/** The signed-in user's notification inbox (envelope-wrapped + PagedResponse). */
export function useNotificationList(params: NotificationListParams) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: () =>
      request<Page<NotificationResponse>>(ENDPOINTS.notifications.list(), { params: { ...params } }).then(
        (raw) => normalisePage<NotificationResponse>(raw),
      ),
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request<NotificationResponse>(ENDPOINTS.notifications.markRead(id), { method: "PATCH" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
