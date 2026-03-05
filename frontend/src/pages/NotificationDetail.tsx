

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeftIcon, EnvelopeIcon, EnvelopeOpenIcon, TrashIcon } from "@heroicons/react/24/outline";
import api from "../services/api";
import { type Notification } from "../types/notification";
import { useNotificationContext } from "../context/NotificationContext";
import ConfirmationModal from "../components/modals/ConfirmationModal";

/**
 * Full-page view of a single notification with read toggle and delete actions.
 */
export default function NotificationDetail() {
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
      } catch (err) {
        setError("Failed to fetch notification details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void fetchNotification();
  }, [id, markRead]);

  const handleToggleRead = async () => {
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
    } catch (err) {
      console.error("Failed to toggle notification status", err);
    }
  };

  const handleDelete = async () => {
    if (!notification) {
      return;
    }

    try {
      await deleteNotification(notification.id);
      await fetchNotifications();
      await navigate("/notifications");
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  if (error || !notification) {
    return (
      <div className="p-8 text-center text-red-500">{error ?? "Notification not found"}</div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          to="/notifications"
          className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          <ArrowLeftIcon className="mr-1 h-4 w-4" />
          Back to notifications
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-start justify-between px-6 py-5">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-gray-900">{notification.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {new Date(notification.timestamp).toLocaleString()}
            </p>
            {notification.sender_username && (
              <p className="mt-1 text-xs text-gray-500">
                Sent by <span className="font-medium text-gray-700">{notification.sender_username}</span>
              </p>
            )}
          </div>
          <div className="ml-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleToggleRead()}
              className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              title={notification.is_read ? "Mark as unread" : "Mark as read"}
              aria-label={notification.is_read ? "Mark as unread" : "Mark as read"}
            >
              {notification.is_read ? (
                <EnvelopeIcon className="h-5 w-5" />
              ) : (
                <EnvelopeOpenIcon className="h-5 w-5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
              title="Delete notification"
              aria-label="Delete notification"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 px-6 py-6">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {notification.message}
          </p>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          void handleDelete();
        }}
        title="Delete notification?"
        message="This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
};
