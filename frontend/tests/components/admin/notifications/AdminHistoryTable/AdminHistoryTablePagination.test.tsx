import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { AdminHistoryTablePagination } from "@/components/admin/notifications/AdminHistoryTable";

describe("AdminHistoryTablePagination Component", () => {
  it("renders and handles pagination", () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    render(
      <AdminHistoryTablePagination
        page={2}
        totalPages={5}
        loading={false}
        onPreviousPage={onPrev}
        onNextPage={onNext}
      />
    );

    expect(screen.getByText("Page 2 of 5")).toBeDefined();
    
    fireEvent.click(screen.getByText("Previous"));
    expect(onPrev).toHaveBeenCalled();

    fireEvent.click(screen.getByText("Next"));
    expect(onNext).toHaveBeenCalled();
  });
});
