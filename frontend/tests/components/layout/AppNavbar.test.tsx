import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { MemoryRouter, useNavigate, useLocation } from "react-router-dom";
import AppNavbar from "@/components/layout/AppNavbar";
import { useNotificationContext } from "@/context/NotificationContext";
import { authStore } from "@/services/authService";

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: vi.fn(),
    useLocation: vi.fn(),
  };
});

// Mock notification context
vi.mock("@/context/NotificationContext", () => ({
  useNotificationContext: vi.fn(),
}));

// Mock authStore
vi.mock("@/services/authService", () => ({
  authStore: {
    getUser: vi.fn(),
  },
}));

interface NotificationDropdownProps {
  onMarkAllRead: () => void;
  onDeleteAll: () => void;
  onItemClick: (item: { id: number }) => void;
  onToggleRead: (item: { id: number; is_read: boolean }) => void;
  onDeleteItem: (item: { id: number }) => void;
  unreadCount: number;
}

// Mock child components to simplify and focus on AppNavbar logic
vi.mock("@/components/notifications/NotificationDropdown", () => ({
  NotificationDropdown: ({ onMarkAllRead, onDeleteAll, onItemClick, onToggleRead, onDeleteItem, unreadCount }: NotificationDropdownProps) => (
    <div data-testid="notification-dropdown">
        <button onClick={() => onItemClick({ id: 1 })}>Item Click</button>
        <button onClick={() => onToggleRead({ id: 1, is_read: false })}>Toggle Read (to read)</button>
        <button onClick={() => onToggleRead({ id: 2, is_read: true })}>Toggle Read (to unread)</button>
        <button onClick={() => onDeleteItem({ id: 1 })}>Delete Item</button>
        <button onClick={onMarkAllRead}>Mark All Read</button>
        <button onClick={onDeleteAll}>Delete All</button>
        <span>Unread: {unreadCount}</span>
    </div>
  ),
}));

interface AdminSidebarProps {
  onClose: () => void;
}

vi.mock("@/components/layout/AdminSidebar", () => ({
  default: ({ onClose }: AdminSidebarProps) => (
    <div data-testid="admin-sidebar">
      <button onClick={onClose}>Close Admin Sidebar</button>
    </div>
  ),
}));

/**
 * Tests for the AppNavbar component.
 */
describe("AppNavbar Component", () => {
  const mockNavigate = vi.fn();
  const mockMarkRead = vi.fn();
  const mockMarkUnread = vi.fn();
  const mockMarkAllRead = vi.fn();
  const mockDeleteNotification = vi.fn();
  const mockDeleteAllNotifications = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(useLocation).mockReturnValue({ pathname: "/dashboard", search: "", hash: "", state: null, key: "default" });
    vi.mocked(useNotificationContext).mockReturnValue({
      notifications: [],
      unreadCount: 0,
      markRead: mockMarkRead,
      markUnread: mockMarkUnread,
      markAllRead: mockMarkAllRead,
      deleteNotification: mockDeleteNotification,
      deleteAllNotifications: mockDeleteAllNotifications,
    });
    vi.mocked(authStore.getUser.bind(authStore)).mockReturnValue({ is_staff: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the brand name and logo link", () => {
    render(
      <MemoryRouter>
        <AppNavbar />
      </MemoryRouter>
    );
    expect(screen.getAllByText("Timely")).toBeDefined();
  });

  it("opens and closes the navigation drawer", () => {
    render(
      <MemoryRouter>
        <AppNavbar />
      </MemoryRouter>
    );
    
    const openBtn = screen.getByLabelText("Open navigation");
    fireEvent.click(openBtn);
    
    const drawer = screen.getByLabelText("Main");
    expect(drawer.className).toContain("translate-x-0");
    expect(document.body.classList.contains("menu-open")).toBe(true);

    const closeBtn = screen.getByLabelText("Close navigation");
    fireEvent.click(closeBtn);
    
    expect(drawer.className).toContain("-translate-x-full");
    expect(document.body.classList.contains("menu-open")).toBe(false);
  });

  it("renders AdminSidebar when on an admin route", () => {
    vi.mocked(useLocation).mockReturnValue({ pathname: "/admin/notifications", search: "", hash: "", state: null, key: "default" });
    render(
      <MemoryRouter>
        <AppNavbar />
      </MemoryRouter>
    );
    
    // Open drawer to see sidebar
    fireEvent.click(screen.getByLabelText("Open navigation"));
    expect(screen.getByTestId("admin-sidebar")).toBeDefined();
  });

  it("renders main sidebar items when not on an admin route", () => {
    render(
      <MemoryRouter>
        <AppNavbar />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByLabelText("Open navigation"));
    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByText("Calendar")).toBeDefined();
    expect(screen.getByText("Tasks")).toBeDefined();
  });

  it("shows unread notifications count in the sidebar", () => {
    vi.mocked(useNotificationContext).mockReturnValue({
      notifications: [],
      unreadCount: 5,
      markRead: mockMarkRead,
      markUnread: mockMarkUnread,
      markAllRead: mockMarkAllRead,
      deleteNotification: mockDeleteNotification,
      deleteAllNotifications: mockDeleteAllNotifications,
    });
    
    render(
      <MemoryRouter>
        <AppNavbar />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByLabelText("Open navigation"));
    expect(screen.getByText("5")).toBeDefined();
  });

  it("renders Admin Panel link only for staff users", () => {
    const { rerender } = render(
      <MemoryRouter>
        <AppNavbar />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByLabelText("Open navigation"));
    expect(screen.queryByText("Admin Panel")).toBeNull();

    vi.mocked(authStore.getUser.bind(authStore)).mockReturnValue({ is_staff: true });
    rerender(
      <MemoryRouter>
        <AppNavbar />
      </MemoryRouter>
    );
    
    expect(screen.getByText("Admin Panel")).toBeDefined();
  });

  it("handles notification dropdown actions", () => {
    render(
      <MemoryRouter>
        <AppNavbar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Item Click"));
    expect(mockMarkRead).toHaveBeenCalledWith(1);
    expect(mockNavigate).toHaveBeenCalledWith("/notifications/1");

    fireEvent.click(screen.getByText("Toggle Read (to read)"));
    expect(mockMarkRead).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByText("Toggle Read (to unread)"));
    expect(mockMarkUnread).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByText("Delete Item"));
    expect(mockDeleteNotification).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByText("Mark All Read"));
    expect(mockMarkAllRead).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Delete All"));
    expect(mockDeleteAllNotifications).toHaveBeenCalled();
  });

  it("toggles body classes on mount and unmount via effect", () => {
    const { unmount } = render(
      <MemoryRouter>
        <AppNavbar />
      </MemoryRouter>
    );
    
    expect(document.body.style.getPropertyValue("--drawer-width")).toBe("280px");
    
    unmount();
    expect(document.body.style.getPropertyValue("--drawer-width")).toBe("");
  });

  it("renders account menu items when account button is clicked", async () => {
    render(
      <MemoryRouter>
        <AppNavbar />
      </MemoryRouter>
    );
    
    const accountBtn = screen.getByRole("button", { name: /account/i });
    fireEvent.click(accountBtn);
    
    await waitFor(() => {
      expect(screen.getByRole("menuitem", { name: "Settings" })).toBeDefined();
      expect(screen.getByRole("menuitem", { name: "Log out" })).toBeDefined();
    });

    const settingsLink = screen.getByRole("menuitem", { name: "Settings" });
    fireEvent.mouseEnter(settingsLink);
    settingsLink.focus();

    const logoutLink = screen.getByRole("menuitem", { name: "Log out" });
    fireEvent.mouseEnter(logoutLink);
    logoutLink.focus();
  });

  it("applies active classes to NavLinks", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <AppNavbar />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByLabelText("Open navigation"));
    const dashboardLink = screen.getByRole("link", { name: "Dashboard" });
    expect(dashboardLink.className).toContain("bg-cyan-50");

    fireEvent.click(dashboardLink);
    expect(document.body.classList.contains("menu-open")).toBe(false);

    const calendarLink = screen.getByRole("link", { name: "Calendar" });
    expect(calendarLink.className).not.toContain("bg-cyan-50");
  });

  it("applies active classes to Notifications NavLink and handles click", () => {
    render(
      <MemoryRouter initialEntries={["/notifications"]}>
        <AppNavbar />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByLabelText("Open navigation"));
    const notificationsLink = screen.getByRole("link", { name: /notifications/i });
    expect(notificationsLink.className).toContain("bg-cyan-50");

    fireEvent.click(notificationsLink);
    expect(document.body.classList.contains("menu-open")).toBe(false);
  });

  it("handles admin panel link click", () => {
    vi.mocked(authStore.getUser.bind(authStore)).mockReturnValue({ is_staff: true });
    render(
      <MemoryRouter>
        <AppNavbar />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByLabelText("Open navigation"));
    const adminLink = screen.getByText("Admin Panel");
    fireEvent.click(adminLink);
    expect(document.body.classList.contains("menu-open")).toBe(false);
  });

  it("handles account links in sidebar click", () => {
    render(
      <MemoryRouter>
        <AppNavbar />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByLabelText("Open navigation"));
    const logoutSidebarLink = screen.getByRole("link", { name: "Log out" });
    fireEvent.click(logoutSidebarLink);
    expect(document.body.classList.contains("menu-open")).toBe(false);
  });

  it("handles logo link in drawer click", () => {
    render(
      <MemoryRouter>
        <AppNavbar />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByLabelText("Open navigation"));
    const logoLink = screen.getByAltText("Timely").parentElement!;
    fireEvent.click(logoLink);
    expect(document.body.classList.contains("menu-open")).toBe(false);
  });
});
