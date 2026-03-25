import { NotificationType, type Notification } from "@/types";
import type { ListConfirmationAction, NotificationFilterTab } from "@/hooks/notifications/useNotificationsPage";

interface NotificationPageContextActions {
  markRead: (id: number) => Promise<void>;
  markUnread: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

interface BulkActionOptions extends Pick<NotificationPageContextActions, "markAllRead" | "deleteAllNotifications" | "fetchNotifications"> {
  fetchPage: () => Promise<void>;
  setPage: (page: number) => void;
}

interface DeleteNotificationOptions extends Pick<NotificationPageContextActions, "deleteNotification" | "fetchNotifications"> {
  currentPage: number;
  fetchPage: () => Promise<void>;
  notificationsLength: number;
  setPage: (updater: (page: number) => number) => void;
}

/**
 * Builds the API filter for a selected notification tab.
 * @param tab - The active notification filter tab.
 */
export const buildNotificationFilter = (tab: NotificationFilterTab) => {
  if (tab === "unread") return { isRead: false };
  if (tab === "system") return { notificationType: NotificationType.SYSTEM };
  if (tab === "tasks") return { notificationType: NotificationType.TASK };
  if (tab === "calendar") return { notificationType: NotificationType.CALENDAR };
  return {};
};

/**
 * Builds the page-number window centred around the current page.
 * @param currentPage - The currently selected page.
 * @param totalPages - The total number of available pages.
 */
export const buildPaginationWindow = (currentPage: number, totalPages: number) => {
  const pages: number[] = [];
  for (let page = Math.max(1, currentPage - 2); page <= Math.min(totalPages, currentPage + 2); page += 1) {
    pages.push(page);
  }
  return pages;
};

/**
 * Opens a notification detail page after marking it as read when required.
 * @param notification - The selected notification.
 * @param actions - Shared notification context actions.
 * @param navigate - Router navigation callback.
 */
export const handleNotificationClickAction = async (
  notification: Notification,
  actions: Pick<NotificationPageContextActions, "markRead" | "fetchNotifications">,
  navigate: (path: string) => void,
) => {
  if (!notification.is_read) {
    await actions.markRead(notification.id);
  }
  await actions.fetchNotifications();
  navigate(`/notifications/${notification.id}`);
};

/**
 * Toggles a notification read state and refreshes both local and shared lists.
 * @param notification - The selected notification.
 * @param actions - Shared notification context actions.
 * @param fetchPage - Refreshes the current paginated list.
 */
export const handleToggleReadAction = async (
  notification: Notification,
  actions: Pick<NotificationPageContextActions, "markRead" | "markUnread" | "fetchNotifications">,
  fetchPage: () => Promise<void>,
) => {
  if (notification.is_read) {
    await actions.markUnread(notification.id);
  } else {
    await actions.markRead(notification.id);
  }
  await fetchPage();
  await actions.fetchNotifications();
};

/**
 * Deletes a notification and adjusts pagination when the current page empties.
 * @param notification - The notification to delete.
 * @param options - Deletion and pagination helpers.
 */
export const handleDeleteNotificationAction = async (
  notification: Notification,
  options: DeleteNotificationOptions,
) => {
  await options.deleteNotification(notification.id);
  if (options.notificationsLength === 1 && options.currentPage > 1) {
    options.setPage((page) => Math.max(1, page - 1));
  } else {
    await options.fetchPage();
  }
  await options.fetchNotifications();
};

/**
 * Runs the selected bulk notification action and refreshes shared state.
 * @param action - The selected bulk action.
 * @param options - Bulk action helpers.
 */
export const runBulkNotificationAction = async (
  action: ListConfirmationAction,
  options: BulkActionOptions,
) => {
  if (action === "mark_all_read") {
    await options.markAllRead();
    await options.fetchPage();
  }
  if (action === "delete_all") {
    await options.deleteAllNotifications();
    options.setPage(1);
  }
  await options.fetchNotifications();
};
