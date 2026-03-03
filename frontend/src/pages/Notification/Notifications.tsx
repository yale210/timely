import type React from "react";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { NotificationsHeader } from "@/components/notifications/NotificationsHeader";
import { NotificationsList } from "@/components/notifications/NotificationsList";
import { PushNotificationBanner } from "@/components/notifications/PushNotificationBanner";
import { useNotificationsPage } from "@/hooks/notifications/useNotificationsPage";

/**
 * Renders the notifications inbox page.
 */
export const Notifications: React.FC = () => {
  const { state, actions } = useNotificationsPage();

return (
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
);
};
