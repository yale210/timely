import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

interface NotificationBellProps {
  unreadCount: number;
  onClick?: () => void;
  as?: 'button' | 'div';
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ 
  unreadCount, 
  onClick,
  as = 'button'
}) => {
  const Component = as;
  
  return (
    <Component
      type={as === 'button' ? 'button' : undefined}
      className="relative p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      onClick={onClick}
      aria-label="View notifications"
    >
      <BellIcon className="h-6 w-6" aria-hidden="true" />
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 block h-4 w-4 transform translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Component>
  );
};
