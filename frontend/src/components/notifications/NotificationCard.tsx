import type React from "react";
import { type Notification, NotificationType } from "@/types";
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  EnvelopeOpenIcon,
  EnvelopeIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface NotificationCardProps {
  notification: Notification;
  onClick: (notification: Notification) => void | Promise<void>;
  onToggleRead?: (notification: Notification) => void | Promise<void>;
  onDelete?: (notification: Notification) => void | Promise<void>;
  showActions?: boolean;
  showReadToggle?: boolean;
  showDivider?: boolean;
  compact?: boolean;
  unreadIndicatorPlacement?: "right" | "left";
}

/**
 * Renders the icon for a notification based on its type.
 * @param root0 - The component props.
 * @param root0.type - The notification type.
 */
const NotificationIcon: React.FC<{ type: NotificationType }> = ({ type }) => {
  switch (type) {
    case NotificationType.CALENDAR: return <CalendarDaysIcon className="h-5 w-5 text-indigo-500" />;
    case NotificationType.TASK: return <CheckCircleIcon className="h-5 w-5 text-emerald-500" />;
    default: return <InformationCircleIcon className="h-5 w-5 text-amber-500" />;
  }
};

/**
 * Renders the text content of the notification.
 * @param root0 - The component props.
 * @param root0.notification - The notification data.
 * @param root0.unreadIndicatorPlacement - Where to place the unread indicator.
 */
const NotificationContent: React.FC<{
  notification: Notification;
  unreadIndicatorPlacement: "right" | "left";
}> = ({ notification, unreadIndicatorPlacement }) => {
  const isRead = notification.is_read;
  const titleClasses = `truncate text-sm ${isRead ? "font-medium text-gray-700" : "font-semibold text-gray-900"}`;
  const messageClasses = `mt-1 line-clamp-2 text-sm ${isRead ? "text-gray-500" : "text-gray-700"}`;
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className={titleClasses}>{notification.title}</p><p className="mt-0.5 text-xs text-gray-500">{new Date(notification.timestamp).toLocaleString()}</p></div>
        {unreadIndicatorPlacement === "right" && !isRead && <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />}
      </div>
      <p className={messageClasses}>{notification.message}</p>
    </div>
  );
};

/**
 * Renders the toggle read/unread button.
 * @param root0 - The component props.
 * @param root0.notification - The notification data.
 * @param root0.onToggleRead - Callback to toggle read status.
 */
const NotificationToggleButton: React.FC<{
  notification: Notification;
  onToggleRead?: (n: Notification) => void | Promise<void>;
}> = ({ notification, onToggleRead }) => {
  if (!onToggleRead) return null;
  const label = notification.is_read ? "Mark as unread" : "Mark as read";
  const handleClick = (e: React.MouseEvent) => { e.stopPropagation(); void onToggleRead(notification); };
  return (
    <button type="button" onClick={handleClick} title={label} aria-label={label} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
      {notification.is_read ? <EnvelopeIcon className="h-4 w-4" /> : <EnvelopeOpenIcon className="h-4 w-4" />}
    </button>
  );
};

/**
 * Renders the delete button.
 * @param root0 - The component props.
 * @param root0.notification - The notification data.
 * @param root0.onDelete - Callback to delete the notification.
 */
const NotificationDeleteButton: React.FC<{
  notification: Notification;
  onDelete?: (n: Notification) => void | Promise<void>;
}> = ({ notification, onDelete }) => {
  if (!onDelete) return null;
  const handleClick = (e: React.MouseEvent) => { e.stopPropagation(); void onDelete(notification); };
  return (
    <button type="button" onClick={handleClick} title="Delete notification" aria-label="Delete notification" className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600">
      <TrashIcon className="h-4 w-4" />
    </button>
  );
};

/**
 * Renders action buttons for the notification card.
 * @param root0 - The component props.
 * @param root0.notification - The notification data.
 * @param root0.showActions - Whether to show action buttons.
 * @param root0.showReadToggle - Whether to show the read toggle button.
 * @param root0.onToggleRead - Callback to toggle read status.
 * @param root0.onDelete - Callback to delete the notification.
 */
const NotificationActions: React.FC<NotificationCardProps> = ({
  notification, showActions, showReadToggle, onToggleRead, onDelete,
}) => {
  if (!showActions) return null;
  return (
    <div className="ml-1 flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
      {showReadToggle && <NotificationToggleButton notification={notification} onToggleRead={onToggleRead} />}
      <NotificationDeleteButton notification={notification} onDelete={onDelete} />
    </div>
  );
};

/**
 * Renders a single notification item with icon, title, message, and optional action buttons.
 * @param props - The component props.
 */
export const NotificationCard: React.FC<NotificationCardProps> = (props) => {
  const { notification, onClick, showActions = false, showReadToggle = true, showDivider = true, compact = false, unreadIndicatorPlacement = "right" } = props;
  const isRead = notification.is_read;
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); void onClick(notification); } };
  const cardClasses = `group ${showDivider ? "border-b" : ""} transition-colors ${isRead ? "bg-white hover:bg-gray-50" : "bg-indigo-50/60 hover:bg-indigo-50"} ${compact ? "px-4 py-3" : "px-4 py-4"} cursor-pointer`;

  return (
    <div className={cardClasses} onClick={() => { void onClick(notification); }} role="button" tabIndex={0} onKeyDown={handleKeyDown}>
      <div className="flex items-start gap-3">
        {unreadIndicatorPlacement === "left" && (
          <div className="mt-3 flex w-3 shrink-0 justify-center">
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${isRead ? "invisible" : "bg-indigo-500"}`} />
          </div>
        )}
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-gray-100"><NotificationIcon type={notification.notification_type} /></div>
        <NotificationContent notification={notification} unreadIndicatorPlacement={unreadIndicatorPlacement} />
        <NotificationActions {...props} showActions={showActions} showReadToggle={showReadToggle} />
      </div>
    </div>
  );
};
