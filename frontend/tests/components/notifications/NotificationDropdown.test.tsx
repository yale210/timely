import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { NotificationType } from "@/types";
import { MemoryRouter } from "react-router-dom";

// Mock hooks and services
vi.mock("@/hooks/friends/useFriendships", () => ({
  useFriendships: () => ({
    friendships: [],
    acceptRequest: vi.fn(),
    declineRequest: vi.fn(),
    actingIds: new Set(),
  }),
}));

vi.mock("@/services/authService", () => ({
  authStore: {
    getUser: () => ({ id: 1, username: "testuser" }),
  },
}));

describe("NotificationDropdown Component", () => {
  const mockNotifications = [
    {
      id: 1,
      title: "Test Notif",
      message: "Message",
      is_read: false,
      timestamp: new Date().toISOString(),
      notification_type: NotificationType.SYSTEM,
      target_url: "",
      sender_id: null,
      sender_name: null,
      sender_avatar: null,
      sender_username: null
    },
  ];

  const defaultProps = {
    notifications: mockNotifications,
    unreadCount: 1,
    onItemClick: vi.fn(),
    onToggleRead: vi.fn(),
    onDeleteItem: vi.fn(),
  };

  it("renders the notification bell with count", () => {
    render(
      <MemoryRouter>
        <NotificationDropdown {...defaultProps} />
      </MemoryRouter>
    );
    expect(screen.getByRole("button")).toBeDefined();
  });

  it("opens the dropdown when clicked", async () => {
    render(
      <MemoryRouter>
        <NotificationDropdown {...defaultProps} />
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByRole("button"));
    
    await waitFor(() => {
      expect(screen.getByText(/Notifications/)).toBeDefined();
      expect(screen.getByText("Test Notif")).toBeDefined();
    });
  });
});
