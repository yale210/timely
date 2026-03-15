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
  onClick: (notification: Notification) => void;
  onToggleRead?: (notification: Notification) => void;
  onDelete?: (notification: Notification) => void;
  showActions?: boolean;
  compact?: boolean;
  unreadIndicatorPlacement?: "right" | "left";
}

/**
 * Renders a single notification item with icon, title, message, and optional action buttons.
 * @param root0 - The component props.
 * @param root0.notification - The notification data to display.
 * @param root0.onClick - Callback when the card is clicked.
 * @param root0.onToggleRead - Callback to toggle read/unread state.
 * @param root0.onDelete - Callback to delete the notification.
 * @param root0.showActions - Whether to show action buttons.
 * @param root0.compact - Whether to render in compact mode.
 * @param root0.unreadIndicatorPlacement - Position of the unread indicator dot.
 */
export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onClick,
  onToggleRead,
  onDelete,
  showActions = false,
  compact = false,
  unreadIndicatorPlacement = "right",
}) => {
  const getIcon = () => {
    switch (notification.notification_type) {
      case NotificationType.CALENDAR:
        return <CalendarDaysIcon className="h-5 w-5 text-indigo-500" />;
      case NotificationType.TASK:
        return <CheckCircleIcon className="h-5 w-5 text-emerald-500" />;
      case NotificationType.SYSTEM:
      default:
        return <InformationCircleIcon className="h-5 w-5 text-amber-500" />;
    }
  };

  return (
    <div
      className={`group border-b transition-colors ${
        notification.is_read ? "bg-white hover:bg-gray-50" : "bg-indigo-50/60 hover:bg-indigo-50"
      } ${compact ? "px-4 py-3" : "px-4 py-4"} cursor-pointer`}
      onClick={() => onClick(notification)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick(notification);
        }
      }}
    >
      <div className="flex items-start gap-3">
        {unreadIndicatorPlacement === "left" && (
          <div className="mt-3 flex w-3 shrink-0 justify-center">
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${
                notification.is_read ? "invisible" : "bg-indigo-500"
              }`}
            />
          </div>
        )}
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-gray-100">
          {getIcon()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className={`truncate text-sm ${
                  notification.is_read ? "font-medium text-gray-700" : "font-semibold text-gray-900"
                }`}
              >
                {notification.title}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                {new Date(notification.timestamp).toLocaleString()}
              </p>
            </div>
            {unreadIndicatorPlacement === "right" && !notification.is_read && (
              <span className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
            )}
          </div>
          <p
            className={`mt-1 line-clamp-2 text-sm ${
              notification.is_read ? "text-gray-500" : "text-gray-700"
            }`}
          >
            {notification.message}
          </p>
        </div>

        {showActions && (
          <div className="ml-1 flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleRead?.(notification);
              }}
              title={notification.is_read ? "Mark as unread" : "Mark as read"}
              aria-label={notification.is_read ? "Mark as unread" : "Mark as read"}
              className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            >
              {notification.is_read ? (
                <EnvelopeIcon className="h-4 w-4" />
              ) : (
                <EnvelopeOpenIcon className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.(notification);
              }}
              title="Delete notification"
              aria-label="Delete notification"
              className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

