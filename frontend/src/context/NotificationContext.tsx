import { createContext, useContext, useState, useEffect, useCallback, type ReactNode} from "react";
import {
  deleteAllNotifications as apiDeleteAllNotifications,
  deleteNotification as apiDeleteNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead as apiMarkAllAsRead,
  markAsRead as apiMarkAsRead,
  markAsUnread as apiMarkAsUnread,
} from "@/api/notifications";
import { useWebSocket } from "@/hooks/useWebSocket";
import { authStore, AUTH_CHANGE_EVENT } from "@/services/authService";
import { type Notification } from "@/types/notification";

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
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markUnread: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

/**
 * Retrieves the current notification context value, throwing if used outside a provider.
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
 * Provides notification state and actions to descendant components via context.
 * @param root0 - The component props.
 * @param root0.children - Child components that consume the notification context.
 */
export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [hasAuthToken, setHasAuthToken] = useState(() => Boolean(authStore.getToken()));
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!authStore.getToken()) {
      setNotifications([]);
      setError(null);
      return;
    }

    setLoading(true);
    try {
      const data = await getNotifications(1);
      setNotifications(data.results);
      setError(null);
    } catch (err) {
      setError("Failed to fetch notifications");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!authStore.getToken()) {
      setUnreadCount(0);
      return;
    }

    try {
      const data = await getUnreadCount();
      setUnreadCount(data.count);
    } catch (err) {
      console.error("Failed to fetch unread count", err);
    }
  }, []);

  const markRead = useCallback(
    async (id: number) => {
      try {
        const existing = notifications.find((item) => item.id === id);
        await apiMarkAsRead(id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)),
        );
        if (existing && !existing.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        } else if (!existing) {
          await fetchUnreadCount();
        }
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    },
    [fetchUnreadCount, notifications],
  );

  const markUnread = useCallback(
    async (id: number) => {
      try {
        const existing = notifications.find((item) => item.id === id);
        await apiMarkAsUnread(id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === id ? { ...item, is_read: false } : item)),
        );
        if (existing?.is_read) {
          setUnreadCount((prev) => prev + 1);
        } else if (!existing) {
          await fetchUnreadCount();
        }
      } catch (err) {
        console.error("Failed to mark notification as unread", err);
      }
    },
    [fetchUnreadCount, notifications],
  );

  const markAllRead = useCallback(async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  }, []);

  const deleteNotification = useCallback(
    async (id: number) => {
      try {
        const notificationToDelete = notifications.find((item) => item.id === id);
        await apiDeleteNotification(id);
        setNotifications((prev) => prev.filter((item) => item.id !== id));
        if (notificationToDelete && !notificationToDelete.is_read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        } else if (!notificationToDelete) {
          await fetchUnreadCount();
        }
      } catch (err) {
        console.error("Failed to delete notification", err);
      }
    },
    [fetchUnreadCount, notifications],
  );

  const deleteAllNotifications = useCallback(async () => {
    try {
      await apiDeleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to delete all notifications", err);
    }
  }, []);

  const handleWebSocketMessage = useCallback((data: unknown) => {
    const message = data as WebSocketMessage;
    if (message.type === "new_notification") {
      setNotifications((prev) => {
        const exists = prev.some((item) => item.id === message.notification.id);
        if (exists) {
          return prev;
        }
        return [message.notification, ...prev].slice(0, 20);
      });
      setUnreadCount(message.unread_count);
    } else if (message.type === "unread_count") {
      setUnreadCount(message.count);
    }
  }, []);

  useWebSocket(hasAuthToken ? "/ws/notifications/" : null, handleWebSocketMessage);

  useEffect(() => {
    const handleAuthChange = () => {
      setHasAuthToken(Boolean(authStore.getToken()));
    };
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
  }, []);

  useEffect(() => {
    if (hasAuthToken) {
      void fetchNotifications();
      void fetchUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
    }
  }, [hasAuthToken, fetchNotifications, fetchUnreadCount]);

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markRead,
    markUnread,
    markAllRead,
    deleteNotification,
    deleteAllNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
