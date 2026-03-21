import { useState, useEffect, useCallback, useRef } from "react";
import {
  deleteAllNotifications as apiDeleteAllNotifications,
  deleteNotification as apiDeleteNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead as apiMarkAllAsRead,
  markAsRead as apiMarkAsRead,
  markAsUnread as apiMarkAsUnread,
} from "@/api/notifications";
import { useWebSocket } from "@/hooks/common/useWebSocket";
import { authStore, AUTH_CHANGE_EVENT } from "@/services/authService";
import { type Notification } from "@/types";

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

/**
 * Hook to manage notification logic and state.
 * @returns An object containing notification state and actions.
 */
export const useNotificationLogic = () => {
  const [hasAuthToken, setHasAuthToken] = useState(() => Boolean(authStore.getToken()));
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notificationsRef = useRef<Notification[]>([]);
  const notificationsRequestIdRef = useRef(0);
  const unreadCountRequestIdRef = useRef(0);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const fetchNotifications = useCallback(async () => {
    if (!authStore.getToken()) {
      setNotifications([]);
      setError(null);
      setLoading(false);
      return;
    }

    const requestId = ++notificationsRequestIdRef.current;
    setLoading(true);
    try {
      const data = await getNotifications(1);
      if (requestId !== notificationsRequestIdRef.current || !authStore.getToken()) {
        return;
      }
      setNotifications(data.results);
      setError(null);
    } catch (err) {
      if (requestId !== notificationsRequestIdRef.current || !authStore.getToken()) {
        return;
      }
      setError("Failed to fetch notifications");
      console.error(err);
    } finally {
      if (requestId === notificationsRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!authStore.getToken()) {
      setUnreadCount(0);
      return;
    }

    const requestId = ++unreadCountRequestIdRef.current;
    try {
      const data = await getUnreadCount();
      if (requestId !== unreadCountRequestIdRef.current || !authStore.getToken()) {
        return;
      }
      setUnreadCount(data.count);
    } catch (err) {
      if (requestId !== unreadCountRequestIdRef.current || !authStore.getToken()) {
        return;
      }
      console.error("Failed to fetch unread count", err);
    }
  }, []);

  const markRead = useCallback(
    async (id: number) => {
      try {
        await apiMarkAsRead(id);

        const existing = notificationsRef.current.find((item) => item.id === id);
        const wasUnread = existing ? !existing.is_read : null;

        setNotifications((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, is_read: true } : item,
          ),
        );

        if (existing && wasUnread) {
          setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
        } else if (!existing) {
          void fetchUnreadCount();
        }
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    },
    [fetchUnreadCount],
  );

  const markUnread = useCallback(
    async (id: number) => {
      try {
        await apiMarkAsUnread(id);

        const existing = notificationsRef.current.find((item) => item.id === id);
        const wasRead = existing ? existing.is_read : null;

        setNotifications((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, is_read: false } : item,
          ),
        );

        if (existing && wasRead) {
          setUnreadCount((prevCount) => prevCount + 1);
        } else if (!existing) {
          void fetchUnreadCount();
        }
      } catch (err) {
        console.error("Failed to mark notification as unread", err);
      }
    },
    [fetchUnreadCount],
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
        await apiDeleteNotification(id);

        const existing = notificationsRef.current.find((item) => item.id === id);

        setNotifications((prev) => prev.filter((item) => item.id !== id));

        if (existing && !existing.is_read) {
          setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
        } else if (!existing) {
          void fetchUnreadCount();
        }
      } catch (err) {
        console.error("Failed to delete notification", err);
      }
    },
    [fetchUnreadCount],
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
      notificationsRequestIdRef.current += 1;
      unreadCountRequestIdRef.current += 1;
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
      setLoading(false);
    }
  }, [hasAuthToken, fetchNotifications, fetchUnreadCount]);

  return {
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
};
