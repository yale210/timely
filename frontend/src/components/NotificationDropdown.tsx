import React from 'react';
import { Popover, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { type Notification } from '../types/notification';
import { NotificationCard } from './NotificationCard';
import { NotificationBell } from './NotificationBell';
import { Link } from 'react-router-dom';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onItemClick: (notification: Notification) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ 
  notifications, 
  unreadCount,
  onMarkAllRead,
  onItemClick
}) => {
  const displayNotifications = notifications.slice(0, 5);

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button as="div" className="focus:outline-none cursor-pointer">
            <NotificationBell unreadCount={unreadCount} onClick={() => {}} />
          </Popover.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute right-0 z-10 mt-3 w-80 transform px-4 sm:px-0 lg:max-w-3xl">
              <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="bg-white">
                  <div className="p-4 border-b flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
                    <button 
                      onClick={onMarkAllRead}
                      className="text-xs text-indigo-600 hover:text-indigo-500 font-medium"
                    >
                      Mark all read
                    </button>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {displayNotifications.length > 0 ? (
                      displayNotifications.map((notification) => (
                        <NotificationCard 
                          key={notification.id} 
                          notification={notification} 
                          onClick={onItemClick}
                        />
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        No notifications
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 text-center border-t">
                    <Link 
                      to="/notifications" 
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Show all notifications
                    </Link>
                  </div>
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};
