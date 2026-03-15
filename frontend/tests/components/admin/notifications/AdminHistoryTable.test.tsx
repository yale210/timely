import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminHistoryTable } from "@/components/admin/notifications/AdminHistoryTable";
import type { BroadcastJobSummary } from "@/types";

describe("AdminHistoryTable Component", () => {
  const mockOnSelectItem = vi.fn();
  const mockOnPreviousPage = vi.fn();
  const mockOnNextPage = vi.fn();

  const mockItems: BroadcastJobSummary[] = [
    {
      id: 1,
      title: "Test Broadcast 1",
      target: "all",
      sender: 1,
      sender_username: "admin1",
      status: "COMPLETED",
      queued_at: "2023-01-01T10:00:00Z",
      completed_at: "2023-01-01T10:01:00Z",
      recipient_count: 10,
      delivered_count: 10,
      failed_count: 0,
    },
    {
      id: 2,
      title: "Test Broadcast 2",
      target: "staff",
      sender: null,
      sender_username: null,
      status: "IN_PROGRESS",
      queued_at: "2023-01-02T11:00:00Z",
      completed_at: null,
      recipient_count: 5,
      delivered_count: 2,
      failed_count: 1,
    },
  ];

  const defaultProps = {
    items: mockItems,
    loading: false,
    page: 1,
    totalPages: 3,
    onSelectItem: mockOnSelectItem,
    onPreviousPage: mockOnPreviousPage,
    onNextPage: mockOnNextPage,
  };

  it("renders loading state", () => {
    render(<AdminHistoryTable {...defaultProps} loading={true} />);
    expect(screen.getByText("Loading...")).toBeDefined();
    expect(screen.getByText("Previous")).toBeDisabled();
    expect(screen.getByText("Next")).toBeDisabled();
  });

  it("renders empty state", () => {
    render(<AdminHistoryTable {...defaultProps} items={[]} />);
    expect(screen.getByText("No broadcast history found.")).toBeDefined();
  });

  it("renders list of items correctly", () => {
    render(<AdminHistoryTable {...defaultProps} />);
    
    expect(screen.getByText("Test Broadcast 1")).toBeDefined();
    expect(screen.getByText("Delivered 10/10")).toBeDefined();
    expect(screen.getByText("admin1")).toBeDefined();
    expect(screen.getByText("COMPLETED")).toBeDefined();

    expect(screen.getByText("Test Broadcast 2")).toBeDefined();
    expect(screen.getByText("Delivered 2/5")).toBeDefined();
    expect(screen.getByText("System")).toBeDefined();
    expect(screen.getByText("IN_PROGRESS")).toBeDefined();
  });

  it("calls onSelectItem when a row is clicked", () => {
    render(<AdminHistoryTable {...defaultProps} />);
    
    const row = screen.getByText("Test Broadcast 1").closest("tr");
    fireEvent.click(row!);
    
    expect(mockOnSelectItem).toHaveBeenCalledWith(1);
  });

  it("displays pagination info correctly", () => {
    render(<AdminHistoryTable {...defaultProps} page={2} totalPages={5} />);
    expect(screen.getByText("Page 2 of 5")).toBeDefined();
  });

  it("calls pagination callbacks and disables buttons correctly", () => {
    const { rerender } = render(<AdminHistoryTable {...defaultProps} page={1} totalPages={3} />);
    
    const prevBtn = screen.getByText("Previous");
    const nextBtn = screen.getByText("Next");

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(nextBtn);
    expect(mockOnNextPage).toHaveBeenCalled();

    rerender(<AdminHistoryTable {...defaultProps} page={2} totalPages={3} />);
    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).not.toBeDisabled();
    
    fireEvent.click(prevBtn);
    expect(mockOnPreviousPage).toHaveBeenCalled();

    rerender(<AdminHistoryTable {...defaultProps} page={3} totalPages={3} />);
    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).toBeDisabled();
  });
});

