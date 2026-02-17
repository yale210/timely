import { useState } from "react"
import { Link, NavLink } from "react-router-dom"
import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react"

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Calendar", to: "/calendar" },
  { label: "Tasks", to: "/tasks" },
  { label: "Events", to: "/events" },
  { label: "Gradebook", to: "/gradebook" },
  { label: "Weekly Summaries", to: "/weekly-summaries" },
]

/**
 * AppNavbar renders the main navigation bar with a sliding drawer menu for Timely.
 */
export default function AppNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm ring-1 ring-gray-200">
      <div className="flex w-full items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
        >
          <span className="sr-only">Open menu</span>
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" x2="20" y1="7" y2="7" />
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="17" y2="17" />
          </svg>
        </button>

        <Link to="/dashboard" className="text-xl font-semibold text-gray-900 tracking-tight">
          Timely
        </Link>

        <Menu as="div" className="relative">
          <MenuButton className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50">
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

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
      />

      {/* Sliding drawer */}
      <nav
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-full transform bg-white shadow-xl ring-1 ring-gray-200 transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <Link to="/dashboard" className="text-lg font-semibold text-gray-900" onClick={() => setOpen(false)}>
            Timely
          </Link>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="6" x2="18" y1="6" y2="18" />
              <line x1="6" x2="18" y1="18" y2="6" />
            </svg>
          </button>
        </div>

        <ul className="space-y-1 px-2 py-4">
          {navItems.map(item => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  [
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100" : "text-gray-800 hover:bg-gray-100",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
