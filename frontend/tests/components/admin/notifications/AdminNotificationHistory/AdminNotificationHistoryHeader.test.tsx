import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminNotificationHistoryHeader } from "@/components/admin/notifications";

describe("AdminNotificationHistoryHeader Component", () => {
  it("renders correctly and handles navigation", () => {
    const onNew = vi.fn();
    render(<AdminNotificationHistoryHeader onNewNotification={onNew} />);

    expect(screen.getByText("Notification history")).toBeDefined();
    
    fireEvent.click(screen.getByText("New notification"));
    expect(onNew).toHaveBeenCalled();
  });
});
