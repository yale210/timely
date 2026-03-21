import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminHistoryDeliveryMetrics } from "@/components/admin/notifications/AdminHistoryDetailMetrics/AdminHistoryDeliveryMetrics";
import { type BroadcastJobStatusResponse } from "@/types";

describe("AdminHistoryDeliveryMetrics Component", () => {
  it("renders delivery metrics", () => {
    const status: BroadcastJobStatusResponse = {
      status: "completed",
      recipient_count: 10,
      delivered_count: 9,
      failed_count: 1,
      task_id: "test-task-id",
    };
    render(<AdminHistoryDeliveryMetrics status={status} />);

    expect(screen.getByText("Delivery metrics")).toBeDefined();
    expect(screen.getByText("completed")).toBeDefined();
    expect(screen.getByText("10")).toBeDefined();
    expect(screen.getByText("9")).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("Task ID: test-task-id")).toBeDefined();
  });
});
