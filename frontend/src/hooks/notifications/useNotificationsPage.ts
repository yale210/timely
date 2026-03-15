import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications } from "@/api/notifications";
import { useNotificationContext } from "@/context/NotificationContext";
import { type Notification, NotificationType } from "@/types";

const PAGE_SIZE = 10;

/** Filter tabs available on the notifications page. */
export type NotificationFilterTab = "all" | "unread" | "system" | "tasks" | "calendar";
/** Bulk confirmation actions available in the list UI. */
export type ListConfirmationAction = "mark_all_read" | "delete_all" | null;

export const filterTabs: { key: NotificationFilterTab; label: string }[] = [
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

interface NotificationsPageState {
  notifications: Notification[];
  activeTab: NotificationFilterTab;
  page: number;
  count: number;
  totalPages: number;
  paginationWindow: number[];
  loading: boolean;
  contextLoading: boolean;
  displayError: string | null;
  confirmAction: ListConfirmationAction;
  notificationPendingDelete: Notification | null;
}

interface NotificationsPageActions {
  setTab: (tab: NotificationFilterTab) => void;
  setPage: (page: number) => void;
  setConfirmAction: (action: ListConfirmationAction) => void;
  setNotificationPendingDelete: (notification: Notification | null) => void;
  handleNotificationClick: (notification: Notification) => Promise<void>;
  handleToggleRead: (notification: Notification) => Promise<void>;
  handleDeleteNotification: (notification: Notification) => Promise<void>;
  handleConfirmBulkAction: () => Promise<void>;
}

interface UseNotificationsPageReturn {
  state: NotificationsPageState;
  actions: NotificationsPageActions;
}

/**
 * Provides state and actions for the notifications inbox page.
 */
export const useNotificationsPage = (): UseNotificationsPageReturn => {
  const navigate = useNavigate();
  const {
    notifications: contextNotifications,
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

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / PAGE_SIZE)), [count]);
  const displayError = error ?? contextError;

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications(page, buildNotificationFilter(activeTab));
      setNotifications(data.results);
      setCount(data.count);
      setError(null);
    } catch (fetchError) {
      console.error("Failed to fetch notifications page", fetchError);
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  const prevContextNotificationsRef = useRef(contextNotifications);
  useEffect(() => {
    if (contextNotifications !== prevContextNotificationsRef.current) {
      prevContextNotificationsRef.current = contextNotifications;
      void fetchPage();
    }
  }, [contextNotifications, fetchPage]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleNotificationClick = useCallback(
  async (notification: Notification) => {
    if (!notification.is_read) {
      await markRead(notification.id);
    }
    await fetchNotifications();
    await navigate(`/notifications/${notification.id}`);
  },
  [fetchNotifications, markRead, navigate],
);

  const handleToggleRead = useCallback(
  async (notification: Notification) => {
    if (notification.is_read) {
      await markUnread(notification.id);
    } else {
      await markRead(notification.id);
    }
    await fetchPage();
    await fetchNotifications();
  },
  [fetchNotifications, fetchPage, markRead, markUnread],
);

  const handleDeleteNotification = useCallback(
  async (notification: Notification) => {
    await deleteNotification(notification.id);
    const isLastItemOnPage = notifications.length === 1 && page > 1;
    if (isLastItemOnPage) {
      setPage((prev) => Math.max(1, prev - 1));
    } else {
      await fetchPage();
    }
    await fetchNotifications();
  },
  [deleteNotification, fetchNotifications, fetchPage, notifications.length, page],
);

  const handleConfirmBulkAction = useCallback(async () => {
  if (confirmAction === "mark_all_read") {
    await markAllRead();
  }
  if (confirmAction === "delete_all") {
    await deleteAllNotifications();
    setPage(1);
  }
  await fetchPage();
  await fetchNotifications();
}, [confirmAction, deleteAllNotifications, fetchNotifications, fetchPage, markAllRead]);

  const paginationWindow = useMemo(() => {
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let current = start; current <= end; current += 1) {
    pages.push(current);
  }
  return pages;
}, [page, totalPages]);

  return {
    state: {
      notifications,
      activeTab,
      page,
      count,
      totalPages,
      paginationWindow,
      loading,
      contextLoading,
      displayError,
      confirmAction,
      notificationPendingDelete,
    },
    actions: {
      setTab: (tab) => {
        setActiveTab(tab);
        setPage(1);
      },
      setPage,
      setConfirmAction,
      setNotificationPendingDelete,
      handleNotificationClick,
      handleToggleRead,
      handleDeleteNotification,
      handleConfirmBulkAction,
    },
  };
};

