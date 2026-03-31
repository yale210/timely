interface AdminUserTableStatesProps {
  /**
   * Whether users are currently being loaded.
   */
  isLoading: boolean;
  /**
   * Error message if user loading failed.
   */
  error: string | null;
  /**
   * Whether the user list is empty.
   */
  isEmpty: boolean;
}

interface TableStateConfig {
  className: string;
  message: string;
}

const getTableStateConfig = (
  isLoading: boolean,
  error: string | null,
  isEmpty: boolean,
): TableStateConfig | null => {
  if (isLoading) return { className: "px-4 py-6 text-center text-sm text-gray-500", message: "Loading users..." };
  if (error) return { className: "px-4 py-6 text-center text-sm text-red-600", message: error };
  if (isEmpty) return { className: "px-4 py-6 text-center text-sm text-gray-500", message: "No users match your search." };
  return null;
};

/**
 * Renders table body rows for special states (loading, error, empty).
 * @param props - Loading, error and empty flags.
 * @returns A tbody component or null.
 */
export const AdminUserTableStates = (props: AdminUserTableStatesProps) => {
  const { isLoading, error, isEmpty } = props;
  const stateConfig = getTableStateConfig(isLoading, error, isEmpty);

  return stateConfig ? (
    <tbody className="divide-y divide-gray-100">
      <tr>
        <td colSpan={4} className={stateConfig.className}>{stateConfig.message}</td>
      </tr>
    </tbody>
  ) : null;
};
