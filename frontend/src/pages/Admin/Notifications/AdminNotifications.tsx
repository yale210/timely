import AppLayout from "@/layouts/AppLayout";
import { AdminBroadcastForm } from "@/components/admin/notifications/AdminBroadcastForm";
import { AdminLivePreview } from "@/components/admin/notifications/AdminLivePreview";
import { useAdminBroadcastForm } from "@/hooks/admin/notifications/useAdminBroadcastForm";
import { AdminNotificationsHeader } from "./AdminNotifications/AdminNotificationsHeader";
import { AdminNotificationsDeliveryStatus } from "./AdminNotifications/AdminNotificationsDeliveryStatus";
import { AdminNotificationsTips } from "./AdminNotifications/AdminNotificationsTips";
import { AdminNotificationsConfirmModal } from "./AdminNotifications/AdminNotificationsConfirmModal";

/**
 * Renders the admin broadcast composer and delivery preview panel.
 */
export const AdminNotifications = () => {
  const { state, loading, error, constants, actions } = useAdminBroadcastForm();

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <AdminNotificationsHeader />
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
            hasUsersNextPage={state.users.hasUsersNextPage}
            hasUsersPreviousPage={state.users.hasUsersPreviousPage}
            isAllVisibleSelected={state.users.isAllVisibleSelected}
            search={state.users.search}
            roleFilter={state.users.roleFilter}
            isSubmitting={loading.isSubmitting}
            isUsersLoading={loading.isUsersLoading}
            usersError={error.users}
            error={error.form}
            titleLimit={constants.titleLimit}
            messageLimit={constants.messageLimit}
            targetOptions={constants.targetOptions}
            canSubmit={state.canSubmit}
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
            <AdminLivePreview title={state.preview.previewTitle} message={state.preview.previewMessage} />
            <AdminNotificationsDeliveryStatus delivery={state.delivery} />
            <AdminNotificationsTips />
          </aside>
        </div>
        <AdminNotificationsConfirmModal
          isOpen={state.isConfirmModalOpen} targetAudienceCount={state.audience.targetAudienceCount}
          onClose={() => actions.setConfirmModalOpen(false)} onConfirm={() => { void actions.handleConfirmSend(); }}
        />
      </div>
    </AppLayout>
  );
};
