import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminNotificationsTips } from "@/pages/Admin/Notifications/AdminNotifications/AdminNotificationsTips";

describe("AdminNotificationsTips", () => {
  it("renders the static broadcast guidance", () => {
    render(<AdminNotificationsTips />);

    expect(screen.getByText("Broadcast tips")).toBeDefined();
    expect(screen.getByText("Keep messages concise (title up to 60 chars, body up to 240 chars).")).toBeDefined();
    expect(screen.getByText("Validate your audience before confirming send.")).toBeDefined();
    expect(screen.getByText("Push notifications are delivered immediately after queueing.")).toBeDefined();
  });
});
