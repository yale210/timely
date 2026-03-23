import { type AdminNotificationTarget, type AdminUserRole, type AdminUserSummary } from "@/types";
import { AdminUserTableControls } from "./AdminUserTable/AdminUserTableControls";
import { AdminUserTableList } from "./AdminUserTable/AdminUserTableList";
import { AdminUserTablePagination } from "./AdminUserTable/AdminUserTablePagination";
import { AdminUserTableManualInput } from "./AdminUserTable/AdminUserTableManualInput";

interface AdminUserTableProps {
  target: AdminNotificationTarget;
  users: AdminUserSummary[];
  selectedUserIds: number[];
  usersPage: number;
  usersCount: number;
  usersPageSize: number;
  search: string;
  roleFilter: AdminUserRole;
  userIdsInput: string;
  hasUsersNextPage: boolean;
  hasUsersPreviousPage: boolean;
  isUsersLoading: boolean;
  usersError: string | null;
  isSubmitting: boolean;
  isAllVisibleSelected: boolean;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: AdminUserRole) => void;
  onUsersPageChange: (page: number) => void;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleUserSelection: (userId: number, checked: boolean) => void;
  onUserIdsInputChange: (value: string) => void;
}

/**
 * Renders user selection controls when targeting specific users.
 * @param props - User list, selection state, and update callbacks.
 * @returns Recipient selection UI or null for non-user targets.
 */
export const AdminUserTable = (props: AdminUserTableProps) => {
  if (props.target !== "users") {
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/60 p-4">
      <AdminUserTableControls
        {...props}
        selectedCount={props.selectedUserIds.length}
      />
      <AdminUserTableList {...props} />
      <AdminUserTablePagination {...props} />
      <AdminUserTableManualInput {...props} />
    </div>
  );
};
