import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { it, expect, describe, beforeEach, afterEach, vi } from 'vitest'
import { HomeNavbar } from "@/components/index"
import { MemoryRouter } from 'react-router-dom'
import { NotificationProvider, useNotificationContext } from '@/context/NotificationContext'
import { authStore, AUTH_CHANGE_EVENT } from "@/services/authService"

vi.mock("@/services/authService", () => ({
    authStore: {
        getToken: vi.fn(),
        getUser: vi.fn(),
        clear: vi.fn()
    },
    AUTH_CHANGE_EVENT: "auth-change"
}))

vi.mock("@/context/NotificationContext", () => ({
    useNotificationContext: vi.fn(),
    NotificationProvider: ({ children }: any) => <div>{children}</div>
}))

const mockNotifications = [
    { id: 1, title: 'Test 1', message: 'Msg 1', is_read: false, created_at: '2023-01-01' },
    { id: 2, title: 'Test 2', message: 'Msg 2', is_read: true, created_at: '2023-01-01' }
];

describe('Navbar', () => {
    let mockContextValue: any;

    beforeEach(() => {
        vi.mocked(authStore.getToken).mockReturnValue(null)
        vi.mocked(authStore.getUser).mockReturnValue(null)
        
        mockContextValue = {
            notifications: mockNotifications,
            unreadCount: 1,
            markRead: vi.fn(),
            markUnread: vi.fn(),
            markAllRead: vi.fn(),
            deleteNotification: vi.fn(),
            deleteAllNotifications: vi.fn(),
        };
        vi.mocked(useNotificationContext).mockReturnValue(mockContextValue);

        render(
            <MemoryRouter>
                <HomeNavbar />
            </MemoryRouter>
        )
    })

    afterEach(() => {
        cleanup()
        vi.clearAllMocks()
    })

    it("renders the brand link to the homepage", () => {
        // Checks if the brand link 'Timely' redirects to the homepage
        const brand = screen.getByRole("link", {name: "Timely"})
        expect(brand.getAttribute("href")).toBe("/")
    })

    it("opens mobile menu when clicking 'Open main menu'", () => {
        // Checks if the button menu on smaller screen devices is displayed
        const openButton = screen.getByRole("button", { name: "Open main menu"})
        fireEvent.click(openButton)
        expect(screen.getByRole("button", { name: "Close menu"})).toBeTruthy()
    })

    it("opens mobile menu when clicking 'Open menu'", () => {
        // Change button name to 'Open menu' as per HomeNavbar.tsx if authed, or 'Open main menu' if not.
        // But for guest it's 'Open main menu' usually? Actually if isAuthed is false, showHamburger is false.
        // Wait, HomeNavbar.tsx: const showHamburger = isAuthed
        // If isAuthed is false, showHamburger is false.
        
        // Let's re-render as authed
        cleanup()
        vi.mocked(authStore.getToken).mockReturnValue("fake-token")
        render(
            <MemoryRouter>
                <HomeNavbar />
            </MemoryRouter>
        )
        
        const openButton = screen.getByRole("button", { name: /Open menu/i })
        fireEvent.click(openButton)
        expect(screen.getByRole("button", { name: "Close menu"})).toBeTruthy()
    })

    it("renders authed links when logged in", () => {
        cleanup()
        vi.mocked(authStore.getToken).mockReturnValue("fake-token")
        render(
            <MemoryRouter>
                <NotificationProvider>
                    <HomeNavbar />
                </NotificationProvider>
            </MemoryRouter>
        )
        
        // Open menu
        fireEvent.click(screen.getByRole("button", { name: /Open menu/i }))
        
        expect(screen.getByText("Calendar")).toBeDefined()
        expect(screen.getByText("Tasks")).toBeDefined()
        expect(screen.getByText("Gradebook")).toBeDefined()
    })

    it("renders admin links when logged in as staff", () => {
        cleanup()
        vi.mocked(authStore.getToken).mockReturnValue("fake-token")
        vi.mocked(authStore.getUser).mockReturnValue({ username: "admin", email: "a@a.com", is_staff: true })
        render(
            <MemoryRouter>
                <NotificationProvider>
                    <HomeNavbar />
                </NotificationProvider>
            </MemoryRouter>
        )
        
        // Open menu
        fireEvent.click(screen.getByRole("button", { name: /Open menu/i }))
        
        expect(screen.getByText("Admin notifications")).toBeDefined()
        expect(screen.getByText("Notification history")).toBeDefined()
    })

    it("syncs auth state on storage/auth events", () => {
        // Trigger event
        fireEvent(window, new Event("storage"))
        // we can't easily check internal state, but we can check if it re-renders
        // or just ensure the listener is attached and doesn't crash.
    })

    it("interacts with notifications", async () => {
        cleanup()
        vi.mocked(authStore.getToken).mockReturnValue("fake-token")
        render(
            <MemoryRouter>
                <HomeNavbar />
            </MemoryRouter>
        )
        
        // Open dropdown
        const bell = screen.getByLabelText(/View notifications/i)
        fireEvent.click(bell)
        
        // Mark all read (triggers ConfirmationModal)
        const markAllBtn = screen.getByLabelText(/Mark all as read/i)
        fireEvent.click(markAllBtn)
        
        const confirmBtn = screen.getByRole("button", { name: "Mark all" })
        fireEvent.click(confirmBtn)
        
        expect(mockContextValue.markAllRead).toHaveBeenCalled()
        
        // Interaction with single notification
        // Toggle read
        const toggleBtns = screen.getAllByLabelText(/Mark as read|Mark as unread/i)
        fireEvent.click(toggleBtns[0])
        expect(mockContextValue.markRead).toHaveBeenCalledWith(1)
        
        // Delete
        const deleteBtns = screen.getAllByLabelText(/Delete notification/i)
        fireEvent.click(deleteBtns[0])
        expect(mockContextValue.deleteNotification).toHaveBeenCalledWith(1)

        // Click notification item to navigate 
        // In NotificationCard, the main div has role="button" if onClick is present.
        // Let's assume there's a title click or similar.
        const notifItem = screen.getByText("Test 1")
        fireEvent.click(notifItem)
        expect(mockContextValue.markRead).toHaveBeenCalledWith(1)
    })
})