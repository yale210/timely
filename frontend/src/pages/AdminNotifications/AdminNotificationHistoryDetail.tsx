import AppLayout from "@/layouts/AppLayout";
import {
  AdminHistoryDetailMetrics,
  AdminHistoryDetailPayload,
  AdminHistoryDetailRecipientsTable,
  AdminNotificationHistoryDetailHeader,
  AdminNotificationHistoryDetailRetryModal,
} from "@/components/admin/notifications";
import { useAdminHistoryDetail } from "@/hooks/admin/notifications/useAdminHistoryDetail";

/**
 * Renders details and recipient status for a broadcast history item.
 */
export const AdminNotificationHistoryDetail = () => {
  const { state, loading, error, retryError, actions, recipientPagination } = useAdminHistoryDetail();

  if (loading) return <AppLayout><div className="p-8 text-center">Loading...</div></AppLayout>;
  if (error || !state.detail || !state.status) return <AppLayout><div className="p-8 text-center text-red-600">{error ?? "Broadcast not found"}</div></AppLayout>;

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <AdminNotificationHistoryDetailHeader
          title={state.detail.title} queuedAt={state.detail.queued_at}
          failedRecipientsCount={state.failedRecipientsCount}
          onRetryClick={() => { actions.setRetryConfirmOpen(true); }}
        />
        {retryError && <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{retryError}</div>}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <AdminHistoryDetailPayload message={state.detail.message} />
            <AdminHistoryDetailRecipientsTable
              recipients={recipientPagination.recipients}
              page={recipientPagination.page}
              totalPages={recipientPagination.totalPages}
              loading={recipientPagination.loading}
              onPageChange={actions.goToRecipientsPage}
            />
          </div>
          <aside className="space-y-4">
            <AdminHistoryDetailMetrics detail={state.detail} status={state.status} />
          </aside>
        </div>
        <AdminNotificationHistoryDetailRetryModal
          isOpen={state.isRetryConfirmOpen} failedRecipientsCount={state.failedRecipientsCount}
          onClose={() => actions.setRetryConfirmOpen(false)} onConfirm={() => { void actions.handleRetry(); }}
        />
      </div>
    </AppLayout>
  );
};
