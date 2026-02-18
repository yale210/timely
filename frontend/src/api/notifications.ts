import api from '../services/api';
import type {
  NotificationListResponse,
  PushSubscriptionPayload,
  AdminNotificationPayload,
  AdminUserRole,
  AdminUserSummary,
} from '../types/notification';

/**
 * Fetches paginated list of notifications for the current user.
 * @param page - The page number to fetch (defaults to 1)
 * @returns Promise containing notification list and pagination info
 */
export const getNotifications = async (page = 1): Promise<NotificationListResponse> => {
  const response = await api.get<NotificationListResponse>(`/api/notifications/?page=${page}`);
  return response.data;
};

/**
 * Fetches the count of unread notifications for the current user.
 * @returns Promise containing the unread notification count
 */
export const getUnreadCount = async (): Promise<{ count: number }> => {
  const response = await api.get<{ count: number }>('/api/notifications/unread_count/');
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
 * Marks all notifications as read for the current user.
 */
export const markAllAsRead = async (): Promise<void> => {
  await api.post('/api/notifications/mark_all_read/');
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
  await api.delete('/api/notifications/delete_all/');
};

/**
 * Subscribes the current user to push notifications.
 * @param payload - The push subscription payload containing endpoint and keys
 */
export const subscribeToPush = async (payload: PushSubscriptionPayload): Promise<void> => {
  await api.post('/api/push/subscribe/', payload);
};

/**
 * Unsubscribes the current user from push notifications.
 * @param endpoint - The push subscription endpoint to unsubscribe
 */
export const unsubscribeFromPush = async (endpoint: string): Promise<void> => {
  await api.post('/api/push/unsubscribe/', { endpoint });
};

/**
 * Fetches the VAPID public key needed for push notification setup.
 * @returns Promise containing the VAPID public key
 */
export const getVapidPublicKey = async (): Promise<{ public_key: string }> => {
  const response = await api.get<{ public_key: string }>('/api/push/vapid_public_key/');
  return response.data;
};

/**
 * Sends a push notification to users as an admin.
 * @param payload - The notification payload including message and target users
 * @returns Promise containing the async task ID and status
 */
export const sendAdminNotification = async (payload: AdminNotificationPayload): Promise<{ task_id: string; status: string }> => {
  const response = await api.post<{ task_id: string; status: string }>('/api/admin/send_notification/', payload);
  return response.data;
};

/**
 * Retrieves a list of users for admin notifications, with optional filtering.
 * @param params - The filtering parameters.
 * @param params.search - The search query to filter users by.
 * @param params.role - The user role to filter by.
 * @returns A promise that resolves to an array of admin user summaries.
 */
export const getAdminUsers = async (params: { search?: string; role?: AdminUserRole }): Promise<AdminUserSummary[]> => {
  const response = await api.get<AdminUserSummary[]>("/api/admin/users/", {
    params: {
      search: params.search ?? undefined,
      // If the role is set to "all", we omit it from the request to fetch all users.
      role: params.role !== "all" ? params.role : undefined,
    },
  });
  return response.data;
};
