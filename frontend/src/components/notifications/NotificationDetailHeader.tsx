import { EnvelopeIcon, EnvelopeOpenIcon, TrashIcon } from "@heroicons/react/24/outline";
import { type Notification } from "@/types/notification";

interface NotificationDetailHeaderProps {
  notification: Notification;
  onToggleRead: () => void;
  onDelete: () => void;
}

/**
 * Renders title metadata and actions for a notification.
 * @param props - Notification data and action handlers.
 * @returns The notification detail header row.
 */
export const NotificationDetailHeader = (props: NotificationDetailHeaderProps) => {
  const { notification, onToggleRead, onDelete } = props;

  return (
    <div className="flex items-start justify-between px-6 py-5">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold text-gray-900">{notification.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{new Date(notification.timestamp).toLocaleString()}</p>
        {notification.sender_username && (
          <p className="mt-1 text-xs text-gray-500">
            Sent by <span className="font-medium text-gray-700">{notification.sender_username}</span>
          </p>
        )}
      </div>
      <div className="ml-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleRead}
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
          onClick={onDelete}
          className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600"
          title="Delete notification"
          aria-label="Delete notification"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
