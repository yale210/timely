import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminNotificationsHeader } from "@/pages/Admin/Notifications/AdminNotifications/AdminNotificationsHeader";

describe("AdminNotificationsHeader Component", () => {
  it("renders correctly", () => {
    render(<AdminNotificationsHeader />);
    expect(screen.getByText("Admin notifications")).toBeDefined();
    expect(screen.getByText("Delivered via push notifications")).toBeDefined();
  });
});
