import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NotificationBell } from "@/components/notifications/NotificationBell";

describe("NotificationBell Component", () => {
  it("renders as a button by default", () => {
    render(<NotificationBell unreadCount={0} />);
    const bell = screen.getByRole("button", { name: /view notifications/i });
    expect(bell).toBeDefined();
    expect(bell.getAttribute("type")).toBe("button");
  });

  it("renders as a div when specified", () => {
    const { container } = render(<NotificationBell unreadCount={0} as="div" />);
    const div = container.querySelector("div[aria-label='View notifications']");
    expect(div).toBeDefined();
    expect(div?.getAttribute("type")).toBeNull();
  });

  it("shows unread count badge for 1-9 notifications", () => {
    render(<NotificationBell unreadCount={5} />);
    expect(screen.getByText("5")).toBeDefined();
  });

  it("shows '9+' badge for 10 or more notifications", () => {
    const { rerender } = render(<NotificationBell unreadCount={10} />);
    expect(screen.getByText("9+")).toBeDefined();
    
    rerender(<NotificationBell unreadCount={99} />);
    expect(screen.getByText("9+")).toBeDefined();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<NotificationBell unreadCount={0} onClick={handleClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalled();
  });

  it("does not show badge when unreadCount is 0", () => {
    render(<NotificationBell unreadCount={0} />);
    expect(screen.queryByText(/[0-9]/)).toBeNull();
  });
});
