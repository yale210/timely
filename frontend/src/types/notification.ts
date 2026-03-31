/**
 * Represents the various types of notifications supported by the system.
 */
export const NotificationType = {
  SYSTEM: "SYSTEM",
  TASK: "TASK",
  CALENDAR: "CALENDAR",
} as const;

/**
 * Type alias for notification categories.
 */
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

/**
 * Defines the target audience categories for administrative notifications.
 */
export type AdminNotificationTarget = "all" | "staff" | "admin" | "users";

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
 * Audience size counters returned by the admin audience-counts endpoint.
 */
export interface AdminAudienceCounts {
  all: number;
  staff: number;
  admin: number;
  selected_users: number;
}

/**
 * Lifecycle statuses a broadcast delivery job can be in.
 */
export type BroadcastDeliveryStatus =
  | "QUEUED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PARTIAL"
  | "FAILED";

/**
 * Summary of a broadcast job used in paginated history listings.
 */
export interface BroadcastJobSummary {
  id: number;
  title: string;
  target: string;
  status: BroadcastDeliveryStatus;
  recipient_count: number;
  delivered_count: number;
  failed_count: number;
  sender: number | null;
  sender_username: string | null;
  queued_at: string;
  completed_at: string | null;
}

/**
 * Per-recipient delivery details within a broadcast job.
 */
export interface BroadcastRecipientDetail {
  id: number;
  recipient: number;
  username: string;
  email: string;
  status: "PENDING" | "SENT" | "SENT_NO_PUSH" | "FAILED";
  error_code: string;
  error_message: string;
  last_attempt_at: string | null;
  notification: number | null;
}

/**
 * Full details for a broadcast job including provider errors.
 */
export interface BroadcastJobDetail {
  id: number;
  title: string;
  message: string;
  target: string;
  status: BroadcastDeliveryStatus;
  task_id: string;
  recipient_count: number;
  delivered_count: number;
  failed_count: number;
  sender: number | null;
  sender_username: string | null;
  audience_filters: Record<string, unknown>;
  audience_snapshot: {
    recipient_ids?: number[];
    recipient_count?: number;
  };
  provider_errors: {
    recipient_id: number;
    code: string;
    message: string;
  }[];
  queued_at: string;
  started_at: string | null;
  completed_at: string | null;
  retry_of: number | null;
}

/**
 * Paginated response for broadcast recipient list endpoints.
 */
export interface PaginatedBroadcastRecipientResponse {
  count: number;
  next: string | null;
  previous: string | null;
  num_pages: number;
  results: BroadcastRecipientDetail[];
}

/**
 * Polling response containing the current status counters for a broadcast job.
 */
export interface BroadcastJobStatusResponse {
  id: number;
  status: BroadcastDeliveryStatus;
  recipient_count: number;
  delivered_count: number;
  failed_count: number;
  queued_at: string;
  started_at: string | null;
  completed_at: string | null;
  task_id: string;
  updated_at: string;
}

/**
 * Response returned after successfully queuing an admin notification broadcast.
 */
export interface AdminNotificationSendResponse {
  status: BroadcastDeliveryStatus;
  broadcast_id: number;
  task_id: string;
  queued_at: string;
  recipient_count: number;
}

/**
 * Response returned after retrying failed recipients of a broadcast job.
 */
export interface RetryBroadcastResponse {
  status: BroadcastDeliveryStatus;
  broadcast_id: number;
  task_id: string;
  queued_at: string;
  recipient_count: number;
}

/**
 * Standardized API error envelope returned by the backend on failure.
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    errors?: Record<string, unknown>;
  };
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

/**
 * Browser notification permission state, or "unsupported" when the API
 * is unavailable in the current environment.
 */
export type PushPermission = NotificationPermission | "unsupported";
