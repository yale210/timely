import { AdminUserTablePaginationButton } from "./AdminUserTablePaginationButton";

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
