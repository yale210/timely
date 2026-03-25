import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/services/api";
import { useNotificationContext } from "@/context/NotificationContext";
import { type Notification } from "@/types";
import { markNotificationReadIfNeeded } from "@/hooks/notifications/notificationDetailUtils";

interface NotificationDetailState { notification: Notification | null; isDeleteOpen: boolean; }
interface NotificationDetailActions { setDeleteOpen: (isOpen: boolean) => void; handleToggleRead: () => Promise<void>; handleDelete: () => Promise<void>; }
interface UseReturn { state: NotificationDetailState; loading: boolean; error: string | null; actions: NotificationDetailActions; }

const useFetch = (id: string | undefined, markRead: (id: number) => Promise<void>) => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotification = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get<Notification>(`/api/notifications/${id}/`);
        setNotification(await markNotificationReadIfNeeded(response.data, markRead));
      } catch (error) {
        setError("Failed to fetch notification details");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    void fetchNotification();
  }, [id, markRead]);

  return { notification, setNotification, loading, error };
};

/** Manages notification detail loading plus read and delete actions. */
export const useNotificationDetail = (): UseReturn => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ctx = useNotificationContext();
  const { notification, setNotification, loading, error } = useFetch(id, ctx.markRead);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleToggleRead = useCallback(async () => {
    if (!notification) return;
    try {
      const next = !notification.is_read;
      if (next) await ctx.markRead(notification.id);
      else await ctx.markUnread(notification.id);
      setNotification({ ...notification, is_read: next });
      await ctx.fetchNotifications();
    } catch (error) {
      console.error("Failed to toggle notification status", error);
    }
  }, [ctx, notification, setNotification]);

  const handleDelete = useCallback(async () => {
    if (!notification) return;
    try {
      await ctx.deleteNotification(notification.id);
      await ctx.fetchNotifications();
      void navigate("/notifications");
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  }, [ctx, navigate, notification]);

  return { state: { notification, isDeleteOpen }, loading, error, actions: { setDeleteOpen: setIsDeleteOpen, handleToggleRead, handleDelete } };
};
