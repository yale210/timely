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
export const AdminHistoryTargetFilter = (props: AdminHistoryTargetFilterProps) => {
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
};
