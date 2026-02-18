/**
 * Represents the various types of notifications supported by the system.
 */
export const NotificationType = {
  REMINDER: "REMINDER",
  ADMIN: "ADMIN",
  SYSTEM: "SYSTEM",
} as const;

/**
 * Type alias for notification categories.
 */
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

/**
 * Defines the target audience categories for administrative notifications.
 */
export type AdminNotificationTarget = "all" | "staff" | "users";

/**
 * Represents a single notification record from the backend.
 */
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

/**
 * The structure of a paginated list response for notifications.
 */
export interface NotificationListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}

/**
 * Payload data required to register or update a push notification subscription.
 */
export interface PushSubscriptionPayload {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Data structure for creating a new administrative notification.
 */
export interface AdminNotificationPayload {
  title: string;
  message: string;
  target: AdminNotificationTarget;
  user_ids?: number[];
}

/**
 * Possible roles for filtering users in the administrative interface.
 */
export type AdminUserRole = "all" | "users" | "staff" | "admin";

/**
 * A concise summary of a user's account information for administrative views.
 */
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

/**
 * Paginated response payload for admin user listing endpoints.
 */
export interface AdminUserListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: AdminUserSummary[];
}
