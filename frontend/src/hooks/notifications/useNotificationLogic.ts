import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

interface NotificationStateHandlers {
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

interface NotificationRequestRefs {
  notificationsRef: React.MutableRefObject<Notification[]>;
  notificationsRequestIdRef: React.MutableRefObject<number>;
  unreadCountRequestIdRef: React.MutableRefObject<number>;
}

const resetNotificationState = (
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>,
  setLoading: React.Dispatch<React.SetStateAction<boolean>>,
) => {
  setNotifications([]);
  setUnreadCount(0);
  setError(null);
  setLoading(false);
};

const isStaleRequest = (requestId: number, currentRequestId: React.MutableRefObject<number>) => requestId !== currentRequestId.current || !authStore.getToken();

const updateNotificationReadState = (notifications: Notification[], id: number, isRead: boolean) => notifications.map((item) => (item.id === id ? { ...item, is_read: isRead } : item));

const applyReadUpdate = (
  id: number,
  isRead: boolean,
  notificationsRef: React.MutableRefObject<Notification[]>,
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>,
  fetchUnreadCount: () => Promise<void>,
) => {
  const existing = notificationsRef.current.find((item) => item.id === id);
  setNotifications((previous) => updateNotificationReadState(previous, id, isRead));
  if (!existing) {
    void fetchUnreadCount();
    return;
  }
  if (existing.is_read !== isRead) {
    setUnreadCount((count) => (isRead ? Math.max(0, count - 1) : count + 1));
  }
};

const applyDeleteUpdate = (
  id: number,
  notificationsRef: React.MutableRefObject<Notification[]>,
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>,
  fetchUnreadCount: () => Promise<void>,
) => {
  const existing = notificationsRef.current.find((item) => item.id === id);
  setNotifications((previous) => previous.filter((item) => item.id !== id));
  if (!existing) {
    void fetchUnreadCount();
    return;
  }
  if (!existing.is_read) {
    setUnreadCount((count) => Math.max(0, count - 1));
  }
};

const mergeWebSocketNotification = (notifications: Notification[], notification: Notification) => {
  if (notifications.some((item) => item.id === notification.id)) {
    return notifications;
  }
  return [notification, ...notifications].slice(0, 20);
};

const bumpRequestIds = (refs: NotificationRequestRefs) => {
  refs.notificationsRequestIdRef.current += 1;
  refs.unreadCountRequestIdRef.current += 1;
};

const useHasAuthToken = () => {
  const [hasAuthToken, setHasAuthToken] = useState(() => Boolean(authStore.getToken()));
  useEffect(() => {
    const handleAuthChange = () => { setHasAuthToken(Boolean(authStore.getToken())); };
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
  }, []);
  return hasAuthToken;
};

const useNotificationState = () => {
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

  return {
    notifications,
    unreadCount,
    loading,
    error,
    setNotifications,
    setUnreadCount,
    setLoading,
    setError,
    notificationsRef,
    notificationsRequestIdRef,
    unreadCountRequestIdRef,
  };
};

const useFetchNotifications = (handlers: NotificationStateHandlers, refs: NotificationRequestRefs) => useCallback(async () => {
  if (!authStore.getToken()) {
    resetNotificationState(handlers.setNotifications, handlers.setUnreadCount, handlers.setError, handlers.setLoading);
    return;
  }

  const requestId = ++refs.notificationsRequestIdRef.current;
  handlers.setLoading(true);
  try {
    const data = await getNotifications(1);
    if (isStaleRequest(requestId, refs.notificationsRequestIdRef)) return;
    handlers.setNotifications(data.results);
    handlers.setError(null);
  } catch (error) {
    if (isStaleRequest(requestId, refs.notificationsRequestIdRef)) return;
    handlers.setError("Failed to fetch notifications");
    console.error(error);
  } finally {
    if (requestId === refs.notificationsRequestIdRef.current) handlers.setLoading(false);
  }
}, [handlers, refs]);

const useFetchUnreadCount = (setUnreadCount: React.Dispatch<React.SetStateAction<number>>, unreadCountRequestIdRef: React.MutableRefObject<number>) => useCallback(async () => {
  if (!authStore.getToken()) {
    setUnreadCount(0);
    return;
  }

  const requestId = ++unreadCountRequestIdRef.current;
  try {
    const data = await getUnreadCount();
    if (isStaleRequest(requestId, unreadCountRequestIdRef)) return;
    setUnreadCount(data.count);
  } catch (error) {
    if (isStaleRequest(requestId, unreadCountRequestIdRef)) return;
    console.error("Failed to fetch unread count", error);
  }
}, [setUnreadCount, unreadCountRequestIdRef]);

const useNotificationQueries = (handlers: NotificationStateHandlers, refs: NotificationRequestRefs) => {
  const fetchNotifications = useFetchNotifications(handlers, refs);
  const fetchUnreadCount = useFetchUnreadCount(handlers.setUnreadCount, refs.unreadCountRequestIdRef);
  return { fetchNotifications, fetchUnreadCount };
};

const useMarkRead = (
  refs: NotificationRequestRefs,
  handlers: Pick<NotificationStateHandlers, "setNotifications" | "setUnreadCount">,
  fetchUnreadCount: () => Promise<void>,
) => useCallback(async (id: number) => {
  try {
    await apiMarkAsRead(id);
    applyReadUpdate(id, true, refs.notificationsRef, handlers.setNotifications, handlers.setUnreadCount, fetchUnreadCount);
  } catch (error) {
    console.error("Failed to mark notification as read", error);
  }
}, [fetchUnreadCount, handlers.setNotifications, handlers.setUnreadCount, refs.notificationsRef]);

const useMarkUnread = (
  refs: NotificationRequestRefs,
  handlers: Pick<NotificationStateHandlers, "setNotifications" | "setUnreadCount">,
  fetchUnreadCount: () => Promise<void>,
) => useCallback(async (id: number) => {
  try {
    await apiMarkAsUnread(id);
    applyReadUpdate(id, false, refs.notificationsRef, handlers.setNotifications, handlers.setUnreadCount, fetchUnreadCount);
  } catch (error) {
    console.error("Failed to mark notification as unread", error);
  }
}, [fetchUnreadCount, handlers.setNotifications, handlers.setUnreadCount, refs.notificationsRef]);

const useMarkAllRead = (setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>, setUnreadCount: React.Dispatch<React.SetStateAction<number>>) => useCallback(async () => {
  try {
    await apiMarkAllAsRead();
    setNotifications((previous) => previous.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);
  } catch (error) {
    console.error("Failed to mark all notifications as read", error);
  }
}, [setNotifications, setUnreadCount]);

const useNotificationReadActions = (
  refs: NotificationRequestRefs,
  handlers: Pick<NotificationStateHandlers, "setNotifications" | "setUnreadCount">,
  fetchUnreadCount: () => Promise<void>,
) => {
  const markRead = useMarkRead(refs, handlers, fetchUnreadCount);
  const markUnread = useMarkUnread(refs, handlers, fetchUnreadCount);
  const markAllRead = useMarkAllRead(handlers.setNotifications, handlers.setUnreadCount);
  return { markRead, markUnread, markAllRead };
};

const useDeleteNotification = (
  refs: NotificationRequestRefs,
  handlers: Pick<NotificationStateHandlers, "setNotifications" | "setUnreadCount">,
  fetchUnreadCount: () => Promise<void>,
) => useCallback(async (id: number) => {
  try {
    await apiDeleteNotification(id);
    applyDeleteUpdate(id, refs.notificationsRef, handlers.setNotifications, handlers.setUnreadCount, fetchUnreadCount);
  } catch (error) {
    console.error("Failed to delete notification", error);
  }
}, [fetchUnreadCount, handlers.setNotifications, handlers.setUnreadCount, refs.notificationsRef]);

const useDeleteAllNotifications = (setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>, setUnreadCount: React.Dispatch<React.SetStateAction<number>>) => useCallback(async () => {
  try {
    await apiDeleteAllNotifications();
    setNotifications([]);
    setUnreadCount(0);
  } catch (error) {
    console.error("Failed to delete all notifications", error);
  }
}, [setNotifications, setUnreadCount]);

const useNotificationDeleteActions = (
  refs: NotificationRequestRefs,
  handlers: Pick<NotificationStateHandlers, "setNotifications" | "setUnreadCount">,
  fetchUnreadCount: () => Promise<void>,
) => {
  const deleteNotification = useDeleteNotification(refs, handlers, fetchUnreadCount);
  const deleteAllNotifications = useDeleteAllNotifications(handlers.setNotifications, handlers.setUnreadCount);
  return { deleteNotification, deleteAllNotifications };
};

const useSocketMessageHandler = (
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>,
) => useCallback((data: unknown) => {
  const message = data as WebSocketMessage;
  if (message.type === "new_notification") {
    setNotifications((previous) => mergeWebSocketNotification(previous, message.notification));
    setUnreadCount(message.unread_count);
    return;
  }
  setUnreadCount(message.count);
}, [setNotifications, setUnreadCount]);

const useNotificationSocket = (
  hasAuthToken: boolean,
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>,
) => {
  const handleSocketMessage = useSocketMessageHandler(setNotifications, setUnreadCount);
  useWebSocket(hasAuthToken ? "/ws/notifications/" : null, handleSocketMessage);
};

const useNotificationBootstrap = (
  hasAuthToken: boolean,
  refs: NotificationRequestRefs,
  handlers: NotificationStateHandlers,
  fetchNotifications: () => Promise<void>,
  fetchUnreadCount: () => Promise<void>,
) => {
  useEffect(() => {
    if (hasAuthToken) {
      void fetchNotifications();
      void fetchUnreadCount();
      return;
    }
    bumpRequestIds(refs);
    resetNotificationState(handlers.setNotifications, handlers.setUnreadCount, handlers.setError, handlers.setLoading);
  }, [fetchNotifications, fetchUnreadCount, handlers, hasAuthToken, refs]);
};

/** Manages notification state, unread counts, actions, and live updates. */
export const useNotificationLogic = () => {
  const hasAuthToken = useHasAuthToken();
  const state = useNotificationState();
  const handlers = useMemo(() => ({
    setNotifications: state.setNotifications,
    setUnreadCount: state.setUnreadCount,
    setLoading: state.setLoading,
    setError: state.setError,
  }), [state.setError, state.setLoading, state.setNotifications, state.setUnreadCount]);
  const refs = useMemo(() => ({
    notificationsRef: state.notificationsRef,
    notificationsRequestIdRef: state.notificationsRequestIdRef,
    unreadCountRequestIdRef: state.unreadCountRequestIdRef,
  }), [state.notificationsRef, state.notificationsRequestIdRef, state.unreadCountRequestIdRef]);
  const { fetchNotifications, fetchUnreadCount } = useNotificationQueries(handlers, refs);
  const { markRead, markUnread, markAllRead } = useNotificationReadActions(refs, handlers, fetchUnreadCount);
  const { deleteNotification, deleteAllNotifications } = useNotificationDeleteActions(refs, handlers, fetchUnreadCount);
  useNotificationSocket(hasAuthToken, handlers.setNotifications, handlers.setUnreadCount);
  useNotificationBootstrap(hasAuthToken, refs, handlers, fetchNotifications, fetchUnreadCount);

  return {
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    loading: state.loading,
    error: state.error,
    fetchNotifications,
    fetchUnreadCount,
    markRead,
    markUnread,
    markAllRead,
    deleteNotification,
    deleteAllNotifications,
  };
};
