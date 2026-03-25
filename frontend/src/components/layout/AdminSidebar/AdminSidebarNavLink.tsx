import { NavLink } from "react-router-dom";

interface AdminSidebarNavLinkProps {
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
 * Renders a single navigation link in the admin sidebar with active state styling.
 * @param props - Link target, label, icon and close handler.
 * @returns A list item with a router nav link.
 */
export const AdminSidebarNavLink = (props: AdminSidebarNavLinkProps) => {
  const { to, label, icon, onClose } = props;

  return (
    <li>
      <NavLink
        to={to}
        end
        onClick={onClose}
        className={({ isActive }) =>
          [
            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors",
            isActive
              ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100"
              : "text-gray-800 hover:bg-gray-100",
          ].join(" ")
        }
      >
        <span aria-hidden="true" className="material-icons text-lg leading-none">
          {icon}
        </span>
        <span>{label}</span>
      </NavLink>
    </li>
  );
};
