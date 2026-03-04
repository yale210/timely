import { Link, NavLink } from "react-router-dom"

const adminSidebarItems = [
  { label: "Notifications", to: "/admin/notifications" },
  { label: "Notification History", to: "/admin/notifications/history" },
]

const accountItems = [
  { label: "Settings", to: "/settings" },
  { label: "Log out", to: "/logout" },
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
      <ul className="space-y-2 px-4 py-4 text-base">
        <li>
          <Link
            to="/dashboard"
            onClick={onClose}
            className="flex items-center rounded-md px-3 py-2.5 text-base font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <span className="material-icons text-lg mr-2">arrow_back</span>
            Back to Dashboard
          </Link>
        </li>
      </ul>

      <div className="mx-4 border-t-2 border-gray-200" />

      <ul className="flex-1 space-y-2 px-4 py-4 text-base">
        {adminSidebarItems.map(item => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                [
                  "flex items-center rounded-md px-3 py-2.5 text-base font-semibold transition-colors",
                  isActive ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100" : "text-gray-800 hover:bg-gray-100",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="mx-4 border-t-2 border-gray-200" />
      <ul className="space-y-2 px-4 py-4 text-base">
        {accountItems.map(item => (
          <li key={item.to}>
            <Link
              to={item.to}
              onClick={onClose}
              className={`flex items-center rounded-md px-3 py-2.5 text-base font-semibold ${
                item.to === "/logout"
                  ? "text-red-500 hover:bg-red-50"
                  : "text-gray-800 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
