import { useEffect, useState } from 'react'
import { Dialog, DialogPanel, Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Link } from "react-router-dom"
import { authStore, AUTH_CHANGE_EVENT } from "@/services/authService"

const authedNavigation = [
    { name: 'Home', href: '/' },
    { name: 'Signup', href: '/signup' },
    { name: 'Calendar', href: '/calendar' },
    { name: 'Tasks', href: '/tasks' },
    { name: 'Events', href: '/events' },
    { name: 'Gradebook', href: '/gradebook' },
    { name: 'Weekly Summaries', href: '/weekly-summaries' },
]

const guestNavigation = [
    { name: 'Home', href: '/' },
    { name: 'Signup', href: '/signup' },
]

interface NavbarProps {
    /**
     * When true, hide the Signup link for authenticated users.
     * Defaults to true to prevent logged-in users from navigating back to signup.
     */
    hideSignupWhenAuthed?: boolean
}

/**
 * Renders the navigation bar, including mobile menu logic.
 * @param root0 Component props.
 * @param root0.hideSignupWhenAuthed When true, hide the Signup link for authed users.
 * @returns The rendered navigation bar component.
 */
export default function Navbar({ hideSignupWhenAuthed = true }: NavbarProps = {}) {

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [isAuthed, setIsAuthed] = useState(Boolean(authStore.getToken()))

    const filteredNavigation = isAuthed
        ? (hideSignupWhenAuthed
            ? authedNavigation.filter((item) => item.href !== "/signup")
            : authedNavigation)
        : guestNavigation

    useEffect(() => {
        const syncAuthState = () => setIsAuthed(Boolean(authStore.getToken()))
        window.addEventListener("storage", syncAuthState)
        window.addEventListener(AUTH_CHANGE_EVENT, syncAuthState)
        return () => {
            window.removeEventListener("storage", syncAuthState)
            window.removeEventListener(AUTH_CHANGE_EVENT, syncAuthState)
        }
    }, [])
    
    const headerPadding = isAuthed ? "p-3 lg:px-6" : "p-6 lg:px-8"
    const showHamburger = isAuthed

    return (
        <>
            <header className="absolute inset-x-0 top-0 z-50" data-testid="navbar">
                <nav aria-label="Global" className={`flex items-center justify-between ${headerPadding}`}>

                    <div className="flex items-center gap-3 lg:flex-1">
                        {showHamburger && (
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(true)}
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
                            >
                                <span className="sr-only">Open menu</span>
                                <Bars3Icon aria-hidden="true" className="size-6" />
                            </button>
                        )}
                        <Link to="/" className="-m-1.5 p-1.5 flex flex-row gap-1.5 justify-center items-center">
                            <p className="font-bold text-lg">Timely</p>
                        </Link>
                    </div>

                    {!showHamburger && (
                        <div className="flex lg:hidden">
                            <button
                            type="button"
                            onClick={() => setMobileMenuOpen(true)}
                            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                            >
                            <span className="sr-only">Open main menu</span>
                            <Bars3Icon aria-hidden="true" className="size-6" />
                            </button>
                        </div>
                    )}

                    {!isAuthed && (
                        <div className="hidden lg:flex lg:gap-x-12">
                            {filteredNavigation.map((item) => (
                                <Link key={item.name} to={item.href} className="text-sm/6 font-semibold text-gray-900">
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                        {isAuthed ? (
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
                        ) : (
                            <Link to="/login" className="text-sm/6 font-semibold text-gray-900">
                                Log in <span aria-hidden="true">&rarr;</span>
                            </Link>
                        )}
                    </div>

                </nav>

                <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className={showHamburger ? "" : "lg:hidden"}>
                    <div className="fixed inset-0 z-50" />

                    <DialogPanel className={`fixed inset-y-0 left-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10 ${showHamburger ? "sm:max-w-xs" : ""}`}>
                    
                        <div className="flex items-center justify-between">
                            <a href="#" className="-m-1.5 p-1.5">
                                <span className="sr-only">Your Company</span>
                                <img
                                alt="Timely"
                                src="/t.png"
                                className="h-8 w-8"
                                />
                            </a>
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(false)}
                                className="-m-2.5 rounded-md p-2.5 text-gray-700"
                            >
                                <span className="sr-only">Close menu</span>
                                <XMarkIcon aria-hidden="true" className="size-6" />
                            </button>
                        </div>

                        <div className="mt-6 flow-root">
                            <div className="-my-6 divide-y divide-gray-500/10">
                                <div className="space-y-2 py-6">
                                {filteredNavigation.map((item) => (
                                    <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                                    >
                                    {item.name}
                                    </Link>
                                ))}
                                </div>
                                <div className="py-6">
                                {isAuthed ? (
                                    <>
                                        <Link
                                            to="/settings"
                                            className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                                        >
                                            Settings
                                        </Link>
                                        <Link
                                            to="/logout"
                                            className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                                        >
                                            Log out
                                        </Link>
                                    </>
                                ) : (
                                    <Link
                                        to="/login"
                                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                                    >
                                        Log in
                                    </Link>
                                )}
                                </div>
                            </div>
                        </div>
                    </DialogPanel>
                </Dialog>
            </header>
        </>
    )
}
