import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminHistoryDeliveryMetrics } from "@/components/admin/notifications/AdminHistoryDetailMetrics/AdminHistoryDeliveryMetrics";
import { type BroadcastJobStatusResponse } from "@/types";

describe("AdminHistoryDeliveryMetrics Component", () => {
  it("renders delivery metrics", () => {
    const status: BroadcastJobStatusResponse = {
      id: 1,
      status: "COMPLETED",
      recipient_count: 10,
      delivered_count: 9,
      failed_count: 1,
      task_id: "test-task-id",
      queued_at: "2023-01-01T12:00:00Z",
      started_at: "2023-01-01T12:00:01Z",
      completed_at: "2023-01-01T12:05:00Z",
      updated_at: "2023-01-01T12:05:00Z",
    };
    render(<AdminHistoryDeliveryMetrics status={status} />);

    expect(screen.getByText("Delivery metrics")).toBeDefined();
    expect(screen.getByText("COMPLETED")).toBeDefined();
    expect(screen.getByText("10")).toBeDefined();
    expect(screen.getByText("9")).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("Task ID: test-task-id")).toBeDefined();
  });
});
