import type { Notification } from "@/types";

/**
 * Marks a notification as read when needed without failing the main fetch flow.
 * @param notification - The fetched notification.
 * @param markRead - The shared mark-read action.
 */
export const markNotificationReadIfNeeded = async (
  notification: Notification,
  markRead: (id: number) => Promise<void>,
) => {
  if (notification.is_read) {
    return notification;
  }

  try {
    await markRead(notification.id);
    return { ...notification, is_read: true };
  } catch (error) {
    console.error("Failed to mark notification as read", error);
    return notification;
  }
};
