interface AdminUserTablePaginationButtonProps {
  /**
   * The text label for the button.
   */
  label: string;
  /**
   * Callback when the button is clicked.
   */
  onClick: () => void;
  /**
   * Whether the button is disabled.
   */
  disabled: boolean;
}

/**
 * Renders a styled button for AdminUserTable pagination.
 * @param props - Button label and event handlers.
 * @returns A pagination button component.
 */
export const AdminUserTablePaginationButton = (
  props: AdminUserTablePaginationButtonProps
) => {
  const { label, onClick, disabled } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  );
};

interface AdminUserTablePaginationProps {
  usersPage: number;
  usersCount: number;
  usersPageSize: number;
  hasUsersNextPage: boolean;
  hasUsersPreviousPage: boolean;
  isUsersLoading: boolean;
  isSubmitting: boolean;
  onUsersPageChange: (page: number) => void;
}

/**
 * Renders pagination controls for the AdminUserTable.
 * @param props - Pagination state and change callbacks.
 * @returns Pagination UI controls.
 */
export const AdminUserTablePagination = (props: AdminUserTablePaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(props.usersCount / props.usersPageSize));

  return (
    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
      <span>Page {props.usersPage} of {totalPages}</span>
      <div className="flex items-center gap-2">
        <AdminUserTablePaginationButton
          label="Previous"
          onClick={() => props.onUsersPageChange(Math.max(1, props.usersPage - 1))}
          disabled={!props.hasUsersPreviousPage || props.isUsersLoading || props.isSubmitting}
        />
        <AdminUserTablePaginationButton
          label="Next"
          onClick={() => props.onUsersPageChange(props.usersPage + 1)}
          disabled={!props.hasUsersNextPage || props.isUsersLoading || props.isSubmitting}
        />
      </div>
    </div>
  );
};
