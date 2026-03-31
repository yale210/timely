import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminHistoryDetailMetrics } from "@/components/admin/notifications";
import type { BroadcastJobDetail, BroadcastJobStatusResponse } from "@/types";

describe("AdminHistoryDetailMetrics Component", () => {
  const mockDetail: BroadcastJobDetail = {
    id: 1,
    title: "Test Broadcast",
    message: "Test Content",
    target: "staff",
    sender: 1,
    sender_username: "admin",
    status: "COMPLETED",
    task_id: "task-123",
    queued_at: "2023-01-01T10:00:00Z",
    started_at: "2023-01-01T10:00:05Z",
    completed_at: "2023-01-01T10:01:00Z",
    recipient_count: 10,
    delivered_count: 10,
    failed_count: 0,
    audience_filters: {},
    audience_snapshot: {
      recipient_count: 10,
    },
    provider_errors: [],
    retry_of: null,
    recipients: [],
  };

  const mockStatus: BroadcastJobStatusResponse = {
    id: 1,
    task_id: "task-123",
    status: "COMPLETED",
    recipient_count: 10,
    delivered_count: 9,
    failed_count: 1,
    queued_at: "2023-01-01T10:00:00Z",
    started_at: "2023-01-01T10:00:05Z",
    completed_at: "2023-01-01T10:01:00Z",
    updated_at: "2023-01-01T10:01:00Z",
  };

  it("renders delivery metrics correctly", () => {
    render(<AdminHistoryDetailMetrics detail={mockDetail} status={mockStatus} />);
    
    expect(screen.getByText("Delivery metrics")).toBeDefined();
    expect(screen.getByText("COMPLETED")).toBeDefined();
    expect(screen.getAllByText("10").length).toBeGreaterThanOrEqual(1); // Recipients or Snapshot
    expect(screen.getByText("9")).toBeDefined();  // Delivered
    expect(screen.getByText("1")).toBeDefined();  // Failed
    expect(screen.getByText(/Task ID: task-123/)).toBeDefined();
  });

  it("renders audience snapshot correctly", () => {
    render(<AdminHistoryDetailMetrics detail={mockDetail} status={mockStatus} />);
    
    expect(screen.getByText("Audience snapshot")).toBeDefined();
    expect(screen.getByText("staff")).toBeDefined();
    expect(screen.getAllByText("10").length).toBeGreaterThanOrEqual(1);
  });

  it("uses detail.recipient_count if audience_snapshot.recipient_count is null", () => {
    const detailWithNullSnapshot: BroadcastJobDetail = {
      ...mockDetail,
      recipient_count: 15,
      audience_snapshot: {
        ...mockDetail.audience_snapshot,
        recipient_count: null as unknown as number,
      },
    };
    
    render(<AdminHistoryDetailMetrics detail={detailWithNullSnapshot} status={mockStatus} />);
    
    expect(screen.getByText("15")).toBeDefined();
  });
});
