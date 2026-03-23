import { useState, useEffect, useCallback } from "react";
import {
  getNotifications, getUnreadCount,
  markAsRead as apiRead, markAllAsRead as apiAllRead, deleteNotification as apiDel,
} from "@/api/notifications";
import { type Notification } from "@/types";

const useNotifState = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  return { notifications, setNotifications, unreadCount, setUnreadCount, loading, setLoading, error, setError, page, setPage, hasMore, setHasMore };
};

/**
 * Hook to manage paginated notification fetching and CRUD operations.
 */
export const useNotifications = () => {
  const { notifications, setNotifications, unreadCount, setUnreadCount, loading, setLoading, error, setError, page, setPage, hasMore, setHasMore } = useNotifState();
  
  const fetchNotifications = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const d = await getNotifications(p);
      if (p === 1) setNotifications(d.results); else setNotifications((v) => [...v, ...d.results]);
      setHasMore(!!d.next); setPage(p); setError(null);
    } catch (e) { setError("Failed to fetch notifications"); console.error(e); } finally { setLoading(false); }
  }, [setLoading, setNotifications, setHasMore, setPage, setError]);

  const fetchUnreadCount = useCallback(async () => {
    try { const d = await getUnreadCount(); setUnreadCount(d.count); } catch (e) { console.error("Failed to fetch unread count", e); }
  }, [setUnreadCount]);

  const markRead = async (i: number) => {
    try { await apiRead(i); setNotifications((v) => v.map((n) => (n.id === i ? { ...n, is_read: true } : n))); setUnreadCount((v) => Math.max(0, v - 1));
    } catch (e) { console.error("Failed to mark notification as read", e); }
  };

  const markAllRead = async () => {
    try { await apiAllRead(); setNotifications((v) => v.map((n) => ({ ...n, is_read: true }))); setUnreadCount(0);
    } catch (e) { console.error("Failed to mark all notifications as read", e); }
  };

  const deleteNotification = async (i: number) => {
    try {
      const n = notifications.find((x) => x.id === i); await apiDel(i); setNotifications((v) => v.filter((x) => x.id !== i));
      if (n && !n.is_read) setUnreadCount((v) => Math.max(0, v - 1));
    } catch (e) { console.error("Failed to delete notification", e); }
  };

  useEffect(() => { void fetchNotifications(1); void fetchUnreadCount(); }, [fetchNotifications, fetchUnreadCount]);
  return { notifications, unreadCount, loading, error, hasMore, page, fetchNotifications, fetchUnreadCount, markRead, markAllRead, deleteNotification, setUnreadCount };
};
