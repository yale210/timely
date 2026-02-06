export enum NotificationType {
  REMINDER = 'REMINDER',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
}

export interface Notification {
  id: number;
  recipient: number;
  sender: number | null;
  sender_username: string | null;
  title: string;
  message: string;
  is_read: boolean;
  timestamp: string;
  notification_type: NotificationType;
}

export interface NotificationListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}

export interface PushSubscriptionPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
}
