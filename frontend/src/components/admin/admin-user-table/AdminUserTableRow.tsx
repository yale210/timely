import { type AdminUserSummary } from "@/types";
import { AdminUserRoleBadge, AdminUserStatusBadge } from "./AdminUserBadges";

interface AdminUserTableRowProps {
  user: AdminUserSummary;
  isSelected: boolean;
  isSubmitting: boolean;
  onToggleUserSelection: (userId: number, checked: boolean) => void;
}

/**
 * Renders a single row in the AdminUserTable.
 * @param props - User data and selection callbacks.
 * @returns A table row component.
 */
export const AdminUserTableRow = (props: AdminUserTableRowProps) => {
  const { user, isSelected, isSubmitting, onToggleUserSelection } = props;

  return (
    <tr key={user.id} className={isSelected ? "bg-indigo-50" : "bg-white"}>
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(event) => onToggleUserSelection(user.id, event.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          disabled={isSubmitting}
        />
      </td>
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{user.username}</div>
        <div className="text-xs text-gray-500">{user.email}</div>
      </td>
      <td className="px-4 py-3">
        <AdminUserRoleBadge
          isSuperuser={user.is_superuser}
          isStaff={user.is_staff}
        />
      </td>
      <td className="px-4 py-3">
        <AdminUserStatusBadge isActive={user.is_active} />
      </td>
    </tr>
  );
};
