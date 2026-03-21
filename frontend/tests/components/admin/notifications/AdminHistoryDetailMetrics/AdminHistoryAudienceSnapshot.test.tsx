import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AdminHistoryAudienceSnapshot } from "@/components/admin/notifications/AdminHistoryDetailMetrics/AdminHistoryAudienceSnapshot";
import { type BroadcastJobDetail } from "@/types";

describe("AdminHistoryAudienceSnapshot Component", () => {
  it("renders audience snapshot", () => {
    const detail: BroadcastJobDetail = {
      id: 1,
      title: "Test",
      message: "Test",
      target: "all",
      recipient_count: 50,
      delivered_count: 50,
      failed_count: 0,
      created_at: "2023-01-01",
      audience_snapshot: { recipient_count: 50 },
    };
    render(<AdminHistoryAudienceSnapshot detail={detail} />);

    expect(screen.getByText("Audience snapshot")).toBeDefined();
    expect(screen.getByText("all")).toBeDefined();
    expect(screen.getByText("50")).toBeDefined();
  });
});
