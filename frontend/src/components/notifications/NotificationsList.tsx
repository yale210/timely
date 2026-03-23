import type React from "react";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { type Notification } from "@/types";

interface NotificationsListProps {
  notifications: Notification[];
  page: number;
  totalPages: number;
  paginationWindow: number[];
  loading: boolean;
  contextLoading: boolean;
  onNotificationClick: (notification: Notification) => void | Promise<void>;
  onToggleRead: (notification: Notification) => void | Promise<void>;
  onDeleteRequest: (notification: Notification) => void | Promise<void>;
  onPageChange: (page: number) => void;
}

/**
 * Renders a button for a specific page in the pagination list.
 * @param root0 - The component props.
 * @param root0.num - The page number.
 * @param root0.active - Whether this page is currently active.
 * @param root0.onClick - Callback for when the button is clicked.
 */
const PageButton: React.FC<{ num: number; active: boolean; onClick: () => void }> = ({ num, active, onClick }) => (
  <button type="button" onClick={onClick} className={`h-8 min-w-8 rounded-md px-2 text-sm font-medium ${active ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>{num}</button>
);

/**
 * Renders the pagination controls for the notifications list.
 * @param props - The component props.
 */
const NotificationPagination: React.FC<NotificationsListProps> = (props) => {
  const { page, totalPages, paginationWindow, loading, onPageChange } = props;
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t px-4 py-3">
      <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1 || loading} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50">Previous</button>
      <div className="flex items-center gap-1">
        {paginationWindow.map((num) => <PageButton key={num} num={num} active={num === page} onClick={() => onPageChange(num)} />)}
      </div>
      <button type="button" onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages || loading} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-50">Next</button>
    </div>
  );
};

/**
 * Renders an empty state message when no notifications are present.
 * @param root0 - The component props.
 * @param root0.loading - Whether data is currently being loaded.
 */
const NotificationsEmptyState: React.FC<{ loading: boolean }> = ({ loading }) => (
  <div className="p-12 text-center"><p className="text-gray-500">{loading ? "Loading notifications..." : "You're all caught up."}</p></div>
);

/**
 * Renders a list of notification cards with pagination.
 * @param props - The component props.
 */
export const NotificationsList: React.FC<NotificationsListProps> = (props) => {
  const { notifications, loading, contextLoading, onNotificationClick, onToggleRead, onDeleteRequest } = props;
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {notifications.length > 0 ? (
        <>{notifications.map((n) => <NotificationCard key={n.id} notification={n} onClick={onNotificationClick} onToggleRead={onToggleRead} onDelete={onDeleteRequest} showActions unreadIndicatorPlacement="left" />)}<NotificationPagination {...props} /></>
      ) : (
        <NotificationsEmptyState loading={loading || contextLoading} />
      )}
    </div>
  );
};
