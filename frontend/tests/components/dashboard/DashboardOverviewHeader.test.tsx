import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DashboardOverviewHeader from "@/components/dashboard/DashboardOverviewHeader";

describe("DashboardOverviewHeader", () => {
  it("renders the active overview title and period options", () => {
    render(
      <DashboardOverviewHeader
        periodLabel="Weekly"
        selectedPeriod="weekly"
        onPeriodChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Weekly Overview" })).toBeInTheDocument();
    expect(screen.getByLabelText("Period")).toHaveValue("weekly");
    expect(screen.getByRole("option", { name: "Daily" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "All-Time" })).toBeInTheDocument();
  });

  it("calls onPeriodChange when the selected period changes", () => {
    const onPeriodChange = vi.fn();

    render(
      <DashboardOverviewHeader
        periodLabel="Weekly"
        selectedPeriod="weekly"
        onPeriodChange={onPeriodChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Period"), {
      target: { value: "monthly" },
    });

    expect(onPeriodChange).toHaveBeenCalledWith("monthly");
  });
});
