import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AdminHistoryDetailRecipientsTable } from "@/components/admin/notifications";
import type { BroadcastRecipientDetail } from "@/types";

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
    {
      id: 3,
      recipient: 103,
      username: "user3",
      email: "user3@example.com",
      status: "SENT_NO_PUSH",
      error_code: "",
      error_message: "",
      last_attempt_at: "2023-01-01T10:00:03Z",
      notification: 3,
    },
  ];

  const defaultProps = {
    recipients: mockRecipients,
    page: 1,
    totalPages: 1,
    loading: false,
    onPageChange: vi.fn(),
  };

  it("renders recipient list correctly", () => {
    render(<AdminHistoryDetailRecipientsTable {...defaultProps} />);
    
    expect(screen.getByText("Recipient delivery")).toBeDefined();
    
    expect(screen.getByText("user1")).toBeDefined();
    expect(screen.getByText("user1@example.com")).toBeDefined();
    expect(screen.getByText("Sent")).toBeDefined();
    
    expect(screen.getByText("user2")).toBeDefined();
    expect(screen.getByText("user2@example.com")).toBeDefined();
    expect(screen.getByText("Failed")).toBeDefined();

    expect(screen.getByText("user3")).toBeDefined();
    expect(screen.getByText("No push devices")).toBeDefined();
  });

  it("shows error message when present", () => {
    render(<AdminHistoryDetailRecipientsTable {...defaultProps} />);
    expect(screen.getByText("Network Timeout")).toBeDefined();
  });

  it("shows dash when error message is absent", () => {
    render(<AdminHistoryDetailRecipientsTable {...defaultProps} />);
    expect(screen.getAllByText("-").length).toBeGreaterThanOrEqual(1);
  });
});
