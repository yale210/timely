interface AdminHistoryTargetFilterProps {
  /**
   * Current target filter value.
   */
  value: string;
  /**
   * Callback to update the target filter.
   * @param value - The new filter value.
   */
  onChange: (value: string) => void;
}

/**
 * Renders an audience target filter dropdown.
 * @param props - Value and change handler.
 * @returns A select component for target filtering.
 */
export function AdminHistoryTargetFilter(props: AdminHistoryTargetFilterProps) {
  return (
    <select
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
    >
      <option value="">All audiences</option>
      <option value="all">All users</option>
      <option value="staff">Staff</option>
      <option value="admin">Admins</option>
      <option value="users">Specific users</option>
      <option value="retry_failed">Retry failed</option>
    </select>
  );
}

interface AdminHistoryStatusFilterProps {
  /**
   * Current status filter value.
   */
  value: string;
  /**
   * Callback to update the status filter.
   * @param value - The new filter value.
   */
  onChange: (value: string) => void;
}

/**
 * Renders a broadcast status filter dropdown.
 * @param props - Value and change handler.
 * @returns A select component for status filtering.
 */
export function AdminHistoryStatusFilter(props: AdminHistoryStatusFilterProps) {
  return (
    <select
      value={props.value}
      onChange={(event) => props.onChange(event.target.value)}
      className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
    >
      <option value="">All statuses</option>
      <option value="QUEUED">Queued</option>
      <option value="IN_PROGRESS">In progress</option>
      <option value="COMPLETED">Completed</option>
      <option value="PARTIAL">Partial</option>
      <option value="FAILED">Failed</option>
    </select>
  );
}

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
