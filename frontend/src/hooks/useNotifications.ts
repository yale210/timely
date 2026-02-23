import { useState, useEffect, useCallback } from 'react';
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead as apiMarkAsRead, 
  markAllAsRead as apiMarkAllAsRead, 
  deleteNotification as apiDeleteNotification 
} from '../api/notifications';
import { type Notification } from '../types/notification';

/**
 * A custom hook for managing and fetching notifications.
 *
 * This hook provides state and methods for retrieving a user's notifications,
 * tracking the unread count, and performing actions like marking as read
 * or deleting a notification.
 * @returns An object containing notification state and management functions.
 */
export const useNotifications = () => {
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
        setNotifications(prev => [...prev, ...data.results]);
      }
      setHasMore(!!data.next);
      setPage(pageNum);
      setError(null);
    } catch (err) {
      setError('Failed to fetch notifications');
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
      console.error('Failed to fetch unread count', err);
    }
  }, []);

  const markRead = async (id: number) => {
    try {
      await apiMarkAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const markAllRead = async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const notificationToDelete = notifications.find(n => n.id === id);
      await apiDeleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notificationToDelete && !notificationToDelete.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  useEffect(() => {
    void fetchNotifications(1);
    void fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  return {
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
    setUnreadCount
  };
};
