import { useState } from 'react'
import { Dialog, DialogPanel } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { Link, useNavigate } from "react-router-dom"
import { NotificationBell } from './NotificationBell'
import { NotificationDropdown } from './NotificationDropdown'
import { useNotificationContext } from '../context/NotificationContext'
import { type Notification } from '../types/notification'

const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Calendar', href: '/calendar' },
    { name: 'Tasks', href: '/tasks' },
    { name: 'Events', href: '/events' },
    { name: 'Gradebook', href: '/gradebook' },
    { name: 'Admin notifications', href: '/admin/notifications' },
]

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const navigate = useNavigate()
    const {
        notifications,
        unreadCount,
        markRead,
        markAllRead,
    } = useNotificationContext()

    const handleNotificationClick = (notification: Notification) => {
        void markRead(notification.id)
        void navigate(`/notifications/${notification.id}`)
    }
    
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
                        <div className="flex items-center gap-4 mr-4">
                            <NotificationBell unreadCount={unreadCount} onClick={() => void navigate('/notifications')} />
                        </div>
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
                        {navigation.map((item) => (
                        <Link key={item.name} to={item.href} className="text-sm/6 font-semibold text-gray-900">
                            {item.name}
                        </Link>
                        ))}
                    </div>

                    <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center lg:gap-x-6">
                        <NotificationDropdown 
                            notifications={notifications}
                            unreadCount={unreadCount}
                            onMarkAllRead={() => void markAllRead()}
                            onItemClick={handleNotificationClick}
                        />
                        <Link to="/login" className="text-sm/6 font-semibold text-gray-900">
                        Log in <span aria-hidden="true">&rarr;</span>
                        </Link>
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
                                {navigation.map((item) => (
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
                                <Link
                                    to="/login"
                                    className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                                >
                                    Log in
                                </Link>
                                </div>
                            </div>
                        </div>
                    </DialogPanel>
                </Dialog>
            </header>
        </>
    )
}
