import type React from "react";
import AppLayout from "@/layouts/AppLayout";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { NotificationsHeader } from "@/components/notifications/NotificationsHeader";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { PushNotificationBanner } from "@/components/notifications/PushNotificationBanner";
import { useNotificationsPage, type NotificationFilterTab, type ListConfirmationAction } from "@/hooks/notifications/useNotificationsPage";
import { useFriendships } from "@/hooks/friends/useFriendships";
import { authStore } from "@/services/authService";
import { type Friendship, type Notification } from "@/types";

/**
 * Renders an individual friend request item.
 * @param root0 - Props.
 * @param root0.friendship - Friendship data.
 * @param root0.onAccept - Accept callback.
 * @param root0.onDecline - Decline callback.
 * @param root0.isActing - Whether action is in progress.
 */
const FriendRequestItem: React.FC<{ friendship: Friendship; onAccept: (id: number) => void; onDecline: (id: number) => void; isActing: boolean }> = ({ friendship, onAccept, onDecline, isActing }) => {
  const senderLabel = friendship.sender_username ?? `User #${friendship.sender}`;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 overflow-hidden rounded-full border border-gray-200 bg-white">
          {friendship.sender_avatar ? (
            <img src={friendship.sender_avatar} alt={senderLabel} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm font-semibold text-gray-500">
              {(friendship.sender_username ?? "U").slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold">{senderLabel}</p>
          <p className="text-xs text-gray-500">{friendship.sender_name ?? "Request pending"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => void onAccept(friendship.id)} disabled={isActing} className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400 disabled:bg-gray-300">Accept</button>
        <button type="button" onClick={() => void onDecline(friendship.id)} disabled={isActing} className="rounded-md bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-300 disabled:bg-gray-200">Decline</button>
      </div>
    </li>
  );
};

/**
 * Renders the friend requests section.
 * @param root0 - Props.
 * @param root0.loading - Loading state.
 * @param root0.requests - List of requests.
 * @param root0.error - Error message.
 * @param root0.onAccept - Accept callback.
 * @param root0.onDecline - Decline callback.
 * @param root0.actingIds - IDs currently performing action.
 */
const FriendRequestSection: React.FC<{ loading: boolean; requests: Friendship[]; error: string | null; onAccept: (id: number) => void; onDecline: (id: number) => void; actingIds: Set<number> }> = ({ loading, requests, error, onAccept, onDecline, actingIds }) => {
  if (!loading && requests.length === 0 && !error) return null;
  return (
    <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-gray-900">Friend requests</h2><span className="text-xs font-semibold text-gray-400">{requests.length} pending</span></div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : loading ? <p className="mt-3 text-sm text-gray-500">Loading...</p> : (
        <ul className="mt-4 space-y-3">{requests.map((f) => <FriendRequestItem key={f.id} friendship={f} onAccept={onAccept} onDecline={onDecline} isActing={actingIds.has(f.id)} />)}</ul>
      )}
    </section>
  );
};

interface ModalsProps {
  state: { confirmAction: ListConfirmationAction; notificationPendingDelete: Notification | null };
  actions: { setConfirmAction: (a: ListConfirmationAction) => void; handleConfirmBulkAction: () => Promise<void>; setNotificationPendingDelete: (n: Notification | null) => void; handleDeleteNotification: (n: Notification) => Promise<void> };
}

/**
 * Renders the confirmation modals.
 * @param root0 - Props.
 * @param root0.state - Page state.
 * @param root0.actions - Page actions.
 */
const NotificationModals: React.FC<ModalsProps> = ({ state, actions }) => (
  <>
    <ConfirmationModal isOpen={state.confirmAction !== null} onClose={() => actions.setConfirmAction(null)} onConfirm={() => { void actions.handleConfirmBulkAction(); }} title={state.confirmAction === "delete_all" ? "Delete all notifications?" : "Mark all as read?"} message={state.confirmAction === "delete_all" ? "This will permanently remove all notifications from your inbox." : "This will mark all notifications as read."} confirmText={state.confirmAction === "delete_all" ? "Delete all" : "Mark all"} />
    <ConfirmationModal isOpen={state.notificationPendingDelete !== null} onClose={() => actions.setNotificationPendingDelete(null)} onConfirm={() => { if (state.notificationPendingDelete) void actions.handleDeleteNotification(state.notificationPendingDelete); }} title="Delete notification?" message="This action cannot be undone." confirmText="Delete" />
  </>
);

/**
 * Renders the notifications inbox page.
 */
export const Notifications: React.FC = () => {
  const { state, actions } = useNotificationsPage();
  const userId = authStore.getUser()?.id ?? null;
  const { friendships, loading: fLoading, error: fError, acceptRequest, declineRequest, actingIds } = useFriendships();
  const requests = friendships.filter((f) => f.state === "SENT" && f.receiver === userId);

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <PushNotificationBanner />
        <NotificationsHeader activeTab={state.activeTab} onTabChange={(t: NotificationFilterTab) => actions.setTab(t)} onMarkAllRead={() => actions.setConfirmAction("mark_all_read")} onDeleteAll={() => actions.setConfirmAction("delete_all")} />
        {state.displayError && <div className="mb-6 rounded-md bg-red-50 p-4"><p className="text-sm text-red-700">{state.displayError}</p></div>}
        <FriendRequestSection loading={fLoading} requests={requests} error={fError} onAccept={(id) => { void acceptRequest(id); }} onDecline={(id) => { void declineRequest(id); }} actingIds={actingIds} />
        <NotificationsList notifications={state.notifications} page={state.page} totalPages={state.totalPages} paginationWindow={state.paginationWindow} loading={state.loading} contextLoading={state.contextLoading} onNotificationClick={(n: Notification) => void actions.handleNotificationClick(n)} onToggleRead={(n: Notification) => void actions.handleToggleRead(n)} onDeleteRequest={(n: Notification) => actions.setNotificationPendingDelete(n)} onPageChange={(p: number) => actions.setPage(p)} />
        <NotificationModals state={state} actions={actions} />
      </div>
    </AppLayout>
  );
};
