import { useEffect, useState } from "react"
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom"
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react"
import { authStore } from "@/services/authService"
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { useNotificationContext } from '@/context/NotificationContext'
import { type Notification } from '@/types/notification'
import AdminSidebar from "@/components/layout/AdminSidebar"

const navItems = [
  { label: "Overview", to: "/dashboard", icon: "space_dashboard" },
  { label: "Calendar", to: "/calendar", icon: "calendar_month" },
  { label: "Tasks", to: "/tasks", icon: "checklist" },
]

const featureItems = [
  { key: "gradebook", label: "Gradebook", to: "/gradebook", icon: "school" },
  { key: "weekly_summaries", label: "Weekly Summaries", to: "/weekly-summaries", icon: "insights" },
]

const FEATURE_FLAGS = {
  gradebook: "feature_gradebook_enabled",
  weekly_summaries: "feature_weekly_summaries_enabled",
}

const readFeatureFlag = (key: keyof typeof FEATURE_FLAGS) => {
  const raw = localStorage.getItem(FEATURE_FLAGS[key])
  if (raw === null) return true
  return raw === "true"
}


/**
 * AppNavbar renders the main navigation bar with a sliding drawer menu for Timely.
 */
export default function AppNavbar() {
  const [open, setOpen] = useState(() => {
    const raw = localStorage.getItem("nav_drawer_open")
    return raw === "true"
  })
  const drawerWidth = 224
  const navigate = useNavigate()
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith("/admin")
  const [featureFlags, setFeatureFlags] = useState(() => ({
    gradebook: readFeatureFlag("gradebook"),
    weekly_summaries: readFeatureFlag("weekly_summaries"),
  }))
  const {
    notifications,
    unreadCount,
    markRead,
    markUnread,
    markAllRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotificationContext()

  const user = authStore.getUser()
  const isStaff = Boolean(user?.is_staff)

  const handleNotificationClick = (notification: Notification) => {
    void markRead(notification.id)
    void navigate(`/notifications/${notification.id}`)
  }

  useEffect(() => {
    document.body.classList.toggle("menu-open", open)
    document.body.style.setProperty("--drawer-width", `${drawerWidth}px`)
    localStorage.setItem("nav_drawer_open", String(open))
    return () => {
      document.body.classList.remove("menu-open")
      document.body.style.removeProperty("--drawer-width")
    }
  }, [open, drawerWidth])

  useEffect(() => {
    const refreshFlags = () => {
      setFeatureFlags({
        gradebook: readFeatureFlag("gradebook"),
        weekly_summaries: readFeatureFlag("weekly_summaries"),
      })
    }
    window.addEventListener("feature-flags-changed", refreshFlags)
    window.addEventListener("storage", refreshFlags)
    return () => {
      window.removeEventListener("feature-flags-changed", refreshFlags)
      window.removeEventListener("storage", refreshFlags)
    }
  }, [])

  const visibleFeatureItems = featureItems.filter((item) => {
    if (item.key === "gradebook") return featureFlags.gradebook
    if (item.key === "weekly_summaries") return featureFlags.weekly_summaries
    return false
  })

  return (
    <header className="fixed left-0 right-0 top-0 z-30 m-0 bg-white shadow-sm ring-1 ring-gray-200">
      <div className="grid w-full grid-cols-3 items-center gap-2 px-3 py-0 min-h-10">
        <div className="flex justify-start">
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1"
          >
            <span className="sr-only">Open menu</span>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" x2="20" y1="7" y2="7" />
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="17" y2="17" />
            </svg>
          </button>
        </div>

        <div className="flex justify-center" />

        <div className="flex h-10 items-center justify-end gap-1.5">
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllRead={() => void markAllRead()}
            onDeleteAll={() => void deleteAllNotifications()}
            onItemClick={handleNotificationClick}
            onToggleRead={(notification) =>
              notification.is_read
                ? markUnread(notification.id)
                : markRead(notification.id)
            }
            onDeleteItem={(notification) => deleteNotification(notification.id)}
          />

          <Menu as="div" className="relative flex h-8 items-center">
            <MenuButton className="inline-flex h-8 items-center justify-center rounded-full px-3 py-0 text-sm font-semibold leading-none text-gray-900 hover:bg-gray-100">
              <span className="material-icons mr-2 leading-none" style={{ fontSize: "24px" }}>account_circle</span>
              {user?.username ?? "Account"}
            </MenuButton>
            <MenuItems
              modal={false}
              className="absolute right-0 top-full mt-2 w-36 origin-top-right rounded-lg border border-gray-200 bg-white shadow-lg focus:outline-none z-50"
            >
              <div className="py-1">
                <MenuItem>
                  {({ focus }) => (
                    <Link
                      to="/settings"
                      className={`block px-4 py-2 text-sm ${
                        focus ? "bg-gray-50 text-gray-900" : "text-gray-700"
                      }`}
                    >
                      Settings
                    </Link>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ focus }) => (
                    <Link
                      to="/logout"
                      className={`block px-4 py-2 text-sm ${
                        focus ? "bg-gray-50 text-gray-900" : "text-gray-700"
                      }`}
                    >
                      Log out
                    </Link>
                  )}
                </MenuItem>
              </div>
            </MenuItems>
          </Menu>
        </div>
      </div>

      {/* Sliding drawer */}
      <nav
        className={`fixed inset-y-0 left-0 z-50 flex w-56 max-w-full flex-col transform bg-white shadow-xl ring-1 ring-gray-200 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main"
      >
        <div className="flex h-10 items-center justify-between px-4 border-b border-gray-200 flex-none">
          <Link to="/dashboard" className="flex items-center">
            <img src="/t.png" alt="Timely" className="h-6 w-6" />
          </Link>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto">
          {isAdminRoute ? (
            <AdminSidebar onClose={() => setOpen(false)} />
          ) : (
            /* ── Main sidebar ── */
            <>
              <ul className="space-y-2 px-4 py-4">
                {navItems.map(item => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
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

              {visibleFeatureItems.length > 0 && (
                <>
                  <div className="mx-4 border-t-2 border-gray-200" />
                  <div className="px-4 pt-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Extras
                  </div>
                  <ul className="space-y-2 px-4 py-4">
                    {visibleFeatureItems.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
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
                </>
              )}

              {isStaff && (
                <>
                  <div className="mx-4 border-t-2 border-gray-200" />
                  <ul className="space-y-2 px-4 py-4">
                    <li>
                      <Link
                        to="/admin/notifications"
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <span aria-hidden="true" className="material-icons text-lg leading-none">admin_panel_settings</span>
                        <span>Admin Panel</span>
                      </Link>
                    </li>
                  </ul>
                </>
              )}

            </>
          )}
        </div>
        <div className="mt-auto border-t border-gray-200 px-4 py-3">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                isActive ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100" : "text-gray-800 hover:bg-gray-100",
              ].join(" ")
            }
          >
            <span aria-hidden="true" className="material-icons text-lg leading-none">settings</span>
            <span>Settings</span>
          </NavLink>
        </div>
      </nav>
    </header>
  )
}
