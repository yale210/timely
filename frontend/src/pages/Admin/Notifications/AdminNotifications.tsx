import { InformationCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { AdminBroadcastForm } from "@/components/admin/notifications/AdminBroadcastForm";
import { AdminLivePreview } from "@/components/admin/notifications/AdminLivePreview";
import { useAdminBroadcastForm } from "@/hooks/admin/notifications/useAdminBroadcastForm";

/**
 * Renders the admin broadcast composer and delivery preview panel.
 */
export const AdminNotifications = () => {
  const { state, loading, error, constants, actions } = useAdminBroadcastForm();

return (
  <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-indigo-600">Admin tools</p>
        <h1 className="text-3xl font-semibold text-gray-900">Admin notifications</h1>
        <p className="mt-2 text-sm text-gray-600">
          Broadcast announcements to all users, staff, admins, or specific accounts.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="rounded-full bg-indigo-50 px-4 py-2 text-sm text-indigo-700">
          Delivered via push notifications
        </div>
      </div>
    </div>

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <AdminBroadcastForm
        title={state.formData.title}
        message={state.formData.message}
        target={state.formData.target}
        userIdsInput={state.formData.userIdsInput}
        confirmationChecked={state.formData.confirmationChecked}
        audienceCounts={state.audience.audienceCounts}
        targetAudienceCount={state.audience.targetAudienceCount}
        users={state.users.users}
        selectedUserIds={state.users.selectedUserIds}
        usersPage={state.users.usersPage}
        usersCount={state.users.usersCount}
        usersPageSize={constants.usersPageSize}
        search={state.users.search}
        roleFilter={state.users.roleFilter}
        hasUsersNextPage={state.users.hasUsersNextPage}
        hasUsersPreviousPage={state.users.hasUsersPreviousPage}
        isAllVisibleSelected={state.users.isAllVisibleSelected}
        isSubmitting={loading.isSubmitting}
        isUsersLoading={loading.isUsersLoading}
        usersError={error.users}
        titleLimit={constants.titleLimit}
        messageLimit={constants.messageLimit}
        canSubmit={state.canSubmit}
        error={error.form}
        targetOptions={constants.targetOptions}
        onSubmit={actions.handleSubmit}
        onTitleChange={actions.setTitle}
        onMessageChange={actions.setMessage}
        onTargetChange={actions.setTarget}
        onConfirmationChange={actions.setConfirmationChecked}
        onSearchChange={actions.setSearch}
        onRoleFilterChange={actions.setRoleFilter}
        onUsersPageChange={actions.setUsersPage}
        onToggleSelectAll={actions.toggleSelectAll}
        onToggleUserSelection={actions.toggleUserSelection}
        onUserIdsInputChange={actions.setUserIdsInput}
      />

      <aside className="space-y-6">
        <AdminLivePreview
          title={state.preview.previewTitle}
          message={state.preview.previewMessage}
        />

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Delivery status</h2>
            <Link
              to="/admin/notifications/history"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
              title="Notification history"
            >
              <ClockIcon className="h-5 w-5" />
            </Link>
          </div>
          {state.delivery.deliveryStatus ? (
            <div className="mt-4 space-y-2 text-sm">
              <p className="text-gray-600">
                Broadcast ID:{" "}
                <span className="font-medium text-gray-800">{state.delivery.deliveryStatus.id}</span>
              </p>
              <p className={state.delivery.statusTone}>
                Status: <span className="font-semibold">{state.delivery.statusLabel}</span>
              </p>
              <p className="text-gray-600">
                Delivered: {state.delivery.deliveryStatus.delivered_count}/
                {state.delivery.deliveryStatus.recipient_count}
              </p>
              <p className="text-gray-600">Failed: {state.delivery.deliveryStatus.failed_count}</p>
              <p className="text-xs text-gray-500">Task ID: {state.delivery.deliveryStatus.task_id}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">No broadcasts queued yet.</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Broadcast tips</h2>
          <ul className="mt-3 space-y-3 text-sm text-gray-600">
            <li className="flex gap-2">
              <InformationCircleIcon className="mt-0.5 h-4 w-4 text-indigo-500" />
              Keep messages concise (title up to 60 chars, body up to 240 chars).
            </li>
            <li className="flex gap-2">
              <InformationCircleIcon className="mt-0.5 h-4 w-4 text-indigo-500" />
              Validate your audience before confirming send.
            </li>
            <li className="flex gap-2">
              <InformationCircleIcon className="mt-0.5 h-4 w-4 text-indigo-500" />
              Push notifications are delivered immediately after queueing.
            </li>
          </ul>
        </div>
      </aside>
    </div>

    <ConfirmationModal
      isOpen={state.isConfirmModalOpen}
      onClose={() => actions.setConfirmModalOpen(false)}
      onConfirm={() => {
        void actions.handleConfirmSend();
      }}
      title="Send this broadcast?"
      message={`You are about to notify ${state.audience.targetAudienceCount} recipients.`}
      confirmText="Send now"
    />
  </div>
);
}
