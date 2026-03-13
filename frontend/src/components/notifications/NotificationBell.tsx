import type React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

interface NotificationBellProps {
  unreadCount: number;
  onClick?: () => void;
  as?: 'button' | 'div';
}

/**
 * A reusable notification bell component.
 *
 * This component displays a bell icon with an optional unread count badge.
 * It can be rendered as either a button or a div.
 * @param props - The component's properties.
 * @param props.unreadCount - The number of unread notifications to display.
 * @param props.onClick - An optional callback function to execute when the bell is clicked.
 * @param props.as - Determines the container element type, defaulting to 'button'.
 * @returns The rendered notification bell.
 */
export const NotificationBell: React.FC<NotificationBellProps> = ({ 
  unreadCount, 
  onClick,
  as = 'button'
}) => {
  const Component = as;
  
  return (
    <Component
      type={as === 'button' ? 'button' : undefined}
      className="relative inline-flex h-6 w-6 items-center justify-center text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
      onClick={onClick}
      aria-label="View notifications"
    >
      <BellIcon className="h-5 w-5" aria-hidden="true" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 flex h-3.5 w-3.5 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-1 ring-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Component>
  );
};
