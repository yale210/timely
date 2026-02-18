import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import {
  getNotifications,
  getUnreadCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
} from "../api/notifications";
import { useWebSocket } from "../hooks/useWebSocket";
import { type Notification } from "../types/notification";

interface WebSocketNotificationMessage {
  type: "new_notification";
  notification: Notification;
  unread_count: number;
}

interface WebSocketUnreadMessage {
  type: "unread_count";
  count: number;
}

type WebSocketMessage = WebSocketNotificationMessage | WebSocketUnreadMessage;

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
  fetchNotifications: (pageNum?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

/**
 * A custom hook to access the notification context.
 *
 * This hook provides access to notification data and management functions.
 * It must be used within a NotificationProvider.
 * @returns The notification context value.
 * @throws {Error} If used outside of a NotificationProvider.
 */
export const useNotificationContext = (): NotificationContextValue => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return ctx;
};

interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * A context provider for managing notifications throughout the application.
 *
 * This component handles fetching notifications, managing unread counts,
 * and processing real-time notification updates via WebSockets.
 * @param props - The component's properties.
 * @param props.children - The children components to be wrapped by the provider.
 * @returns The rendered provider component.
 */
export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const hasPerformedInitialFetch = useRef(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchNotifications = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const data = await getNotifications(pageNum);
      if (pageNum === 1) {
        setNotifications(data.results);
      } else {
        setNotifications((prev) => [...prev, ...data.results]);
      }
      setHasMore(!!data.next);
      setPage(pageNum);
      setError(null);
    } catch (err) {
      setError("Failed to fetch notifications");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.count);
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  }, []);

  const markRead = async (id: number) => {
    try {
      await apiMarkAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const markAllRead = async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const notificationToDelete = notifications.find((n) => n.id === id);
      await apiDeleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (notificationToDelete && !notificationToDelete.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const handleWebSocketMessage = useCallback((data: unknown) => {
    const message = data as WebSocketMessage;
    if (message.type === "new_notification") {
      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === message.notification.id);
        if (exists) return prev;
        return [message.notification, ...prev];
      });
      setUnreadCount(message.unread_count);
    } else if (message.type === "unread_count") {
      setUnreadCount(message.count);
    }
  }, []);

  useWebSocket("/ws/notifications/", handleWebSocketMessage);

  useEffect(() => {
    if (hasPerformedInitialFetch.current) {
      return;
    }
    hasPerformedInitialFetch.current = true;
    void fetchNotifications(1);
    void fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    loading,
    error,
    hasMore,
    page,
    fetchNotifications,
    fetchUnreadCount,
    markRead,
    markAllRead,
    deleteNotification,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
