import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminHistoryDetailRecipientsTable } from "@/components/admin/notifications/AdminHistoryDetailRecipientsTable";
import type { BroadcastRecipientDetail } from "@/types/notification";

describe("AdminHistoryDetailRecipientsTable Component", () => {
  const mockRecipients: BroadcastRecipientDetail[] = [
    {
      id: 1,
      recipient: 101,
      username: "user1",
      email: "user1@example.com",
      status: "SENT",
      error_code: "",
      error_message: "",
      last_attempt_at: "2023-01-01T10:00:00Z",
      notification: 1,
    },
    {
      id: 2,
      recipient: 102,
      username: "user2",
      email: "user2@example.com",
      status: "FAILED",
      error_code: "TIMEOUT",
      error_message: "Network Timeout",
      last_attempt_at: "2023-01-01T10:00:05Z",
      notification: null,
    },
  ];

  it("renders recipient list correctly", () => {
    render(<AdminHistoryDetailRecipientsTable recipients={mockRecipients} />);
    
    expect(screen.getByText("Recipient delivery")).toBeDefined();
    
    expect(screen.getByText("user1")).toBeDefined();
    expect(screen.getByText("user1@example.com")).toBeDefined();
    expect(screen.getByText("SENT")).toBeDefined();
    
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
