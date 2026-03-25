import { AdminHistoryTargetFilter } from "./AdminHistoryFilters/AdminHistoryTargetFilter";
import { AdminHistoryStatusFilter } from "./AdminHistoryFilters/AdminHistoryStatusFilter";

interface AdminHistoryFiltersProps {
  search: string;
  targetFilter: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onTargetFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
}

/**
 * Renders filter controls for admin notification history.
 * @param props - Current filter values and change handlers.
 * @returns Filter inputs for search, audience, and status.
 */
export const AdminHistoryFilters = (props: AdminHistoryFiltersProps) => {
  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-3">
      <input
        value={props.search}
        onChange={(event) => props.onSearchChange(event.target.value)}
        placeholder="Search title..."
        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
      />
      <AdminHistoryTargetFilter
        value={props.targetFilter}
        onChange={props.onTargetFilterChange}
      />
      <AdminHistoryStatusFilter
        value={props.statusFilter}
        onChange={props.onStatusFilterChange}
      />
    </div>
  );
};
