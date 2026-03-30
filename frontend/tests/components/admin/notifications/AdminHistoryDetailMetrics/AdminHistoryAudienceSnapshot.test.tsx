import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminHistoryAudienceSnapshot } from "@/components/admin/notifications/AdminHistoryDetailMetrics";
import { type BroadcastJobDetail } from "@/types";

describe("AdminHistoryAudienceSnapshot Component", () => {
  it("renders audience snapshot", () => {
    const detail: BroadcastJobDetail = {
      id: 1,
      title: "Test",
      message: "Test",
      target: "all",
      status: "COMPLETED",
      task_id: "test-task-id",
      recipient_count: 50,
      delivered_count: 50,
      failed_count: 0,
      sender: null,
      sender_username: null,
      audience_filters: {},
      audience_snapshot: { recipient_count: 50 },
      provider_errors: [],
      queued_at: "2023-01-01T00:00:00Z",
      started_at: "2023-01-01T00:00:01Z",
      completed_at: "2023-01-01T00:05:00Z",
      retry_of: null,
      recipients: [],
    };
    render(<AdminHistoryAudienceSnapshot detail={detail} />);

    expect(screen.getByText("Audience snapshot")).toBeDefined();
    expect(screen.getByText("all")).toBeDefined();
    expect(screen.getByText("50")).toBeDefined();
  });
});
