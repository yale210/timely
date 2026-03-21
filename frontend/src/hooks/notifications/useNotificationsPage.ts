import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNotifications } from "@/api/notifications";
import { useNotificationContext } from "@/context/NotificationContext";
import { type Notification, NotificationType } from "@/types";

const PAGE_SIZE = 10;
/** Filter tabs available on the notifications page. */
export type NotificationFilterTab = "all" | "unread" | "system" | "tasks" | "calendar";
/** Bulk confirmation actions available in the notifications list UI. */
export type ListConfirmationAction = "mark_all_read" | "delete_all" | null;
export const filterTabs: { key: NotificationFilterTab; label: string }[] = [
  { key: "all", label: "All" }, { key: "unread", label: "Unread" }, { key: "system", label: "System" }, { key: "tasks", label: "Tasks" }, { key: "calendar", label: "Calendar" },
];

const buildFilter = (t: NotificationFilterTab) => {
  if (t === "unread") return { isRead: false };
  if (t === "system") return { notificationType: NotificationType.SYSTEM };
  if (t === "tasks") return { notificationType: NotificationType.TASK };
  if (t === "calendar") return { notificationType: NotificationType.CALENDAR };
  return {};
};

const usePageFetch = (p: number, t: NotificationFilterTab) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getNotifications(p, buildFilter(t));
      setNotifications(d.results); setCount(d.count); setError(null);
    } catch (e) { console.error(e); setError("Failed to load notifications."); } finally { setLoading(false); }
  }, [t, p]);
  useEffect(() => { void fetchPage(); }, [fetchPage]);
  return { notifications, setNotifications, count, loading, error, fetchPage };
};

/**
 * Hook to manage notifications page state.
 */
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

  useEffect(() => { if (ctx.notifications !== prevRef.current) { prevRef.current = ctx.notifications; void fetchPage(); } }, [ctx.notifications, fetchPage]);

  const click = useCallback(async (n: Notification) => { if (!n.is_read) await ctx.markRead(n.id); await ctx.fetchNotifications(); void nav(`/notifications/${n.id}`); }, [ctx, nav]);
  const toggle = useCallback(async (n: Notification) => { if (n.is_read) await ctx.markUnread(n.id); else await ctx.markRead(n.id); await fetchPage(); await ctx.fetchNotifications(); }, [ctx, fetchPage]);
  const del = useCallback(async (n: Notification) => { await ctx.deleteNotification(n.id); if (notifications.length === 1 && currentPage > 1) setPage((p) => Math.max(1, p - 1)); else await fetchPage(); await ctx.fetchNotifications(); }, [ctx, currentPage, fetchPage, notifications.length]);
  const bulk = useCallback(async () => {
    if (confirm === "mark_all_read") {
      await ctx.markAllRead();
      await fetchPage();
    }
    if (confirm === "delete_all") {
      await ctx.deleteAllNotifications();
      setPage(1);
    }
    await ctx.fetchNotifications();
  }, [confirm, ctx, fetchPage]);

  const win = useMemo(() => {
    const pages: number[] = [];
    for (let c = Math.max(1, currentPage - 2); c <= Math.min(totalPages, currentPage + 2); c++) pages.push(c);
    return pages;
  }, [currentPage, totalPages]);

  return {
    state: { notifications, activeTab: tab, page: currentPage, count, totalPages, paginationWindow: win, loading, contextLoading: ctx.loading, displayError: error ?? ctx.error, confirmAction: confirm, notificationPendingDelete: pend },
    actions: { setTab: (t: NotificationFilterTab) => { setTab(t); setPage(1); }, setPage: (nextPage: number) => { setPage(Math.max(1, nextPage)); }, setConfirmAction: setConfirm, setNotificationPendingDelete: setPending, handleNotificationClick: click, handleToggleRead: toggle, handleDeleteNotification: del, handleConfirmBulkAction: bulk },
  };
};
