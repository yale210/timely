import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { vi, describe, it, expect, afterEach } from "vitest";
import { NotificationsList } from "@/components/notifications/NotificationsList";

// Mock NotificationCard
vi.mock("@/components/notifications/NotificationCard", () => ({
  NotificationCard: ({ notification, onClick, onToggleRead, onDelete }: any) => (
    <div data-testid={`card-${notification.id}`}>
      <span onClick={() => onClick(notification)}>{notification.title}</span>
      <button onClick={() => onToggleRead(notification)}>Toggle</button>
      <button onClick={() => onDelete(notification)}>Delete</button>
    </div>
  ),
}));

describe("NotificationsList Component", () => {
  afterEach(() => {
    cleanup();
  });

  const mockOnNotificationClick = vi.fn();
  const mockOnToggleRead = vi.fn();
  const mockOnDeleteRequest = vi.fn();
  const mockOnPageChange = vi.fn();

  const mockNotifications = [
    { id: 1, title: "N1" },
    { id: 2, title: "N2" },
  ];

  const defaultProps = {
    notifications: mockNotifications as any,
    page: 1,
    totalPages: 3,
    paginationWindow: [1, 2, 3],
    loading: false,
    contextLoading: false,
    onNotificationClick: mockOnNotificationClick,
    onToggleRead: mockOnToggleRead,
    onDeleteRequest: mockOnDeleteRequest,
    onPageChange: mockOnPageChange,
  };

  it("renders notifications correctly", () => {
    render(<NotificationsList {...defaultProps} />);
    expect(screen.getByText("N1")).toBeDefined();
    expect(screen.getByText("N2")).toBeDefined();
  });

  it("handles notification interactions", () => {
    render(<NotificationsList {...defaultProps} />);
    
    fireEvent.click(screen.getByText("N1"));
    expect(mockOnNotificationClick).toHaveBeenCalledWith(mockNotifications[0]);

    fireEvent.click(screen.getAllByText("Toggle")[0]);
    expect(mockOnToggleRead).toHaveBeenCalledWith(mockNotifications[0]);

    fireEvent.click(screen.getAllByText("Delete")[0]);
    expect(mockOnDeleteRequest).toHaveBeenCalledWith(mockNotifications[0]);
  });

  it("handles pagination clicks", () => {
    render(<NotificationsList {...defaultProps} page={2} />);
    
    fireEvent.click(screen.getByText("Previous"));
    expect(mockOnPageChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByText("Next"));
    expect(mockOnPageChange).toHaveBeenCalledWith(3);

    fireEvent.click(screen.getByText("3"));
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it("disables pagination buttons correctly", () => {
    const { rerender } = render(<NotificationsList {...defaultProps} page={1} />);
    expect(screen.getByText("Previous")).toBeDisabled();
    expect(screen.getByText("Next")).not.toBeDisabled();

    rerender(<NotificationsList {...defaultProps} page={3} />);
    expect(screen.getByText("Previous")).not.toBeDisabled();
    expect(screen.getByText("Next")).toBeDisabled();

    rerender(<NotificationsList {...defaultProps} loading={true} />);
    expect(screen.getByText("Previous")).toBeDisabled();
    expect(screen.getByText("Next")).toBeDisabled();
  });

  it("renders empty state correctly", () => {
    render(<NotificationsList {...defaultProps} notifications={[]} />);
    expect(screen.getByText("You're all caught up.")).toBeDefined();
  });

  it("renders loading state correctly when empty (loading prop)", () => {
    render(<NotificationsList {...defaultProps} notifications={[]} loading={true} />);
    expect(screen.getByText("Loading notifications...")).toBeDefined();
  });

  it("renders loading state correctly when empty (contextLoading prop)", () => {
    render(<NotificationsList {...defaultProps} notifications={[]} contextLoading={true} />);
    expect(screen.getByText("Loading notifications...")).toBeDefined();
  });
});
