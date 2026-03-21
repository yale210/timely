import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminHistoryHistoryTableRow } from "@/components/admin/notifications/AdminHistoryTable/AdminHistoryHistoryTableRow";
import { type BroadcastJobSummary } from "@/types";

describe("AdminHistoryHistoryTableRow Component", () => {
  it("renders item and handles click", () => {
    const item: BroadcastJobSummary = {
      id: 1,
      title: "Test Job",
      target: "all",
      sender: 1,
      sender_username: "admin",
      status: "COMPLETED",
      recipient_count: 10,
      delivered_count: 10,
      failed_count: 0,
      queued_at: "2023-01-01T12:00:00Z",
      completed_at: "2023-01-01T12:05:00Z",
    };
    const onSelect = vi.fn();
    render(
      <table>
        <tbody>
          <AdminHistoryHistoryTableRow item={item} onSelectItem={onSelect} />
        </tbody>
      </table>
    );

    expect(screen.getByText("Test Job")).toBeDefined();
    expect(screen.getByText("admin")).toBeDefined();
    
    fireEvent.click(screen.getByText("Test Job"));
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
