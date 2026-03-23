import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { AdminHistoryTableRow } from "@/components/admin/notifications/AdminHistoryTable/AdminHistoryTableRow";
import { type BroadcastJobSummary } from "@/types";

describe("AdminHistoryTableRow Component", () => {
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
      <MemoryRouter>
        <table>
          <tbody>
            <AdminHistoryTableRow item={item} onSelectItem={onSelect} />
          </tbody>
        </table>
      </MemoryRouter>
    );

    expect(screen.getByText("Test Job")).toBeDefined();
    expect(screen.getByText("admin")).toBeDefined();
    
    const row = screen.getByText("Test Job").closest("tr");
    fireEvent.click(row!);
    expect(onSelect).toHaveBeenCalledWith(1);
  });
});
