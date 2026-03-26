import type React from "react";
import { EnvelopeIcon, EnvelopeOpenIcon, TrashIcon } from "@heroicons/react/24/outline";
import { type Notification } from "@/types";
import { formatDateTimeInTimezone, useUserTimezone } from "@/utils/userTimezone";

interface NotificationDetailHeaderProps {
  notification: Notification;
  onToggleRead: () => void;
  onDelete: () => void;
}

/**
 * Renders the metadata for a notification in the detail view.
 * @param root0 - The component props.
 * @param root0.notification - The notification data.
 */
const NotificationDetailMeta: React.FC<{ notification: Notification }> = ({ notification }) => {
  useUserTimezone();

  return (
    <div className="min-w-0">
      <h1 className="truncate text-xl font-semibold text-gray-900">{notification.title}</h1>
      <p className="mt-1 text-sm text-gray-500">{formatDateTimeInTimezone(notification.timestamp)}</p>
      {notification.sender_username && (
        <p className="mt-1 text-xs text-gray-500">
          Sent by <span className="font-medium text-gray-700">{notification.sender_username}</span>
        </p>
      )}
    </div>
  );
};

/**
 * Renders the action buttons for a notification in the detail view.
 * @param root0 - The component props.
 * @param root0.notification - The notification data.
 * @param root0.onToggleRead - Callback to toggle the read status.
 * @param root0.onDelete - Callback to delete the notification.
 */
const NotificationDetailActions: React.FC<NotificationDetailHeaderProps> = ({
  notification,
  onToggleRead,
  onDelete,
}) => {
  const label = notification.is_read ? "Mark as unread" : "Mark as read";
  return (
    <div className="ml-4 flex items-center gap-2">
      <button
        type="button"
        onClick={onToggleRead}
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        title={label}
        aria-label={label}
      >
        {notification.is_read ? <EnvelopeIcon className="h-5 w-5" /> : <EnvelopeOpenIcon className="h-5 w-5" />}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
        title="Delete notification"
        aria-label="Delete notification"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

/**
 * Renders title metadata and actions for a notification.
 * @param props - The component props.
 */
export const NotificationDetailHeader = (props: NotificationDetailHeaderProps) => (
  <div className="flex items-start justify-between px-6 py-5">
    <NotificationDetailMeta notification={props.notification} />
    <NotificationDetailActions {...props} />
  </div>
);
