interface AdminUserStatusBadgeProps {
  /**
   * Whether the user is active.
   */
  isActive: boolean;
}

/**
 * Renders a badge for the user active status.
 * @param props - User active status.
 * @returns A status badge component.
 */
export const AdminUserStatusBadge = (props: AdminUserStatusBadgeProps) => {
  const { isActive } = props;

  const classes = isActive
    ? "bg-emerald-50 text-emerald-600"
    : "bg-gray-100 text-gray-500";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
};
