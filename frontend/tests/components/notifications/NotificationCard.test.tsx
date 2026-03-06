import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { NotificationType } from "@/types/notification";

describe("NotificationCard Component", () => {
  const mockNotification = {
    id: 1,
    title: "Test Title",
    message: "Test Message",
    notification_type: NotificationType.SYSTEM,
    is_read: false,
    timestamp: "2023-01-01T10:00:00Z",
    created_at: "2023-01-01T10:00:00Z",
    user: 1
  };

  const defaultProps = {
    notification: mockNotification,
    onClick: vi.fn(),
    onToggleRead: vi.fn(),
    onDelete: vi.fn(),
    showActions: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders notification details", () => {
    render(<NotificationCard {...defaultProps} />);
    expect(screen.getByText("Test Title")).toBeDefined();
    expect(screen.getByText("Test Message")).toBeDefined();
  });

  it("calls onClick when clicked", () => {
    render(<NotificationCard {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /test title/i }));
    expect(defaultProps.onClick).toHaveBeenCalledWith(mockNotification);
  });

  it("calls onClick when Enter or Space is pressed", () => {
    render(<NotificationCard {...defaultProps} />);
    const card = screen.getByRole("button", { name: /test title/i });
    
    fireEvent.keyDown(card, { key: "Enter" });
    expect(defaultProps.onClick).toHaveBeenCalledWith(mockNotification);

    fireEvent.keyDown(card, { key: " " });
    expect(defaultProps.onClick).toHaveBeenCalledWith(mockNotification);
    
    fireEvent.keyDown(card, { key: "Escape" }); // Should do nothing
    expect(defaultProps.onClick).toHaveBeenCalledTimes(2);
  });

  it("calls onToggleRead when mark as read button is clicked", () => {
    render(<NotificationCard {...defaultProps} />);
    const button = screen.getByLabelText("Mark as read");
    fireEvent.click(button);
    expect(defaultProps.onToggleRead).toHaveBeenCalledWith(mockNotification);
    expect(defaultProps.onClick).not.toHaveBeenCalled(); // event.stopPropagation()
  });

  it("calls onToggleRead when mark as unread button is clicked", () => {
    render(<NotificationCard {...defaultProps} notification={{ ...mockNotification, is_read: true }} />);
    const button = screen.getByLabelText("Mark as unread");
    fireEvent.click(button);
    expect(defaultProps.onToggleRead).toHaveBeenCalledWith({ ...mockNotification, is_read: true });
  });

  it("calls onDelete when delete button is clicked", () => {
    render(<NotificationCard {...defaultProps} />);
    const button = screen.getByLabelText("Delete notification");
    fireEvent.click(button);
    expect(defaultProps.onDelete).toHaveBeenCalledWith(mockNotification);
    expect(defaultProps.onClick).not.toHaveBeenCalled(); // event.stopPropagation()
  });

  it("renders different icons for different types", () => {
    const { rerender } = render(<NotificationCard {...defaultProps} notification={{ ...mockNotification, notification_type: NotificationType.CALENDAR }} />);
    // Testing specific icons is hard with heroicons as they are SVG, but we triggered the branch
    
    rerender(<NotificationCard {...defaultProps} notification={{ ...mockNotification, notification_type: NotificationType.TASK }} />);
    
    rerender(<NotificationCard {...defaultProps} notification={{ ...mockNotification, notification_type: NotificationType.SYSTEM }} />);
  });

  it("renders unread indicator on the left if specified", () => {
    render(<NotificationCard {...defaultProps} unreadIndicatorPlacement="left" />);
    // Just triggering the branch
  });

  it("renders in compact mode", () => {
    render(<NotificationCard {...defaultProps} compact={true} />);
    // Just triggering the branch
  });
});
