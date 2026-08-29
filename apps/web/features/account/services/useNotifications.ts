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

/** The signed-in user's notification inbox (envelope-wrapped + Spring `Page`). */
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

/** Unread IN_APP count backing the inbox header (`GET /api/v1/notifications/unread-count`). */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () =>
      request<{ unreadCount: number }>(ENDPOINTS.notifications.unreadCount()).then(
        (data) => data.unreadCount ?? 0,
      ),
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request<NotificationResponse>(ENDPOINTS.notifications.markRead(id), { method: "PATCH" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

/** Mark every IN_APP notification read (`PATCH /api/v1/notifications/read-all`). */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request<void>(ENDPOINTS.notifications.markAllRead(), { method: "PATCH" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
