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

/**
 * Renders table body rows for special states (loading, error, empty).
 * @param props - Loading, error and empty flags.
 * @returns A tbody component or null.
 */
export const AdminUserTableStates = (props: AdminUserTableStatesProps) => {
  const { isLoading, error, isEmpty } = props;

  if (isLoading) {
    return (
      <tbody className="divide-y divide-gray-100">
        <tr>
          <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
            Loading users...
          </td>
        </tr>
      </tbody>
    );
  }

  if (error) {
    return (
      <tbody className="divide-y divide-gray-100">
        <tr>
          <td colSpan={4} className="px-4 py-6 text-center text-sm text-red-600">
            {error}
          </td>
        </tr>
      </tbody>
    );
  }

  if (isEmpty) {
    return (
      <tbody className="divide-y divide-gray-100">
        <tr>
          <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
            No users match your search.
          </td>
        </tr>
      </tbody>
    );
  }

  return null;
};
