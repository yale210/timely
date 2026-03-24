import { useNavigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import { AdminHistoryFilters } from "@/components/admin/notifications/AdminHistoryFilters";
import { AdminHistoryTable } from "@/components/admin/notifications/AdminHistoryTable";
import { useAdminHistory } from "@/hooks/admin/notifications/useAdminHistory";
import { AdminNotificationHistoryHeader } from "./AdminNotificationHistory/AdminNotificationHistoryHeader";

/**
 * Renders the admin notification broadcast history page.
 */
export const AdminNotificationHistory = () => {
  const navigate = useNavigate();
  const { state, loading, error, actions } = useAdminHistory();

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <AdminNotificationHistoryHeader onNewNotification={() => { void navigate("/admin/notifications"); }} />
        <AdminHistoryFilters
          search={state.search} targetFilter={state.targetFilter} statusFilter={state.statusFilter}
          onSearchChange={actions.setSearch} onTargetFilterChange={actions.setTargetFilter} onStatusFilterChange={actions.setStatusFilter}
        />
        {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <AdminHistoryTable
          items={state.items} loading={loading} page={state.page} totalPages={state.totalPages}
          onSelectItem={(id) => { void navigate(`/admin/notifications/history/${id}`); }}
          onPreviousPage={() => actions.setPage(Math.max(1, state.page - 1))}
          onNextPage={() => actions.setPage(Math.min(state.totalPages, state.page + 1))}
        />
      </div>
    </AppLayout>
  );
};
