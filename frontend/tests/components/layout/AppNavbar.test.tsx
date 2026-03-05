import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AppNavbar from "../../../src/components/AppNavbar";
import { BrowserRouter } from "react-router-dom";
import { useNotificationContext } from "../../../src/context/NotificationContext";
import type { NotificationContextValue } from "../../../src/context/NotificationContext";
import type { Notification } from "../../../src/types/notification";
import { authStore } from "../../../src/services/authService";
import type { User } from "../../../src/services/authService";
import type * as NotificationContextModule from "../../../src/context/NotificationContext";

vi.mock("../../../src/context/NotificationContext", async () => {
    const actual = await vi.importActual<typeof NotificationContextModule>("../../../src/context/NotificationContext");
    return {
        ...actual,
        useNotificationContext: vi.fn(),
    }
});

vi.mock("../../../src/services/authService", () => ({
  authStore: {
    getUser: vi.fn(),
  },
}));

interface MockDropdownProps {
  onItemClick: (n: Notification) => void;
  onMarkAllRead: () => void;
  onDeleteAll: () => void;
  onToggleRead: (n: Notification) => void;
  onDeleteItem: (n: Notification) => void;
}

// Mock NotificationDropdown to focus on AppNavbar logic
vi.mock("../../../src/components/notifications/NotificationDropdown", () => ({
  NotificationDropdown: ({ onItemClick, onMarkAllRead, onDeleteAll, onToggleRead, onDeleteItem }: MockDropdownProps) => (
    <div data-testid="mock-notification-dropdown">
       <button onClick={() => onItemClick({ id: 1, title: "Test", message: "", is_read: false } as Notification)}>Click Notification</button>
       <button onClick={onMarkAllRead}>Mark All Read</button>
       <button onClick={onDeleteAll}>Delete All</button>
       <button onClick={() => onToggleRead({ id: 1, is_read: false } as Notification)}>Toggle Read</button>
       <button onClick={() => onToggleRead({ id: 1, is_read: true } as Notification)}>Toggle Unread</button>
       <button onClick={() => onDeleteItem({ id: 1 } as Notification)}>Delete Item</button>
    </div>
  ),
}));

describe("AppNavbar Component", () => {
  const mockContext: Partial<NotificationContextValue> = {
    notifications: [],
    unreadCount: 0,
    markRead: vi.fn().mockResolvedValue(undefined),
    markUnread: vi.fn().mockResolvedValue(undefined),
    markAllRead: vi.fn().mockResolvedValue(undefined),
    deleteNotification: vi.fn().mockResolvedValue(undefined),
    deleteAllNotifications: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authStore, "getUser").mockReturnValue({ id: 1, username: "testuser", is_staff: false } as User);
    vi.mocked(useNotificationContext).mockReturnValue(mockContext as NotificationContextValue);
  });

  it("renders branding and basic elements", () => {
    render(
      <BrowserRouter>
          <AppNavbar />
      </BrowserRouter>
    );

    expect(screen.getByText("Timely")).toBeInTheDocument();
  });

  it("opens and closes the sliding drawer", () => {
    render(
      <BrowserRouter>
          <AppNavbar />
      </BrowserRouter>
    );

    const openBtn = screen.getByRole("button", { name: /Open navigation/i });
    fireEvent.click(openBtn);

    const nav = screen.getByLabelText("Main");
    expect(nav).toHaveClass("translate-x-0");

    const closeBtn = screen.getByRole("button", { name: /Close navigation/i });
    fireEvent.click(closeBtn);

    expect(nav).toHaveClass("-translate-x-full");
  });

  it("displays admin links only when user is staff", () => {
    // Render once, then update the mocked user and rerender to avoid leaving
    // multiple Navbar instances mounted in the DOM which can make queries flaky.
    const { rerender, unmount } = render(
      <BrowserRouter>
          <AppNavbar />
      </BrowserRouter>
    );

  fireEvent.click(screen.getByRole("button", { name: /Open navigation/i }));
  expect(screen.queryByText(/Admin (notifications|Panel)/i)).not.toBeInTheDocument();

    // Change the user to a staff user and rerender the same tree
    vi.spyOn(authStore, "getUser").mockReturnValue({ id: 1, is_staff: true } as User);
    rerender(
      <BrowserRouter>
          <AppNavbar />
      </BrowserRouter>
    );

  expect(screen.getByText(/Admin (notifications|Panel)/i)).toBeInTheDocument();

    // cleanup to be explicit in tests that modify global mocks/state
    unmount();
  });

  it("navigates and closes drawer when a link is clicked", () => {
    render(
      <BrowserRouter>
          <AppNavbar />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Open navigation/i }));
    const dashboardLink = screen.getByRole("link", { name: /Calendar/i });
    fireEvent.click(dashboardLink);

    const nav = screen.getByLabelText("Main");
    expect(nav).toHaveClass("-translate-x-full");
  });

  it("handles notification dropdown callbacks", () => {
    render(
      <BrowserRouter>
          <AppNavbar />
      </BrowserRouter>
    );

  fireEvent.click(screen.getByText(/Mark All Read/i));
  expect(mockContext.markAllRead).toHaveBeenCalled();

  fireEvent.click(screen.getByText(/Delete All/i));
  expect(mockContext.deleteAllNotifications).toHaveBeenCalled();

  fireEvent.click(screen.getByText(/Toggle Read/i));
  expect(mockContext.markRead).toHaveBeenCalledWith(1);

  fireEvent.click(screen.getByText(/Toggle Unread/i));
  expect(mockContext.markUnread).toHaveBeenCalledWith(1);

  fireEvent.click(screen.getByText(/Delete Item/i));
  expect(mockContext.deleteNotification).toHaveBeenCalledWith(1);
    
    // Test clicking a notification navigates and marks read
    fireEvent.click(screen.getByText("Click Notification"));
    expect(mockContext.markRead).toHaveBeenCalledWith(1);
  });

  it("opens account menu", () => {
    render(
      <BrowserRouter>
          <AppNavbar />
      </BrowserRouter>
    );

    const accountBtn = screen.getByRole("button", { name: /Account/i });
    fireEvent.click(accountBtn);

    // Use getAllByText because Settings appears in both mobile nav and account menu
    expect(screen.getAllByText("Settings").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Log out").length).toBeGreaterThan(0);
  });

  it("cleans up effect - adds and removes body class", () => {
    const { unmount } = render(
      <BrowserRouter>
          <AppNavbar />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /Open navigation/i }));
    expect(document.body.classList.contains("menu-open")).toBe(true);
    
    unmount();
    expect(document.body.classList.contains("menu-open")).toBe(false);
  });
});
