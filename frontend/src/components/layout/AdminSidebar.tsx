import { Link, NavLink } from "react-router-dom"

const adminSidebarItems = [
  { label: "Notifications", to: "/admin/notifications", icon: "notifications_active" },
  { label: "Notification History", to: "/admin/notifications/history", icon: "history" },
]

const accountItems = [
  { label: "Settings", to: "/settings", icon: "settings" },
  { label: "Log out", to: "/logout", icon: "logout" },
]

interface AdminSidebarProps {
  onClose: () => void
}

/**
 * Sidebar drawer content shown when the user is on an admin route.
 * Displays a back-to-dashboard link, admin navigation items, and account actions.
 * @param props Component props.
 * @param props.onClose Callback invoked when a navigation link is clicked to close the drawer.
 */
export default function AdminSidebar({ onClose }: AdminSidebarProps) {
  return (
    <>
      <ul className="space-y-2 px-4 py-4">
        <li>
          <Link
            to="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <span aria-hidden="true" className="material-icons text-lg leading-none">arrow_back</span>
            <span>Back to Overview</span>
          </Link>
        </li>
      </ul>

      <div className="mx-4 border-t-2 border-gray-200" />

      <ul className="flex-1 space-y-2 px-4 py-4">
        {adminSidebarItems.map(item => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors",
                  isActive ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100" : "text-gray-800 hover:bg-gray-100",
                ].join(" ")
              }
            >
              <span aria-hidden="true" className="material-icons text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="mx-4 border-t-2 border-gray-200" />
      <ul className="space-y-2 px-4 py-4">
        {accountItems.map(item => (
          <li key={item.to}>
            <Link
              to={item.to}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold ${
                item.to === "/logout"
                  ? "text-red-500 hover:bg-red-50"
                  : "text-gray-800 hover:bg-gray-100"
              }`}
            >
              <span aria-hidden="true" className="material-icons text-lg leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
