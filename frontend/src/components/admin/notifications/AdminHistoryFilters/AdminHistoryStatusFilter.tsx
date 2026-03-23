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
export const AdminHistoryStatusFilter = (props: AdminHistoryStatusFilterProps) => {
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
};
