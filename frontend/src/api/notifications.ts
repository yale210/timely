import api from "@/services/api";
import type {
  AdminAudienceCounts,
  AdminNotificationSendResponse,
  NotificationListResponse,
  NotificationType,
  PushSubscriptionPayload,
  AdminNotificationPayload,
  AdminUserRole,
  AdminUserListResponse,
  BroadcastJobSummary,
  BroadcastJobDetail,
  BroadcastJobStatusResponse,
  RetryBroadcastResponse,
} from "@/types/notification";

/**
 * Fetches paginated list of notifications for the current user.
 * @param page - The page number to fetch (defaults to 1)
 * @param filters - Optional filters to narrow the results
 * @param filters.isRead - Filter by read status
 * @param filters.notificationType - Filter by notification type
 * @returns Promise containing notification list and pagination info
 */
export const getNotifications = async (
  page = 1,
  filters?: {
    isRead?: boolean;
    notificationType?: NotificationType;
  },
): Promise<NotificationListResponse> => {
  const query = new URLSearchParams({ page: String(page) });
  if (typeof filters?.isRead === "boolean") {
    query.set("is_read", String(filters.isRead));
  }
  if (filters?.notificationType) {
    query.set("notification_type", filters.notificationType);
  }
  const response = await api.get<NotificationListResponse>(`/api/notifications/?${query.toString()}`);
  return response.data;
};

/**
 * Fetches the count of unread notifications for the current user.
 * @returns Promise containing the unread notification count
 */
export const getUnreadCount = async (): Promise<{ count: number }> => {
  const response = await api.get<{ count: number }>("/api/notifications/unread_count/");
  return response.data;
};

/**
 * Marks a specific notification as read.
 * @param id - The notification ID to mark as read
 */
export const markAsRead = async (id: number): Promise<void> => {
  await api.post(`/api/notifications/${id}/mark_read/`);
};

/**
 * Marks a specific notification as unread.
 * @param id - The notification ID to mark as unread
 */
export const markAsUnread = async (id: number): Promise<void> => {
  await api.post(`/api/notifications/${id}/mark_unread/`);
};

/**
 * Marks all notifications as read for the current user.
 */
export const markAllAsRead = async (): Promise<void> => {
  await api.post("/api/notifications/mark_all_read/");
};

/**
 * Deletes a specific notification.
 * @param id - The notification ID to delete
 */
export const deleteNotification = async (id: number): Promise<void> => {
  await api.delete(`/api/notifications/${id}/`);
};

/**
 * Deletes all notifications for the current user.
 */
export const deleteAllNotifications = async (): Promise<void> => {
  await api.delete("/api/notifications/delete_all/");
};

/**
 * Subscribes the current user to push notifications.
 * @param payload - The push subscription payload containing endpoint and keys
 */
export const subscribeToPush = async (payload: PushSubscriptionPayload): Promise<void> => {
  await api.post("/api/push/subscribe/", payload);
};

/**
 * Unsubscribes the current user from push notifications.
 * @param endpoint - The push subscription endpoint to unsubscribe
 */
export const unsubscribeFromPush = async (endpoint: string): Promise<void> => {
  await api.post("/api/push/unsubscribe/", { endpoint });
};

/**
 * Fetches the VAPID public key needed for push notification setup.
 * @returns Promise containing the VAPID public key
 */
export const getVapidPublicKey = async (): Promise<{ public_key: string }> => {
  const response = await api.get<{ public_key: string }>("/api/push/vapid_public_key/");
  return response.data;
};

/**
 * Sends a push notification to users as an admin.
 * @param payload - The notification payload including message and target users
 * @returns Promise containing the async task ID and status
 */
export const sendAdminNotification = async (
  payload: AdminNotificationPayload,
): Promise<AdminNotificationSendResponse> => {
  const response = await api.post<AdminNotificationSendResponse>(
    "/api/admin/send_notification/",
    payload,
  );
  return response.data;
};

/**
 * Fetches live audience counts for the admin send form.
 * @param userIds - Optional list of selected user IDs when target is specific users.
 * @returns Audience counts for all targeting groups.
 */
export const getAudienceCounts = async (userIds?: number[]): Promise<AdminAudienceCounts> => {
  const response = await api.get<AdminAudienceCounts>("/api/admin/audience_counts/", {
    params: {
      user_ids: userIds?.length ? userIds.join(",") : undefined,
    },
  });
  return response.data;
};

/**
 * Retrieves paginated broadcast history for admin notifications.
 * @param params - Optional filters for search and status.
 * @param params.page - The page number to fetch.
 * @param params.q - Search query string to filter by title.
 * @param params.target - Filter by target audience.
 * @param params.status - Filter by delivery status.
 * @returns A paginated list of broadcast summaries.
 */
export const getBroadcastHistory = async (params?: {
  page?: number;
  q?: string;
  target?: string;
  status?: string;
}): Promise<{
  count: number;
  next: string | null;
  previous: string | null;
  results: BroadcastJobSummary[];
}> => {
  const response = await api.get<{
    count: number;
    next: string | null;
    previous: string | null;
    results: BroadcastJobSummary[];
  }>("/api/admin/broadcasts/", {
    params: {
      page: params?.page ?? 1,
      q: params?.q ?? undefined,
      target: params?.target ?? undefined,
      status: params?.status ?? undefined,
    },
  });
  return response.data;
};

/**
 * Fetches details for a single broadcast job.
 * @param broadcastId - The broadcast job id.
 * @returns The full broadcast details including recipient-level statuses.
 */
export const getBroadcastDetail = async (broadcastId: number): Promise<BroadcastJobDetail> => {
  const response = await api.get<BroadcastJobDetail>(`/api/admin/broadcasts/${broadcastId}/`);
  return response.data;
};

/**
 * Fetches the latest delivery status counters for a broadcast job.
 * @param broadcastId - The broadcast job id.
 * @returns Current lifecycle status for the broadcast.
 */
export const getBroadcastStatus = async (broadcastId: number): Promise<BroadcastJobStatusResponse> => {
  const response = await api.get<BroadcastJobStatusResponse>(`/api/admin/broadcasts/${broadcastId}/status/`);
  return response.data;
};

/**
 * Retries failed recipients from a previous broadcast.
 * @param broadcastId - The broadcast job id to retry.
 * @returns Metadata for the retry job.
 */
export const retryFailedBroadcast = async (broadcastId: number): Promise<RetryBroadcastResponse> => {
  const response = await api.post<RetryBroadcastResponse>(`/api/admin/broadcasts/${broadcastId}/retry_failed/`);
  return response.data;
};

/**
 * Retrieves a list of users for admin notifications, with optional filtering.
 * @param params - The filtering parameters.
 * @param params.search - The search query to filter users by.
 * @param params.role - The user role to filter by.
 * @param params.page - The page number to fetch.
 * @param params.pageSize - Optional page size override.
 * @returns A promise that resolves to paginated admin user summaries.
 */
export const getAdminUsers = async (params: {
  search?: string;
  role?: AdminUserRole;
  page?: number;
  pageSize?: number;
}): Promise<AdminUserListResponse> => {
  const response = await api.get<AdminUserListResponse>("/api/admin/users/", {
    params: {
      search: params.search ?? undefined,
      // If the role is set to "all", we omit it from the request to fetch all users.
      role: params.role !== "all" ? params.role : undefined,
      page: params.page ?? 1,
      page_size: params.pageSize ?? undefined,
    },
  });
  return response.data;
};
