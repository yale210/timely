import type React from "react";
import { Popover, Transition } from "@headlessui/react";
import { Fragment, useCallback } from "react";
import { type Notification, type Friendship } from "@/types";
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
 * Renders the avatar or initial for a friend request.
 * @param root0 - The component props.
 * @param root0.friendship - The friendship data.
 */
const FriendAvatar: React.FC<{ friendship: Friendship }> = ({ friendship }) => (
  <div className="mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-white">
    {friendship.sender_avatar ? (
      <img src={friendship.sender_avatar} alt={friendship.sender_username ?? "User"} className="h-full w-full object-cover" />
    ) : (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm font-semibold text-gray-500">
        {(friendship.sender_username ?? "U").slice(0, 1).toUpperCase()}
      </div>
    )}
  </div>
);

/**
 * Renders an individual friend request card in the dropdown.
 * @param root0 - The component props.
 * @param root0.friendship - The friendship data.
 * @param root0.acceptRequest - Callback to accept the friend request.
 * @param root0.declineRequest - Callback to decline the friend request.
 * @param root0.isActing - Whether an action is currently being performed on this request.
 */
const FriendRequestCard: React.FC<{
  friendship: Friendship;
  acceptRequest: (id: number) => void;
  declineRequest: (id: number) => void;
  isActing: boolean;
}> = ({ friendship, acceptRequest, declineRequest, isActing }) => (
  <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3">
    <FriendAvatar friendship={friendship} />
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-gray-900">Friend request</p>
      <p className="mt-0.5 text-xs text-gray-500">{friendship.sender_username ?? `User #${friendship.sender}`}</p>
      {friendship.sender_name && <p className="text-[11px] text-gray-400">{friendship.sender_name}</p>}
    </div>
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => { acceptRequest(friendship.id); }} disabled={isActing} className="rounded-md bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-white hover:bg-emerald-400 disabled:bg-gray-300">Accept</button>
      <button type="button" onClick={() => { declineRequest(friendship.id); }} disabled={isActing} className="rounded-md bg-gray-200 px-2 py-1 text-[10px] font-semibold text-gray-700 hover:bg-gray-300 disabled:bg-gray-200">Decline</button>
    </div>
  </div>
);

/** Renders the footer of the notification dropdown. */
const DropdownFooter: React.FC = () => (
  <div className="bg-gray-50 px-3 py-2 text-center">
    <Link to="/notifications" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">View all notifications</Link>
  </div>
);

/**
 * Popover dropdown that displays the most recent notifications with bulk actions.
 * @param root0 - The component props.
 * @param root0.notifications - The list of notifications to display.
 * @param root0.unreadCount - The number of unread notifications.
 * @param root0.onItemClick - Callback for when a notification is clicked.
 * @param root0.onToggleRead - Callback to toggle the read status of a notification.
 * @param root0.onDeleteItem - Callback to delete a notification.
 */
export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications, unreadCount, onItemClick, onToggleRead, onDeleteItem,
}) => {
  const user = authStore.getUser();
  const { friendships, acceptRequest, declineRequest, actingIds } = useFriendships();
  const requests = friendships.filter((f) => f.state === "SENT" && f.receiver === user?.id).slice(0, 3);
  const displayNotifs = notifications.slice(0, 5);
  const total = unreadCount + requests.length;

  const handleToggle = useCallback((n: Notification) => { void onToggleRead(n); }, [onToggleRead]);
  const handleDelete = useCallback((n: Notification) => { void onDeleteItem(n); }, [onDeleteItem]);

  return (
    <Popover className="relative flex h-6 items-center">
      <Popover.Button as="div" className="flex h-6 items-center focus:outline-none cursor-pointer"><NotificationBell unreadCount={total} /></Popover.Button>
      <Transition as={Fragment} enter="transition ease-out duration-200" enterFrom="opacity-0 translate-y-1" enterTo="opacity-100 translate-y-0" leave="transition ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-1">
        <Popover.Panel className="absolute right-0 top-full z-10 mt-2 w-96 px-4 sm:px-0">
          <div className="overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5 bg-white">
            <div className="px-4 py-3"><h3 className="text-base font-semibold text-gray-900">Notifications ({total})</h3></div>
            <div className="max-h-105 space-y-2 overflow-y-auto px-3 pb-3">
              {requests.map((f) => <FriendRequestCard key={f.id} friendship={f} acceptRequest={(id) => { void acceptRequest(id); }} declineRequest={(id) => { void declineRequest(id); }} isActing={actingIds.has(f.id)} />)}
              {displayNotifs.map((n) => <NotificationCard key={n.id} notification={n} onClick={onItemClick} onToggleRead={handleToggle} onDelete={handleDelete} showActions showReadToggle={false} showDivider={false} compact />)}
              {displayNotifs.length === 0 && requests.length === 0 && (
                <div className="px-6 py-12 text-center text-sm text-gray-500">No notifications</div>
              )}
            </div>
            {displayNotifs.length > 0 && <DropdownFooter />}
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};
