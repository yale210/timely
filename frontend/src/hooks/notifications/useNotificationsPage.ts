import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications } from "@/api/notifications";
import { useNotificationContext } from "@/context/NotificationContext";
import { type Notification } from "@/types";
import {
  buildNotificationFilter,
  buildPaginationWindow,
  handleDeleteNotificationAction,
  handleNotificationClickAction,
  handleToggleReadAction,
  runBulkNotificationAction,
} from "@/hooks/notifications/notificationsPageUtils";

const PAGE_SIZE = 10;
/** Available tabs for filtering the notifications list. */
export type NotificationFilterTab = "all" | "unread" | "system" | "tasks" | "calendar";

/** Available bulk confirmation actions on the notifications page. */
export type ListConfirmationAction = "mark_all_read" | "delete_all" | null;
export const filterTabs: { key: NotificationFilterTab; label: string }[] = [
  { key: "all", label: "All" }, { key: "unread", label: "Unread" }, { key: "system", label: "System" }, { key: "tasks", label: "Tasks" }, { key: "calendar", label: "Calendar" },
];

const usePageFetch = (p: number, t: NotificationFilterTab) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications(p, buildNotificationFilter(t));
      setNotifications(data.results);
      setCount(data.count);
      setError(null);
    } catch (error) {
      console.error(error);
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [t, p]);

  useEffect(() => { void fetchPage(); }, [fetchPage]);

  return { notifications, setNotifications, count, loading, error, fetchPage };
};

const useRefreshOnContextChange = (
  notifications: Notification[],
  prevRef: React.MutableRefObject<Notification[]>,
  fetchPage: () => Promise<void>,
) => {
  useEffect(() => {
    if (notifications === prevRef.current) return;
    prevRef.current = notifications;
    void fetchPage();
  }, [fetchPage, notifications, prevRef]);
};

const usePageClickAction = (ctx: ReturnType<typeof useNotificationContext>, nav: ReturnType<typeof useNavigate>) => async (notification: Notification) => {
  const navigateTo = (path: string) => { void nav(path); };
  await handleNotificationClickAction(notification, ctx, navigateTo).catch((error: unknown) => {
    console.error(error);
  });
};

const usePageToggleAction = (ctx: ReturnType<typeof useNotificationContext>, fetchPage: () => Promise<void>) => async (notification: Notification) => {
  await handleToggleReadAction(notification, ctx, fetchPage).catch((error: unknown) => {
    console.error(error);
  });
};

const usePageDeleteAction = (
  ctx: ReturnType<typeof useNotificationContext>,
  currentPage: number,
  fetchPage: () => Promise<void>,
  notificationsLength: number,
  setPage: React.Dispatch<React.SetStateAction<number>>,
) => async (notification: Notification) => {
  await handleDeleteNotificationAction(notification, { deleteNotification: ctx.deleteNotification, fetchNotifications: ctx.fetchNotifications, currentPage, fetchPage, notificationsLength, setPage }).catch((error: unknown) => {
    console.error(error);
  });
};

const usePageBulkAction = (
  ctx: ReturnType<typeof useNotificationContext>,
  confirm: ListConfirmationAction,
  fetchPage: () => Promise<void>,
  setPage: React.Dispatch<React.SetStateAction<number>>,
) => async () => {
  await runBulkNotificationAction(confirm, { markAllRead: ctx.markAllRead, deleteAllNotifications: ctx.deleteAllNotifications, fetchPage, fetchNotifications: ctx.fetchNotifications, setPage }).catch((error: unknown) => {
    console.error(error);
  });
};

const usePageActions = (
  ctx: ReturnType<typeof useNotificationContext>,
  nav: ReturnType<typeof useNavigate>,
  confirm: ListConfirmationAction,
  currentPage: number,
  fetchPage: () => Promise<void>,
  notificationsLength: number,
  setTab: React.Dispatch<React.SetStateAction<NotificationFilterTab>>,
  setPage: React.Dispatch<React.SetStateAction<number>>,
  setConfirm: React.Dispatch<React.SetStateAction<ListConfirmationAction>>,
  setPending: React.Dispatch<React.SetStateAction<Notification | null>>,
) => {
  const click = usePageClickAction(ctx, nav);
  const toggle = usePageToggleAction(ctx, fetchPage);
  const del = usePageDeleteAction(ctx, currentPage, fetchPage, notificationsLength, setPage);
  const bulk = usePageBulkAction(ctx, confirm, fetchPage, setPage);

  return {
    setTab: (tab: NotificationFilterTab) => { setTab(tab); setPage(1); },
    setPage: (nextPage: number) => { setPage(Math.max(1, nextPage)); },
    setConfirmAction: setConfirm,
    setNotificationPendingDelete: setPending,
    handleNotificationClick: click,
    handleToggleRead: toggle,
    handleDeleteNotification: del,
    handleConfirmBulkAction: bulk,
  };
};

/** Builds notifications-page state, pagination, and user actions. */
export const useNotificationsPage = () => {
  const nav = useNavigate();
  const ctx = useNotificationContext();
  const [tab, setTab] = useState<NotificationFilterTab>("all");
  const [page, setPage] = useState(1);
  const requestedPage = Math.max(1, page);
  const { notifications, count, loading, error, fetchPage } = usePageFetch(requestedPage, tab);
  const [confirm, setConfirm] = useState<ListConfirmationAction>(null);
  const [pend, setPending] = useState<Notification | null>(null);
  const prevRef = useRef(ctx.notifications);
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  useRefreshOnContextChange(ctx.notifications, prevRef, fetchPage);
  const win = useMemo(() => buildPaginationWindow(currentPage, totalPages), [currentPage, totalPages]);
  const actions = usePageActions(ctx, nav, confirm, currentPage, fetchPage, notifications.length, setTab, setPage, setConfirm, setPending);

  return {
    state: { notifications, activeTab: tab, page: currentPage, count, totalPages, paginationWindow: win, loading, contextLoading: ctx.loading, displayError: error ?? ctx.error, confirmAction: confirm, notificationPendingDelete: pend },
    actions,
  };
};
