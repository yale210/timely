import { useEffect, useState } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Link } from "react-router-dom"
import { authStore, AUTH_CHANGE_EVENT } from "@/services/authService"

const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Signup', href: '/signup' },
    { name: 'Calendar', href: '/calendar' },
    { name: 'Tasks', href: '/tasks' },
    { name: 'Events', href: '/events' },
    { name: 'Gradebook', href: '/gradebook' },
]

interface NavbarProps {
    /**
     * When true, hide the Signup link for authenticated users.
     * Defaults to true to prevent logged-in users from navigating back to signup.
     */
    hideSignupWhenAuthed?: boolean
}

/**
 * A functional component that renders the navigation bar, including mobile menu logic.
 * @param root0
 * @param root0.hideSignupWhenAuthed
 * @param root0
 * @param root0.hideSignupWhenAuthed
 * @returns The rendered navigation bar component.
 */
export default function Navbar({ hideSignupWhenAuthed = true }: NavbarProps = {}) {

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [isAuthed, setIsAuthed] = useState(Boolean(authStore.getToken()))
    const filteredNavigation = (isAuthed && hideSignupWhenAuthed)
        ? navigation.filter((item) => item.href !== "/signup")
        : navigation

    useEffect(() => {
        const syncAuthState = () => setIsAuthed(Boolean(authStore.getToken()))
        window.addEventListener("storage", syncAuthState)
        window.addEventListener(AUTH_CHANGE_EVENT, syncAuthState)
        return () => {
            window.removeEventListener("storage", syncAuthState)
            window.removeEventListener(AUTH_CHANGE_EVENT, syncAuthState)
        }
    }, [])
    
    return (
        <>
            <header className="absolute inset-x-0 top-0 z-50" data-testid="navbar">
                <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">

                    <div className="flex lg:flex-1">
                        <Link to="/" className="-m-1.5 p-1.5 flex flex-row gap-1.5 justify-center items-center">
                            <p className="font-bold text-lg">Timely</p>
                        </Link>
                    </div>

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

                    <div className="hidden lg:flex lg:gap-x-12">
                        {filteredNavigation.map((item) => (
                        <Link key={item.name} to={item.href} className="text-sm/6 font-semibold text-gray-900">
                            {item.name}
                        </Link>
                        ))}
                    </div>

                    <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                        {isAuthed ? (
                            <Link to="/logout" className="text-sm/6 font-semibold text-gray-900">
                                Log out <span aria-hidden="true">&rarr;</span>
                            </Link>
                        ) : (
                            <Link to="/login" className="text-sm/6 font-semibold text-gray-900">
                                Log in <span aria-hidden="true">&rarr;</span>
                            </Link>
                        )}
                    </div>

                </nav>

                <Dialog open={mobileMenuOpen} onClose={setMobileMenuOpen} className="lg:hidden">
                    <div className="fixed inset-0 z-50" />

                    <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
                    
                        <div className="flex items-center justify-between">
                            <a href="#" className="-m-1.5 p-1.5">
                                <span className="sr-only">Your Company</span>
                                <img
                                alt=""
                                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                                className="h-8 w-auto"
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
                                    <Link
                                        to="/logout"
                                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                                    >
                                        Log out
                                    </Link>
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
