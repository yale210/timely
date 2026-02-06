import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationCard } from '../components/NotificationCard';
import { useNavigate } from 'react-router-dom';
import { type Notification } from '../types/notification';

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
  } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
    markRead(notification.id);
    navigate(`/notifications/${notification.id}`);
  };

  const handleLoadMore = () => {
    fetchNotifications(page + 1);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <button
          onClick={markAllRead}
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
