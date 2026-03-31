import { type AdminUserSummary } from "@/types";
import { AdminUserTableRow } from "./AdminUserTableRow";
import { AdminUserTableStates } from "./AdminUserTableStates";

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

interface AdminUserTableListBodyProps {
  users: AdminUserSummary[];
  selectedUserIds: number[];
  isUsersLoading: boolean;
  usersError: string | null;
  isSubmitting: boolean;
  onToggleUserSelection: (userId: number, checked: boolean) => void;
}

/**
 * Renders the body of the user selection table, including empty/loading states.
 * @param props - User list, selection state, and callbacks.
 * @returns A tbody component.
 */
export const AdminUserTableListBody = (props: AdminUserTableListBodyProps) => {
  const { users, selectedUserIds, isUsersLoading, usersError, isSubmitting } = props;

  const safeUsers = users || [];

  const states = (
    <AdminUserTableStates
      isLoading={isUsersLoading}
      error={usersError}
      isEmpty={safeUsers.length === 0}
    />
  );

  if (isUsersLoading || usersError || safeUsers.length === 0) {
    return states;
  }

  return (
    <tbody className="divide-y divide-gray-100">
      {safeUsers.map((user) => (
        <AdminUserTableRow
          key={user.id}
          user={user}
          isSelected={selectedUserIds.includes(user.id)}
          isSubmitting={isSubmitting}
          onToggleUserSelection={props.onToggleUserSelection}
        />
      ))}
    </tbody>
  );
};

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
