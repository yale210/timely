import { Popover, Transition } from "@headlessui/react";
import { Fragment, useCallback } from "react";
import { type Notification, type Friendship } from "@/types";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getPendingFriendRequests } from "@/components/notifications/notificationDropdownUtils";
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

interface FriendAvatarProps {
  friendship: Friendship;
}

const FriendAvatar = ({ friendship }: FriendAvatarProps) => (
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

interface FriendRequestCardProps {
  friendship: Friendship;
  acceptRequest: (id: number) => void;
  declineRequest: (id: number) => void;
  isActing: boolean;
}

const FriendRequestCard = ({ friendship, acceptRequest, declineRequest, isActing }: FriendRequestCardProps) => (
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

const DropdownFooter = () => (
  <div className="bg-gray-50 px-3 py-2 text-center">
    <Link to="/notifications" className="text-sm font-semibold text-indigo-600 hover:text-indigo-500">View all notifications</Link>
  </div>
);

interface NotificationDropdownPanelProps {
  total: number;
  requests: Friendship[];
  notifications: Notification[];
  actingIds: Set<number>;
  onItemClick: (notification: Notification) => void;
  onToggleRead: (notification: Notification) => void;
  onDeleteItem: (notification: Notification) => void;
  onAcceptRequest: (id: number) => void;
  onDeclineRequest: (id: number) => void;
}

const NotificationDropdownPanel = ({
  total,
  requests,
  notifications,
  actingIds,
  onItemClick,
  onToggleRead,
  onDeleteItem,
  onAcceptRequest,
  onDeclineRequest,
}: NotificationDropdownPanelProps) => (
  <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
    <div className="px-4 py-3"><h3 className="text-base font-semibold text-gray-900">Notifications ({total})</h3></div>
    <div className="max-h-[60vh] space-y-2 overflow-y-auto px-3 pb-3 sm:max-h-105">
      {requests.map((friendship) => <FriendRequestCard key={friendship.id} friendship={friendship} acceptRequest={onAcceptRequest} declineRequest={onDeclineRequest} isActing={actingIds.has(friendship.id)} />)}
      {notifications.map((notification) => <NotificationCard key={notification.id} notification={notification} onClick={onItemClick} onToggleRead={onToggleRead} onDelete={onDeleteItem} showActions showReadToggle={false} showDivider={false} compact />)}
      {notifications.length === 0 && requests.length === 0 && <div className="px-6 py-12 text-center text-sm text-gray-500">No notifications</div>}
    </div>
    {notifications.length > 0 && <DropdownFooter />}
  </div>
);

/**
 * Displays the notification popover with recent notifications and friend requests.
 * @param root0 - Dropdown props.
 * @param root0.notifications - Recent notifications to render.
 * @param root0.unreadCount - Current unread notification count.
 * @param root0.onItemClick - Handles notification selection.
 * @param root0.onToggleRead - Toggles notification read state.
 * @param root0.onDeleteItem - Deletes a notification.
 */
export const NotificationDropdown = ({ notifications, unreadCount, onItemClick, onToggleRead, onDeleteItem }: NotificationDropdownProps) => {
  const user = authStore.getUser();
  const { friendships, acceptRequest, declineRequest, actingIds } = useFriendships();
  const requests = getPendingFriendRequests(friendships, user?.id);
  const displayNotifications = notifications.slice(0, 5);
  const total = unreadCount + requests.length;

  const handleToggle = useCallback((n: Notification) => { void onToggleRead(n); }, [onToggleRead]);
  const handleDelete = useCallback((n: Notification) => { void onDeleteItem(n); }, [onDeleteItem]);

  return (
    <Popover className="relative flex h-6 items-center">
      <Popover.Button aria-label="View notifications" type="button" className="cursor-pointer focus:outline-none flex h-6 items-center"><NotificationBell unreadCount={total} as="div" isDecorative /></Popover.Button>
      <Transition as={Fragment} enter="transition ease-out duration-200" enterFrom="opacity-0 translate-y-1" enterTo="opacity-100 translate-y-0" leave="transition ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-1">
        <Popover.Panel className="fixed inset-x-3 top-14 z-50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
          <NotificationDropdownPanel total={total} requests={requests} notifications={displayNotifications} actingIds={actingIds} onItemClick={onItemClick} onToggleRead={handleToggle} onDeleteItem={handleDelete} onAcceptRequest={(id) => { void acceptRequest(id); }} onDeclineRequest={(id) => { void declineRequest(id); }} />
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};
