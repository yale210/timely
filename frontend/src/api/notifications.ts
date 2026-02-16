import axios from 'axios';
import {
  type NotificationListResponse,
  type PushSubscriptionPayload,
  type AdminNotificationPayload,
  type AdminUserRole,
  type AdminUserSummary,
} from '../types/notification';

export const getNotifications = async (page: number = 1): Promise<NotificationListResponse> => {
  const response = await axios.get<NotificationListResponse>(`/api/notifications/?page=${page}`);
  return response.data;
};

export const getUnreadCount = async (): Promise<{ count: number }> => {
  const response = await axios.get<{ count: number }>('/api/notifications/unread_count/');
  return response.data;
};

export const markAsRead = async (id: number): Promise<void> => {
  await axios.post(`/api/notifications/${id}/mark_read/`);
};

export const markAllAsRead = async (): Promise<void> => {
  await axios.post('/api/notifications/mark_all_read/');
};

export const deleteNotification = async (id: number): Promise<void> => {
  await axios.delete(`/api/notifications/${id}/`);
};

export const deleteAllNotifications = async (): Promise<void> => {
  await axios.delete('/api/notifications/delete_all/');
};

export const subscribeToPush = async (payload: PushSubscriptionPayload): Promise<void> => {
  await axios.post('/api/push/subscribe/', payload);
};

export const unsubscribeFromPush = async (endpoint: string): Promise<void> => {
  await axios.post('/api/push/unsubscribe/', { endpoint });
};

export const getVapidPublicKey = async (): Promise<{ public_key: string }> => {
  const response = await axios.get<{ public_key: string }>('/api/push/vapid_public_key/');
  return response.data;
};

export const sendAdminNotification = async (payload: AdminNotificationPayload): Promise<{ task_id: string; status: string }> => {
  const response = await axios.post<{ task_id: string; status: string }>('/api/admin/send_notification/', payload);
  return response.data;
};

export const getAdminUsers = async (params: { search?: string; role?: AdminUserRole }): Promise<AdminUserSummary[]> => {
  const response = await axios.get<AdminUserSummary[]>('/api/authentication/admin/users/', {
    params: {
      search: params.search || undefined,
      role: params.role && params.role !== "all" ? params.role : undefined,
    },
  });
  return response.data;
};
