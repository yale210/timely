import { useNavigate } from "react-router-dom";
import { AdminHistoryFilters } from "@/components/admin/notifications/AdminHistoryFilters";
import { AdminHistoryTable } from "@/components/admin/notifications/AdminHistoryTable";
import { useAdminHistory } from "@/hooks/admin/notifications/useAdminHistory";

/**
 * Renders the admin notification broadcast history page.
 */
export const AdminNotificationHistory = () => {
  const navigate = useNavigate();
  const { state, loading, error, actions } = useAdminHistory();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold text-indigo-600">Admin tools</p>
        <h1 className="text-3xl font-semibold text-gray-900">Notification history</h1>
        <p className="mt-2 text-sm text-gray-600">Review all notification broadcasts.</p>
      </div>
      <button
        type="button"
        onClick={() => {
          void navigate("/admin/notifications");
        }}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
      >
        New notification
      </button>
    </div>

    <AdminHistoryFilters
      search={state.search}
      targetFilter={state.targetFilter}
      statusFilter={state.statusFilter}
      onSearchChange={actions.setSearch}
      onTargetFilterChange={actions.setTargetFilter}
      onStatusFilterChange={actions.setStatusFilter}
    />

    {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

    <AdminHistoryTable
      items={state.items}
      loading={loading}
      page={state.page}
      totalPages={state.totalPages}
      onSelectItem={(itemId) => {
        void navigate(`/admin/notifications/history/${itemId}`);
      }}
      onPreviousPage={() => actions.setPage(Math.max(1, state.page - 1))}
      onNextPage={() => actions.setPage(Math.min(state.totalPages, state.page + 1))}
    />
    </div>
  );
};
