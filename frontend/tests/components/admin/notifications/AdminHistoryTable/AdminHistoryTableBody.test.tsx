import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminHistoryTableBody } from "@/components/admin/notifications/AdminHistoryTable/AdminHistoryTableBody";
import { type BroadcastJobSummary } from "@/types";

describe("AdminHistoryTableBody Component", () => {
  it("renders loading state", () => {
    render(<table><AdminHistoryTableBody items={[]} loading={true} onSelectItem={vi.fn()} /></table>);
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("renders empty state", () => {
    render(<table><AdminHistoryTableBody items={[]} loading={false} onSelectItem={vi.fn()} /></table>);
    expect(screen.getByText("No broadcast history found.")).toBeDefined();
  });

  it("renders items", () => {
    const items: BroadcastJobSummary[] = [{
      id: 1, title: "T", target: "all", status: "C", recipient_count: 1, delivered_count: 1, failed_count: 0, queued_at: "2023-01-01", sender_username: "u"
    }];
    render(<table><AdminHistoryTableBody items={items} loading={false} onSelectItem={vi.fn()} /></table>);
    expect(screen.getByText("T")).toBeDefined();
  });
});
