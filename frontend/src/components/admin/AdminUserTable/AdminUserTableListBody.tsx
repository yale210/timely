import { type AdminUserSummary } from "@/types";
import { AdminUserTableRow } from "./AdminUserTableRow";
import { AdminUserTableStates } from "./AdminUserTableStates";

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
