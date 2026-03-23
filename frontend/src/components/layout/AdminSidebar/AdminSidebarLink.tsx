import { Link } from "react-router-dom";

interface AdminSidebarLinkProps {
  /**
   * Target URL for the link.
   */
  to: string;
  /**
   * Display text for the link.
   */
  label: string;
  /**
   * Material icon name to display.
   */
  icon: string;
  /**
   * Callback to close the sidebar.
   */
  onClose: () => void;
}

/**
 * Renders a single link in the admin sidebar.
 * @param props - Link target, label, icon and close handler.
 * @returns A list item with a router link.
 */
export const AdminSidebarLink = (props: AdminSidebarLinkProps) => {
  const { to, label, icon, onClose } = props;

  const classes =
    to === "/logout"
      ? "text-red-500 hover:bg-red-50"
      : "text-gray-800 hover:bg-gray-100";

  return (
    <li>
      <Link
        to={to}
        onClick={onClose}
        className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors ${classes}`}
      >
        <span aria-hidden="true" className="material-icons text-lg leading-none">
          {icon}
        </span>
        <span>{label}</span>
      </Link>
    </li>
  );
};
