import type React from "react";
import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { NotificationDetailBody } from "@/components/notifications/NotificationDetailBody";
import { NotificationDetailHeader } from "@/components/notifications/NotificationDetailHeader";
import { useNotificationDetail } from "@/hooks/notifications/useNotificationDetail";

/**
 * Renders a single notification detail page.
 */
export const NotificationDetail: React.FC = () => {
  const { state, loading, error, actions } = useNotificationDetail();

if (loading) {
  return <div className="p-8 text-center">Loading...</div>;
}

if (error || !state.notification) {
  return (
    <div className="p-8 text-center text-red-500">{error ?? "Notification not found"}</div>
  );
}

return (
  <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-6">
      <Link
        to="/notifications"
        className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
      >
        <ArrowLeftIcon className="mr-1 h-4 w-4" />
        Back to notifications
      </Link>
    </div>

    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <NotificationDetailHeader
        notification={state.notification}
        onToggleRead={() => {
          void actions.handleToggleRead();
        }}
        onDelete={() => actions.setDeleteOpen(true)}
      />
      <NotificationDetailBody message={state.notification.message} />
    </div>

    <ConfirmationModal
      isOpen={state.isDeleteOpen}
      onClose={() => actions.setDeleteOpen(false)}
      onConfirm={() => {
        void actions.handleDelete();
      }}
      title="Delete notification?"
      message="This action cannot be undone."
      confirmText="Delete"
    />
  </div>
);
};
