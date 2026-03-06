import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { NotificationDetailHeader } from "@/components/notifications/NotificationDetailHeader";
import type { Notification } from "@/types/notification";

describe("NotificationDetailHeader Component", () => {
  const mockNotification: Notification = {
    id: 1,
    recipient: 1,
    sender: null,
    title: "Test Title",
    message: "Test Message",
    timestamp: "2023-01-01T10:00:00Z",
    sender_username: "admin",
    is_read: false,
    notification_type: "SYSTEM",
  };

  const mockOnToggleRead = vi.fn();
  const mockOnDelete = vi.fn();

  it("renders notification details correctly", () => {
    render(
      <NotificationDetailHeader
        notification={mockNotification}
        onToggleRead={mockOnToggleRead}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText("Test Title")).toBeDefined();
    expect(screen.getByText(/Sent by/)).toBeDefined();
    expect(screen.getByText("admin")).toBeDefined();
    expect(screen.getByLabelText("Mark as read")).toBeDefined();
  });

  it("calls onToggleRead when toggle button is clicked", () => {
    render(
      <NotificationDetailHeader
        notification={mockNotification}
        onToggleRead={mockOnToggleRead}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByLabelText("Mark as read"));
    expect(mockOnToggleRead).toHaveBeenCalled();
  });

  it("calls onDelete when delete button is clicked", () => {
    render(
      <NotificationDetailHeader
        notification={mockNotification}
        onToggleRead={mockOnToggleRead}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByLabelText("Delete notification"));
    expect(mockOnDelete).toHaveBeenCalled();
  });

  it("renders 'Mark as unread' when notification is read", () => {
    render(
      <NotificationDetailHeader
        notification={{ ...mockNotification, is_read: true }}
        onToggleRead={mockOnToggleRead}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByLabelText("Mark as unread")).toBeDefined();
  });
});
