import { type AdminUserRole } from "@/types";

interface AdminUserTableRoleFilterProps {
  /**
   * Current role filter value.
   */
  roleFilter: AdminUserRole;
  /**
   * Whether the form is currently submitting, disabling interactions.
   */
  isSubmitting: boolean;
  /**
   * Callback to update the role filter.
   * @param value - The new role filter.
   */
  onRoleFilterChange: (value: AdminUserRole) => void;
}

/**
 * Renders a role filter dropdown for AdminUserTable.
 * @param props - Filter state and change handlers.
 * @returns A role filter select component.
 */
export const AdminUserTableRoleFilter = (props: AdminUserTableRoleFilterProps) => {
  const { roleFilter, isSubmitting, onRoleFilterChange } = props;

  return (
    <select
      value={roleFilter}
      onChange={(event) => onRoleFilterChange(event.target.value as AdminUserRole)}
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-xs focus:border-indigo-500 focus:ring-indigo-500"
      disabled={isSubmitting}
    >
      <option value="all">All roles</option>
      <option value="users">Users</option>
      <option value="staff">Staff</option>
      <option value="admin">Admins</option>
    </select>
  );
};
