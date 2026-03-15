import type React from "react";
import AppLayout from "@/layouts/AppLayout";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { NotificationsHeader } from "@/components/notifications/NotificationsHeader";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { PushNotificationBanner } from "@/components/notifications/PushNotificationBanner";
import { useNotificationsPage } from "@/hooks/notifications/useNotificationsPage";
import { useFriendships } from "@/hooks/friends/useFriendships";
import { authStore } from "@/services/authService";

/**
 * Renders the notifications inbox page.
 */
export const Notifications: React.FC = () => {
  const { state, actions } = useNotificationsPage();
  const user = authStore.getUser();
  const currentUserId = user?.id ?? null;
  const {
    friendships,
    loading: friendshipsLoading,
    error: friendshipsError,
    acceptRequest,
    declineRequest,
    actingIds,
  } = useFriendships();
  const incomingRequests = friendships.filter(
    (friendship) => friendship.state === "SENT" && friendship.receiver === currentUserId,
  );

return (
  <AppLayout>
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PushNotificationBanner />

      <NotificationsHeader
        activeTab={state.activeTab}
        onTabChange={actions.setTab}
        onMarkAllRead={() => actions.setConfirmAction("mark_all_read")}
        onDeleteAll={() => actions.setConfirmAction("delete_all")}
      />

      {state.displayError && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{state.displayError}</p>
        </div>
      )}

      {(friendshipsLoading || incomingRequests.length > 0 || friendshipsError) && (
        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Friend requests</h2>
            <span className="text-xs font-semibold text-gray-400">
              {incomingRequests.length} pending
            </span>
          </div>
          {friendshipsError ? (
            <p className="mt-3 text-sm text-red-600">{friendshipsError}</p>
          ) : friendshipsLoading ? (
            <p className="mt-3 text-sm text-gray-500">Loading friend requests...</p>
          ) : incomingRequests.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">No pending friend requests.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {incomingRequests.map((friendship) => (
                <li key={friendship.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-gray-200 bg-white">
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
                    <div>
                      <p className="text-sm font-semibold">
                        {friendship.sender_username ?? `User #${friendship.sender}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {friendship.sender_name ?? "Request pending"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void acceptRequest(friendship.id)}
                      disabled={actingIds.has(friendship.id)}
                      className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => void declineRequest(friendship.id)}
                      disabled={actingIds.has(friendship.id)}
                      className="rounded-md bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-200"
                    >
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <NotificationsList
        notifications={state.notifications}
        page={state.page}
        totalPages={state.totalPages}
        paginationWindow={state.paginationWindow}
        loading={state.loading}
        contextLoading={state.contextLoading}
        onNotificationClick={(notification) => {
          void actions.handleNotificationClick(notification);
        }}
        onToggleRead={(notification) => {
          void actions.handleToggleRead(notification);
        }}
        onDeleteRequest={actions.setNotificationPendingDelete}
        onPageChange={actions.setPage}
      />

      <ConfirmationModal
        isOpen={state.confirmAction !== null}
        onClose={() => actions.setConfirmAction(null)}
        onConfirm={() => {
          void actions.handleConfirmBulkAction();
        }}
        title={state.confirmAction === "delete_all" ? "Delete all notifications?" : "Mark all as read?"}
        message={
          state.confirmAction === "delete_all"
            ? "This will permanently remove all notifications from your inbox."
            : "This will mark all notifications as read."
        }
        confirmText={state.confirmAction === "delete_all" ? "Delete all" : "Mark all"}
      />

      <ConfirmationModal
        isOpen={state.notificationPendingDelete !== null}
        onClose={() => actions.setNotificationPendingDelete(null)}
        onConfirm={() => {
          if (state.notificationPendingDelete) {
            void actions.handleDeleteNotification(state.notificationPendingDelete);
          }
        }}
        title="Delete notification?"
        message="This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  </AppLayout>
);
};
