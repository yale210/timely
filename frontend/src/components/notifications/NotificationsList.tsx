import { NotificationCard } from "@/components/notifications/NotificationCard";
import { type Notification } from "@/types";

interface NotificationsListProps {
  notifications: Notification[];
  page: number;
  totalPages: number;
  paginationWindow: number[];
  loading: boolean;
  contextLoading: boolean;
  onNotificationClick: (notification: Notification) => void;
  onToggleRead: (notification: Notification) => void;
  onDeleteRequest: (notification: Notification) => void;
  onPageChange: (page: number) => void;
}

/**
 * Renders the notification cards list with pagination controls.
 * @param props - Notification list state and interaction handlers.
 * @returns The notification list container.
 */
export const NotificationsList = (props: NotificationsListProps) => {
  const {
    notifications,
    page,
    totalPages,
    paginationWindow,
    loading,
    contextLoading,
    onNotificationClick,
    onToggleRead,
    onDeleteRequest,
    onPageChange,
  } = props;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {notifications.length > 0 ? (
        <>
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onClick={onNotificationClick}
              onToggleRead={onToggleRead}
              onDelete={onDeleteRequest}
              showActions
              unreadIndicatorPlacement="left"
            />
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <button
                type="button"
                onClick={() => onPageChange(Math.max(1, page - 1))}
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
                    onClick={() => onPageChange(pageNumber)}
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
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
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
  );
};

