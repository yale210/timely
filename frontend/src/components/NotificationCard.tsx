import type React from 'react';
import { type Notification, NotificationType } from '../types/notification';
import { 
  BellIcon, 
  InformationCircleIcon, 
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface NotificationCardProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

/**
 * A component representing an individual notification in a list.
 *
 * This component displays notification details, including an icon determined
 * by the notification type, the title, and the timestamp.
 * @param props - The component's properties.
 * @param props.notification - The notification data object to display.
 * @param props.onClick - A callback function executed when the card is clicked.
 * @returns The rendered notification card.
 */
export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, onClick }) => {
  const getIcon = () => {
    switch (notification.notification_type) {
      case NotificationType.REMINDER:
        return <BellIcon className="h-6 w-6 text-blue-500" />;
      case NotificationType.ADMIN:
        return <InformationCircleIcon className="h-6 w-6 text-purple-500" />;
      case NotificationType.SYSTEM:
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      default:
        return <InformationCircleIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div 
      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
        notification.is_read ? 'bg-white' : 'bg-blue-50'
      }`}
      onClick={() => onClick(notification)}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <p className={`text-sm font-medium ${notification.is_read ? 'text-gray-900' : 'text-blue-900'}`}>
              {notification.title}
            </p>
            <p className="text-xs text-gray-500">
              {formatTimestamp(notification.timestamp)}
            </p>
          </div>
          <p className={`mt-1 text-sm line-clamp-2 ${notification.is_read ? 'text-gray-500' : 'text-blue-700'}`}>
            {notification.message}
          </p>
        </div>
      </div>
    </div>
  );
};
