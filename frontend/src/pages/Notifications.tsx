import type React from 'react';
import { useNotificationContext } from '../context/NotificationContext';
import { NotificationCard } from '../components/NotificationCard';
import { useNavigate } from 'react-router-dom';
import { type Notification } from '../types/notification';
import { usePushSubscription } from '../hooks/usePushSubscription';

const PushNotificationBanner = () => {
  const { isSupported, isSubscribed, permission, loading, error, subscribe, unsubscribe } =
    usePushSubscription();

  if (!isSupported) return null;

  if (permission === "denied") {
    return (
      <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start gap-3">
          <span className="material-icons text-yellow-600 mt-0.5">notifications_off</span>
          <div>
            <p className="text-sm font-medium text-yellow-800">Push notifications blocked</p>
            <p className="text-sm text-yellow-700 mt-1">
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
            <span className="material-icons text-green-600 mt-0.5">notifications_active</span>
            <div>
              <p className="text-sm font-medium text-green-800">Push notifications enabled</p>
              <p className="text-sm text-green-700 mt-1">
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
          <span className="material-icons text-indigo-600 mt-0.5">notifications</span>
          <div>
            <p className="text-sm font-medium text-indigo-800">Enable push notifications</p>
            <p className="text-sm text-indigo-700 mt-1">
              Get browser notifications for event reminders and important updates, even when
              this tab isn&apos;t active.
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
        <div className="mt-3 rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

/**
 * A page component that displays the user's full list of notifications.
 *
 * This component provides pagination and functionality to mark all
 * notifications as read, view individual notification details, or enable
 * push notifications through specialized helper components.
 * @returns The rendered notification list page.
 */
export const Notifications: React.FC = () => {
  const { 
    notifications, 
    loading, 
    error, 
    hasMore, 
    page, 
    fetchNotifications, 
    markAllRead,
    markRead
  } = useNotificationContext();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
    void markRead(notification.id);
    void navigate(`/notifications/${notification.id}`);
  };

  const handleLoadMore = () => {
    void fetchNotifications(page + 1);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <PushNotificationBanner />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <button
          onClick={() => void markAllRead()}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Mark all as read
        </button>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        {notifications.length > 0 ? (
          <>
            {notifications.map((notification) => (
              <NotificationCard 
                key={notification.id} 
                notification={notification} 
                onClick={handleNotificationClick}
              />
            ))}
            {hasMore && (
              <div className="p-4 text-center border-t">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            {loading ? (
              <p className="text-gray-500">Loading notifications...</p>
            ) : (
              <p className="text-gray-500">You have no notifications.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
