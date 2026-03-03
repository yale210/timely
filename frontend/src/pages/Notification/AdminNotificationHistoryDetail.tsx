import { Link } from "react-router-dom";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import { AdminHistoryDetailPayload } from "@/components/admin/AdminHistoryDetailPayload";
import { AdminHistoryDetailRecipientsTable } from "@/components/admin/AdminHistoryDetailRecipientsTable";
import { AdminHistoryDetailMetrics } from "@/components/admin/AdminHistoryDetailMetrics";
import { useAdminHistoryDetail } from "@/hooks/useAdminHistoryDetail";

/**
 * Renders details and recipient status for a broadcast history item.
 */
export const AdminNotificationHistoryDetail = () => {
  const { state, loading, error, retryError, actions } = useAdminHistoryDetail();

if (loading) {
  return <div className="p-8 text-center">Loading...</div>;
}

if (error || !state.detail || !state.status) {
  return <div className="p-8 text-center text-red-600">{error ?? "Broadcast not found"}</div>;
}

return (
  <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <div className="mb-6 flex items-center justify-between">
      <div>
        <Link
          to="/admin/notifications/history"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Back to history
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">{state.detail.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Queued {new Date(state.detail.queued_at).toLocaleString()}
        </p>
      </div>
      <button
        type="button"
        onClick={() => actions.setRetryConfirmOpen(true)}
        disabled={state.failedRecipientsCount === 0}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Retry failed recipients
      </button>
    </div>

    {retryError && <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{retryError}</div>}

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <AdminHistoryDetailPayload message={state.detail.message} />
        <AdminHistoryDetailRecipientsTable recipients={state.detail.recipients} />
      </div>

      <aside className="space-y-4">
        <AdminHistoryDetailMetrics detail={state.detail} status={state.status} />
      </aside>
    </div>

    <ConfirmationModal
      isOpen={state.isRetryConfirmOpen}
      onClose={() => actions.setRetryConfirmOpen(false)}
      onConfirm={() => {
        void actions.handleRetry();
      }}
      title="Retry failed recipients?"
      message={`This will re-send to ${state.failedRecipientsCount} failed recipients only.`}
      confirmText="Retry failed"
    />
  </div>
);
};
