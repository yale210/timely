import type React from "react";
import { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import { getNotifications } from "../api/notifications";
import { NotificationCard } from "../components/NotificationCard";
import ConfirmationModal from "../components/modals/ConfirmationModal";
import { useNotificationContext } from "../context/NotificationContext";
import { type Notification, NotificationType } from "../types/notification";
import { usePushSubscription } from "../hooks/usePushSubscription";

const PAGE_SIZE = 10;

type NotificationFilterTab = "all" | "unread" | "system" | "tasks" | "calendar";
type ListConfirmationAction = "mark_all_read" | "delete_all" | null;

const PushNotificationBanner = () => {
  const { isSupported, isSubscribed, permission, loading, error, subscribe, unsubscribe } =
    usePushSubscription();

  if (!isSupported) {
    return null;
  }

  if (permission === "denied") {
    return (
      <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-3">
          <span className="material-icons mt-0.5 text-yellow-600">notifications_off</span>
          <div>
            <p className="text-sm font-medium text-yellow-800">Push notifications blocked</p>
            <p className="mt-1 text-sm text-yellow-700">
              You&apos;ve blocked notifications for this site. To re-enable, click the lock icon in
              your browser&apos;s address bar and allow notifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isSubscribed) {
    return (
      <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <span className="material-icons mt-0.5 text-green-600">notifications_active</span>
            <div>
              <p className="text-sm font-medium text-green-800">Push notifications enabled</p>
              <p className="mt-1 text-sm text-green-700">
                You&apos;ll receive browser notifications for reminders and admin messages.
              </p>
            </div>
          </div>
          <button
            onClick={() => void unsubscribe()}
            disabled={loading}
            className="ml-4 shrink-0 text-sm font-medium text-green-700 hover:text-green-900 disabled:opacity-50"
          >
            {loading ? "..." : "Disable"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <span className="material-icons mt-0.5 text-indigo-600">notifications</span>
          <div>
            <p className="text-sm font-medium text-indigo-800">Enable push notifications</p>
            <p className="mt-1 text-sm text-indigo-700">
              Get browser notifications for event reminders and important updates, even when this
              tab isn&apos;t active.
            </p>
          </div>
        </div>
        <button
          onClick={() => void subscribe()}
          disabled={loading}
          className="ml-4 shrink-0 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Enabling..." : "Enable"}
        </button>
      </div>
      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

const filterTabs: { key: NotificationFilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "system", label: "System" },
  { key: "tasks", label: "Tasks" },
  { key: "calendar", label: "Calendar" },
];

const buildNotificationFilter = (tab: NotificationFilterTab) => {
  if (tab === "unread") {
    return { isRead: false };
  }
  if (tab === "system") {
    return { notificationType: NotificationType.SYSTEM };
  }
  if (tab === "tasks") {
    return { notificationType: NotificationType.TASK };
  }
  if (tab === "calendar") {
    return { notificationType: NotificationType.CALENDAR };
  }
  return {};
};

/**
 * Paginated notification inbox with filter tabs, bulk actions, and push subscription banner.
 */
export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const {
    loading: contextLoading,
    error: contextError,
    markRead,
    markUnread,
    markAllRead,
    deleteNotification,
    deleteAllNotifications,
    fetchNotifications,
  } = useNotificationContext();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<NotificationFilterTab>("all");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ListConfirmationAction>(null);
  const [notificationPendingDelete, setNotificationPendingDelete] = useState<Notification | null>(null);
  const displayError = error ?? contextError;

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / PAGE_SIZE)), [count]);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications(page, buildNotificationFilter(activeTab));
      setNotifications(data.results);
      setCount(data.count);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch notifications page", err);
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markRead(notification.id);
    }
    await fetchNotifications();
    await navigate(`/notifications/${notification.id}`);
  };

  const handleToggleRead = async (notification: Notification) => {
    if (notification.is_read) {
      await markUnread(notification.id);
    } else {
      await markRead(notification.id);
    }
    await fetchPage();
    await fetchNotifications();
  };

  const handleDeleteNotification = async (notification: Notification) => {
    await deleteNotification(notification.id);
    const isLastItemOnPage = notifications.length === 1 && page > 1;
    if (isLastItemOnPage) {
      setPage((prev) => Math.max(1, prev - 1));
    } else {
      await fetchPage();
    }
    await fetchNotifications();
  };

  const handleConfirmBulkAction = async () => {
    if (confirmAction === "mark_all_read") {
      await markAllRead();
    }
    if (confirmAction === "delete_all") {
      await deleteAllNotifications();
      setPage(1);
    }
    await fetchPage();
    await fetchNotifications();
  };

  const paginationWindow = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let current = start; current <= end; current += 1) {
      pages.push(current);
    }
    return pages;
  }, [page, totalPages]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PushNotificationBanner />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <div className="mt-3 flex flex-wrap gap-2 border-b border-gray-200 pb-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-indigo-100 text-indigo-700"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-1 flex items-center gap-1 self-start sm:self-auto">
          <button
            type="button"
            title="Mark all as read"
            aria-label="Mark all as read"
            onClick={() => setConfirmAction("mark_all_read")}
            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <CheckCircleIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            title="Delete all"
            aria-label="Delete all"
            onClick={() => setConfirmAction("delete_all")}
            className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {displayError && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{displayError}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {notifications.length > 0 ? (
          <>
            {notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onClick={(item) => {
                  void handleNotificationClick(item);
                }}
                onToggleRead={(item) => {
                  void handleToggleRead(item);
                }}
                onDelete={(item) => setNotificationPendingDelete(item)}
                showActions
                unreadIndicatorPlacement="left"
              />
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1 || loading}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {paginationWindow.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      className={`h-8 min-w-8 rounded-md px-2 text-sm font-medium ${
                        pageNumber === page
                          ? "bg-indigo-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages || loading}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            {loading || contextLoading ? (
              <p className="text-gray-500">Loading notifications...</p>
            ) : (
              <p className="text-gray-500">You&apos;re all caught up.</p>
            )}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          void handleConfirmBulkAction();
        }}
        title={confirmAction === "delete_all" ? "Delete all notifications?" : "Mark all as read?"}
        message={
          confirmAction === "delete_all"
            ? "This will permanently remove all notifications from your inbox."
            : "This will mark all notifications as read."
        }
        confirmText={confirmAction === "delete_all" ? "Delete all" : "Mark all"}
      />

      <ConfirmationModal
        isOpen={notificationPendingDelete !== null}
        onClose={() => setNotificationPendingDelete(null)}
        onConfirm={() => {
          if (notificationPendingDelete) {
            void handleDeleteNotification(notificationPendingDelete);
          }
        }}
        title="Delete notification?"
        message="This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
};
