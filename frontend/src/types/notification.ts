export const NotificationType = {
  REMINDER: "REMINDER",
  ADMIN: "ADMIN",
  SYSTEM: "SYSTEM",
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export type AdminNotificationTarget = "all" | "staff" | "users";

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

export interface AdminNotificationPayload {
  title: string;
  message: string;
  target: AdminNotificationTarget;
  user_ids?: number[];
}

export type AdminUserRole = "all" | "users" | "staff" | "admin";

export interface AdminUserSummary {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}
