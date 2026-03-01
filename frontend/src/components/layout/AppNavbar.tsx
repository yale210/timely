import { useEffect, useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react"
import { authStore } from "@/services/authService"
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown'
import { useNotificationContext } from '@/context/NotificationContext'
import { type Notification } from '@/types/notification'

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Calendar", to: "/calendar" },
  { label: "Tasks", to: "/tasks" },
  { label: "Events", to: "/events" },
  { label: "Gradebook", to: "/gradebook" },
  { label: "Weekly Summaries", to: "/weekly-summaries" },
]

const adminNavItems = [
  { label: "Admin notifications", to: "/admin/notifications" },
  { label: "Notification history", to: "/admin/notifications/history" },
]

const accountItems = [
  { label: "Settings", to: "/settings" },
  { label: "Log out", to: "/logout" },
]

/**
 * AppNavbar renders the main navigation bar with a sliding drawer menu for Timely.
 */
export default function AppNavbar() {
  const [open, setOpen] = useState(false)
  const drawerWidth = 280
  const navigate = useNavigate()
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
    return () => {
      document.body.classList.remove("menu-open")
      document.body.style.removeProperty("--drawer-width")
    }
  }, [open, drawerWidth])

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm ring-1 ring-gray-200">
      <div className="grid w-full grid-cols-3 items-center gap-3 px-4 py-2 min-h-[48px]">
        <div className="flex justify-start">
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1"
          >
            <span className="sr-only">Open menu</span>
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" x2="20" y1="7" y2="7" />
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="17" y2="17" />
            </svg>
          </button>
        </div>

        <div className="flex justify-center">
          <Link to="/dashboard" className="text-xl font-semibold text-gray-900 tracking-tight">
            Timely
          </Link>
        </div>

        <div className="flex items-center justify-end gap-3">
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

          <Menu as="div" className="relative">
            <MenuButton className="inline-flex items-center justify-center rounded-full px-2.5 py-1 text-sm font-semibold text-gray-900 hover:bg-gray-100">
              <span className="material-icons text-base mr-1">account_circle</span>
              Account
            </MenuButton>
            <MenuItems className="absolute right-0 mt-2 w-44 origin-top-right rounded-lg border border-gray-200 bg-white shadow-lg focus:outline-none">
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
        className={`fixed inset-y-0 left-0 z-50 w-[280px] max-w-full transform bg-white shadow-xl ring-1 ring-gray-200 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main"
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 min-h-[40px]">
          <Link to="/dashboard" className="flex items-center" onClick={() => setOpen(false)}>
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

        <div className="flex h-full flex-col">
          <ul className="space-y-2 px-4 py-4 text-base">
            {navItems.map(item => (
              <li key={item.to}>
                <NavLink
                to={item.to}
                onClick={() => setOpen(false)}
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
            <li>
              <NavLink
                to="/notifications"
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  [
                    "flex items-center justify-between rounded-md px-3 py-2.5 text-base font-semibold transition-colors",
                    isActive ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100" : "text-gray-800 hover:bg-gray-100",
                  ].join(" ")
                }
              >
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            </li>
          </ul>

          {isStaff && (
            <>
              <div className="mx-4 border-t-2 border-gray-200" />
              <ul className="space-y-2 px-4 py-4 text-base">
                {adminNavItems.map(item => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={() => setOpen(false)}
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
            </>
          )}

          <div className="mx-4 border-t-2 border-gray-200" />
          <ul className="space-y-2 px-4 py-4 text-base">
            {accountItems.map(item => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setOpen(false)}
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
        </div>
      </nav>
    </header>
  )
}
