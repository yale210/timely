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
  const {
    search,
    targetFilter,
    statusFilter,
    onSearchChange,
    onTargetFilterChange,
    onStatusFilterChange,
  } = props;

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-3">
      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search title..."
        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
      />
      <select
        value={targetFilter}
        onChange={(event) => onTargetFilterChange(event.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
      >
        <option value="">All audiences</option>
        <option value="all">All users</option>
        <option value="staff">Staff</option>
        <option value="admin">Admins</option>
        <option value="users">Specific users</option>
        <option value="retry_failed">Retry failed</option>
      </select>
      <select
        value={statusFilter}
        onChange={(event) => onStatusFilterChange(event.target.value)}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
      >
        <option value="">All statuses</option>
        <option value="QUEUED">Queued</option>
        <option value="IN_PROGRESS">In progress</option>
        <option value="COMPLETED">Completed</option>
        <option value="PARTIAL">Partial</option>
        <option value="FAILED">Failed</option>
      </select>
    </div>
  );
};
