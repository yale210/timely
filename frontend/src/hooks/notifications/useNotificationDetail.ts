import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/services/api";
import { useNotificationContext } from "@/context/NotificationContext";
import { type Notification } from "@/types/notification";

interface NotificationDetailState {
  notification: Notification | null;
  isDeleteOpen: boolean;
}

interface NotificationDetailActions {
  setDeleteOpen: (isOpen: boolean) => void;
  handleToggleRead: () => Promise<void>;
  handleDelete: () => Promise<void>;
}

interface UseNotificationDetailReturn {
  state: NotificationDetailState;
  loading: boolean;
  error: string | null;
  actions: NotificationDetailActions;
}

/**
 * Provides state and actions for the notification detail page.
 */
export const useNotificationDetail = (): UseNotificationDetailReturn => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { markRead, markUnread, deleteNotification, fetchNotifications } = useNotificationContext();

  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    const fetchNotification = async () => {
      try {
        const response = await api.get<Notification>(`/api/notifications/${id}/`);
        const data = response.data;
        setNotification(data);
        if (!data.is_read) {
          await markRead(data.id);
          setNotification({ ...data, is_read: true });
        }
      } catch (fetchError) {
        setError("Failed to fetch notification details");
        console.error(fetchError);
      } finally {
        setLoading(false);
      }
    };

    void fetchNotification();
  }, [id, markRead]);

  const handleToggleRead = useCallback(async () => {
    if (!notification) {
      return;
    }

    try {
      if (notification.is_read) {
        await markUnread(notification.id);
        setNotification({ ...notification, is_read: false });
      } else {
        await markRead(notification.id);
        setNotification({ ...notification, is_read: true });
      }
      await fetchNotifications();
    } catch (toggleError) {
      console.error("Failed to toggle notification status", toggleError);
    }
  }, [fetchNotifications, markRead, markUnread, notification]);

  const handleDelete = useCallback(async () => {
    if (!notification) {
      return;
    }

    try {
      await deleteNotification(notification.id);
      await fetchNotifications();
      await navigate("/notifications");
    } catch (deleteError) {
      console.error("Failed to delete notification", deleteError);
    }
  }, [deleteNotification, fetchNotifications, navigate, notification]);

  return {
    state: {
      notification,
      isDeleteOpen,
    },
    loading,
    error,
    actions: {
      setDeleteOpen: setIsDeleteOpen,
      handleToggleRead,
      handleDelete,
    },
  };
};
