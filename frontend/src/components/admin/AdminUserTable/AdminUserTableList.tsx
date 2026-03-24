import { type AdminUserSummary } from "@/types";
import { AdminUserTableListHeader } from "./AdminUserTableListHeader";
import { AdminUserTableListBody } from "./AdminUserTableListBody";

interface AdminUserTableListProps {
  users: AdminUserSummary[];
  selectedUserIds: number[];
  isUsersLoading: boolean;
  usersError: string | null;
  isSubmitting: boolean;
  isAllVisibleSelected: boolean;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleUserSelection: (userId: number, checked: boolean) => void;
}

/**
 * Renders the table list of users for selection.
 * @param props - User list, selection state, and callbacks.
 * @returns User table UI.
 */
export const AdminUserTableList = (props: AdminUserTableListProps) => {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="max-h-72 overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <AdminUserTableListHeader
            isAllVisibleSelected={props.isAllVisibleSelected}
            isSubmitting={props.isSubmitting}
            onToggleSelectAll={props.onToggleSelectAll}
          />
          <AdminUserTableListBody
            users={props.users}
            selectedUserIds={props.selectedUserIds}
            isUsersLoading={props.isUsersLoading}
            usersError={props.usersError}
            isSubmitting={props.isSubmitting}
            onToggleUserSelection={props.onToggleUserSelection}
          />
        </table>
      </div>
    </div>
  );
};
