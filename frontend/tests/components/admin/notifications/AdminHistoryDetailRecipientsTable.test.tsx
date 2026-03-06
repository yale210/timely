import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminHistoryDetailRecipientsTable } from "@/components/admin/notifications/AdminHistoryDetailRecipientsTable";
import type { BroadcastRecipientDetail } from "@/types/notification";

describe("AdminHistoryDetailRecipientsTable Component", () => {
  const mockRecipients: BroadcastRecipientDetail[] = [
    {
      id: 1,
      username: "user1",
      email: "user1@example.com",
      status: "DELIVERED",
      error_message: null,
    },
    {
      id: 2,
      username: "user2",
      email: "user2@example.com",
      status: "FAILED",
      error_message: "Network Timeout",
    },
  ];

  it("renders recipient list correctly", () => {
    render(<AdminHistoryDetailRecipientsTable recipients={mockRecipients} />);
    
    expect(screen.getByText("Recipient delivery")).toBeDefined();
    
    expect(screen.getByText("user1")).toBeDefined();
    expect(screen.getByText("user1@example.com")).toBeDefined();
    expect(screen.getByText("DELIVERED")).toBeDefined();
    
    expect(screen.getByText("user2")).toBeDefined();
    expect(screen.getByText("user2@example.com")).toBeDefined();
    expect(screen.getByText("FAILED")).toBeDefined();
  });

  it("shows error message when present", () => {
    render(<AdminHistoryDetailRecipientsTable recipients={mockRecipients} />);
    expect(screen.getByText("Network Timeout")).toBeDefined();
  });

  it("shows dash when error message is absent", () => {
    render(<AdminHistoryDetailRecipientsTable recipients={mockRecipients} />);
    // There should be at least one dash for user1
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });
});
