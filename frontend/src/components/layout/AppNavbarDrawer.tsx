import { Link, NavLink } from "react-router-dom";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { LogoMark } from "@/components/ui";

interface DrawerItem {
  label: string;
  to: string;
  icon: string;
}

interface AppNavbarDrawerProps {
  open: boolean;
  isAdminRoute: boolean;
  isStaff: boolean;
  navItems: DrawerItem[];
  featureItems: DrawerItem[];
  onClose: () => void;
  onNavigate: (nextPath?: string) => void;
}

const footerItems = [
  { label: "Leaderboard", to: "/leaderboard", icon: "leaderboard" },
  { label: "Friends", to: "/friends", icon: "group" },
  { label: "Settings", to: "/settings", icon: "settings" },
];

const navLinkClassName = (isActive: boolean) =>
  [
    "app-nav-link flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors",
    isActive ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100" : "text-gray-800 hover:bg-gray-100",
  ].join(" ");

const footerLinkClassName = (isActive: boolean) =>
  [
    "app-nav-link flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
    isActive ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100" : "text-gray-800 hover:bg-gray-100",
  ].join(" ");

const renderDrawerLinks = (items: DrawerItem[], onNavigate: (nextPath?: string) => void) =>
  items.map((item) => (
    <li key={item.to}>
      <NavLink
        to={item.to}
        onClick={() => onNavigate(item.to)}
        className={({ isActive }) => navLinkClassName(isActive)}
      >
        <span aria-hidden="true" className="material-icons text-lg leading-none">{item.icon}</span>
        <span>{item.label}</span>
      </NavLink>
    </li>
  ));

/**
 * Renders the slide-out app drawer and its navigation sections.
 * @param props - Drawer props.
 * @param props.open - Whether the drawer is currently open.
 * @param props.isAdminRoute - Whether the user is on an admin route.
 * @param props.isStaff - Whether the current user can access staff links.
 * @param props.navItems - Primary navigation items.
 * @param props.featureItems - Feature-flagged extra items.
 * @param props.onClose - Closes the drawer.
 * @param props.onNavigate - Handles mobile route close/scroll/loading behavior.
 * @returns The sliding drawer navigation.
 */
export default function AppNavbarDrawer({
  open,
  isAdminRoute,
  isStaff,
  navItems,
  featureItems,
  onClose,
  onNavigate,
}: AppNavbarDrawerProps) {
  return (
    <nav
      className={`app-drawer fixed inset-y-0 left-0 z-50 flex w-56 max-w-full flex-col transform bg-white shadow-xl ring-1 ring-gray-200 transition-transform duration-300 ease-out ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
      aria-label="Main"
    >
      <div className="flex h-10 flex-none items-center justify-between border-b border-gray-200 px-4">
        <Link to="/dashboard" className="flex items-center" onClick={() => onNavigate("/dashboard")}>
          <span className="sr-only">Timely</span>
          <LogoMark className="h-6 w-6" />
        </Link>
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        {isAdminRoute ? (
          <AdminSidebar onClose={() => onNavigate()} />
        ) : (
          <>
            <ul className="space-y-2 px-4 py-4">
              {renderDrawerLinks(navItems, onNavigate)}
            </ul>

            {featureItems.length > 0 ? (
              <>
                <div className="mx-4 border-t-2 border-gray-200" />
                <div className="px-4 pt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Extras
                </div>
                <ul className="space-y-2 px-4 py-4">
                  {renderDrawerLinks(featureItems, onNavigate)}
                </ul>
              </>
            ) : null}

            {isStaff ? (
              <>
                <div className="mx-4 border-t-2 border-gray-200" />
                <ul className="space-y-2 px-4 py-4">
                  <li>
                    <Link
                      to="/admin/notifications"
                      onClick={() => onNavigate("/admin/notifications")}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-50"
                    >
                      <span aria-hidden="true" className="material-icons text-lg leading-none">admin_panel_settings</span>
                      <span>Admin Panel</span>
                    </Link>
                  </li>
                </ul>
              </>
            ) : null}
          </>
        )}
      </div>

      <div className="mt-auto border-t border-gray-200 px-4 py-3">
        {footerItems.map((item, index) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => onNavigate(item.to)}
            className={({ isActive }) => `${index < footerItems.length - 1 ? "mb-2 " : ""}${footerLinkClassName(isActive)}`}
          >
            <span aria-hidden="true" className="material-icons text-lg leading-none">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
