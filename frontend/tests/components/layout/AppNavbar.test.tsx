import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AppNavbar from "../../../src/components/AppNavbar";
import { BrowserRouter } from "react-router-dom";
import { useNotificationContext } from "../../../src/context/NotificationContext";
import { authStore } from "../../../src/services/authService";

vi.mock("../../../src/context/NotificationContext", async () => {
    const actual = await vi.importActual("../../../src/context/NotificationContext");
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

// Mock NotificationDropdown to focus on AppNavbar logic
vi.mock("../../../src/components/NotificationDropdown", () => ({
  NotificationDropdown: ({ onItemClick, onMarkAllRead, onDeleteAll, onToggleRead, onDeleteItem }: any) => (
    <div data-testid="mock-notification-dropdown">
       <button onClick={() => onItemClick({ id: 1, title: "Test" })}>Click Notification</button>
       <button onClick={onMarkAllRead}>Mark All Read</button>
       <button onClick={onDeleteAll}>Delete All</button>
       <button onClick={() => onToggleRead({ id: 1, is_read: false })}>Toggle Read</button>
       <button onClick={() => onToggleRead({ id: 1, is_read: true })}>Toggle Unread</button>
       <button onClick={() => onDeleteItem({ id: 1 })}>Delete Item</button>
    </div>
  ),
}));

describe("AppNavbar Component", () => {
  const mockContext = {
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
    vi.mocked(authStore.getUser).mockReturnValue({ id: 1, username: "testuser", is_staff: false } as any);
    vi.mocked(useNotificationContext).mockReturnValue(mockContext as any);
  });

  it("renders branding and basic elements", () => {
    render(
      <BrowserRouter>
          <AppNavbar />
      </BrowserRouter>
    );

    expect(screen.getByText("Timely")).toBeInTheDocument();
  });

  it("opens and closes the sliding drawer", async () => {
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
    const { rerender } = render(
      <BrowserRouter>
          <AppNavbar />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Open navigation/i }));
    expect(screen.queryByText("Admin notifications")).not.toBeInTheDocument();

    vi.mocked(authStore.getUser).mockReturnValue({ id: 1, is_staff: true } as any);
    rerender(
      <BrowserRouter>
          <AppNavbar />
      </BrowserRouter>
    );

    expect(screen.getByText("Admin notifications")).toBeInTheDocument();
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

  it("handles notification dropdown callbacks", async () => {
    render(
      <BrowserRouter>
          <AppNavbar />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText("Mark All Read"));
    expect(mockContext.markAllRead).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Delete All"));
    expect(mockContext.deleteAllNotifications).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Toggle Read"));
    expect(mockContext.markRead).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByText("Toggle Unread"));
    expect(mockContext.markUnread).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByText("Delete Item"));
    expect(mockContext.deleteNotification).toHaveBeenCalledWith(1);
    
    // Test clicking a notification navigates and marks read
    fireEvent.click(screen.getByText("Click Notification"));
    expect(mockContext.markRead).toHaveBeenCalledWith(1);
  });

  it("opens account menu", async () => {
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
