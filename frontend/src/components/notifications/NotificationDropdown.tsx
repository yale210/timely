import type React from "react";
import { Popover, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { type Notification } from "@/types/notification";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Link } from "react-router-dom";
import { useFriendships } from "@/hooks/friends/useFriendships";
import { authStore } from "@/services/authService";

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onItemClick: (notification: Notification) => void;
  onToggleRead: (notification: Notification) => Promise<void> | void;
  onDeleteItem: (notification: Notification) => Promise<void> | void;
}

/**
 * Popover dropdown that displays the most recent notifications with bulk actions.
 * @param root0 - The component props.
 * @param root0.notifications - Array of notifications to display.
 * @param root0.unreadCount - Number of unread notifications.
 * @param root0.onItemClick - Callback when a notification item is clicked.
 * @param root0.onToggleRead - Callback to toggle read/unread state of a notification.
 * @param root0.onDeleteItem - Callback to delete a single notification.
 */
export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  onItemClick,
  onToggleRead,
  onDeleteItem,
}) => {
  const displayNotifications = notifications.slice(0, 5);
  const user = authStore.getUser();
  const currentUserId = user?.id ?? null;
  const { friendships, acceptRequest, declineRequest, actingIds } = useFriendships();
  const incomingRequests = friendships.filter(
    (friendship) => friendship.state === "SENT" && friendship.receiver === currentUserId,
  ).slice(0, 3);
  const totalBadgeCount = unreadCount + incomingRequests.length;

  return (
    <>
      <Popover className="relative flex h-6 items-center">
        {() => (
          <>
            <Popover.Button as="div" className="flex h-6 items-center focus:outline-none cursor-pointer">
              <NotificationBell unreadCount={totalBadgeCount} />
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
              <Popover.Panel className="absolute right-0 top-full z-10 mt-2 w-96 px-4 sm:px-0">
                <div className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5 bg-white">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">
                      Notifications ({totalBadgeCount})
                    </h3>
                  </div>

                  <div className="max-h-105 space-y-2 overflow-y-auto px-3 pb-3">
                    {incomingRequests.map((friendship) => (
                      <div
                        key={`friend-${friendship.id}`}
                        className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3"
                      >
                        <div className="mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-white">
                          {friendship.sender_avatar ? (
                            <img
                              src={friendship.sender_avatar}
                              alt={friendship.sender_username ?? `User #${friendship.sender}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm font-semibold text-gray-500">
                              {(friendship.sender_username ?? "U").slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900">Friend request</p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {friendship.sender_username ?? `User #${friendship.sender}`}
                          </p>
                          {friendship.sender_name && (
                            <p className="text-[11px] text-gray-400">{friendship.sender_name}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => void acceptRequest(friendship.id)}
                            disabled={actingIds.has(friendship.id)}
                            className="rounded-md bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-gray-300"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => void declineRequest(friendship.id)}
                            disabled={actingIds.has(friendship.id)}
                            className="rounded-md bg-gray-200 px-2 py-1 text-[10px] font-semibold text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-200"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}

                    {displayNotifications.length > 0 ? (
                      displayNotifications.map((notification) => (
                        <NotificationCard
                          key={notification.id}
                          notification={notification}
                          onClick={onItemClick}
                          onToggleRead={(item) => {
                            void onToggleRead(item);
                          }}
                          onDelete={(item) => {
                            void onDeleteItem(item);
                          }}
                          showActions
                          showReadToggle={false}
                          showDivider={false}
                          compact
                        />
                      ))
                    ) : incomingRequests.length === 0 ? (
                      <div className="px-6 py-12 text-center text-sm text-gray-500">
                        No notifications
                      </div>
                    ) : null}
                  </div>

                  {displayNotifications.length > 0 && (
                    <div className="bg-gray-50 px-3 py-2 text-center">
                      <Link
                        to="/notifications"
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                      >
                        View all notifications
                      </Link>
                    </div>
                  )}
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </>
  );
};

