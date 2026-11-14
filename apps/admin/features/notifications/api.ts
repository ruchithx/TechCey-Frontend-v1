import { request } from "@/core/api/http";
import { ENDPOINTS } from "@/core/api/endpoints";
import { normalisePage, type Page } from "@/core/api/page";
import type {
  NotificationListParams,
  NotificationResponse,
  SendNotificationRequest,
} from "@/core/api/types";

/**
 * notification-service uses the SLIM envelope `{ success, data }` (unwrapped by
 * the HTTP layer) and returns a Spring `Page` where the current page index is
 * `.number` — normalisePage handles that.
 */

export async function listNotifications(
  params: NotificationListParams,
  signal?: AbortSignal,
): Promise<Page<NotificationResponse>> {
  const raw = await request<unknown>(ENDPOINTS.notifications.admin(), { params, signal });
  return normalisePage<NotificationResponse>(raw);
}

export async function listFailed(
  page: number,
  size: number,
  signal?: AbortSignal,
): Promise<Page<NotificationResponse>> {
  const raw = await request<unknown>(ENDPOINTS.notifications.adminFailed(), {
    params: { page, size },
    signal,
  });
  return normalisePage<NotificationResponse>(raw);
}

export function sendNotification(body: SendNotificationRequest): Promise<NotificationResponse> {
  return request<NotificationResponse>(ENDPOINTS.notifications.send(), { method: "POST", body });
}

export function retryNotification(id: string): Promise<NotificationResponse> {
  return request<NotificationResponse>(ENDPOINTS.notifications.retry(id), { method: "POST" });
}
