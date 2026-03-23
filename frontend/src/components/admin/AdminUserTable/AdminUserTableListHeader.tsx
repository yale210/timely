interface AdminUserTableListHeaderProps {
  /**
   * Whether all currently visible users are selected.
   */
  isAllVisibleSelected: boolean;
  /**
   * Whether the form is currently submitting, disabling interactions.
   */
  isSubmitting: boolean;
  /**
   * Callback to toggle selection of all visible users.
   * @param checked - Whether all users should be selected.
   */
  onToggleSelectAll: (checked: boolean) => void;
}

/**
 * Renders the table header for AdminUserTableList.
 * @param props - Selection state and callbacks.
 * @returns A thead component.
 */
export const AdminUserTableListHeader = (props: AdminUserTableListHeaderProps) => {
  const { isAllVisibleSelected, isSubmitting, onToggleSelectAll } = props;

  return (
    <thead className="sticky top-0 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
      <tr>
        <th className="px-4 py-3">
          <input
            type="checkbox"
            checked={isAllVisibleSelected}
            onChange={(event) => onToggleSelectAll(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            disabled={isSubmitting}
          />
        </th>
        <th className="px-4 py-3">User</th>
        <th className="px-4 py-3">Role</th>
        <th className="px-4 py-3">Status</th>
      </tr>
    </thead>
  );
};
