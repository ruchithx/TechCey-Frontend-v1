"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/core/api/query-keys";
import type { NotificationListParams, SendNotificationRequest } from "@/core/api/types";
import {
  listFailed,
  listNotifications,
  retryNotification,
  sendNotification,
} from "@/features/notifications/api";

export function useNotificationList(params: NotificationListParams) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: ({ signal }) => listNotifications(params, signal),
    placeholderData: keepPreviousData,
  });
}

export function useFailedNotifications(page: number, size: number) {
  return useQuery({
    queryKey: queryKeys.notifications.failed(page, size),
    queryFn: ({ signal }) => listFailed(page, size, signal),
    placeholderData: keepPreviousData,
  });
}

export function useSendNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: SendNotificationRequest) => sendNotification(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}

export function useRetryNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => retryNotification(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });
}
