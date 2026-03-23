interface AdminUserRoleBadgeProps {
  /**
   * Whether the user is a superuser.
   */
  isSuperuser: boolean;
  /**
   * Whether the user is a staff member.
   */
  isStaff: boolean;
}

/**
 * Renders a badge for the user role.
 * @param props - User role flags.
 * @returns A role badge component.
 */
export const AdminUserRoleBadge = (props: AdminUserRoleBadgeProps) => {
  const { isSuperuser, isStaff } = props;
  const roleLabel = isSuperuser ? "Admin" : isStaff ? "Staff" : "User";

  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
      {roleLabel}
    </span>
  );
};
