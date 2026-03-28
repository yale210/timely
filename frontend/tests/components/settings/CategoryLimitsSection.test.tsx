import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import CategoryLimitsSection from "@/components/settings/CategoryLimitsSection";
import type { Category } from "@/types";

const categories: Category[] = [
  {
    id: 1,
    text: "Maths",
    colour: "#ff0000",
    max_daily_study_time: 30,
  } as Category,
  {
    id: 2,
    text: "Science",
    colour: null,
    max_daily_study_time: null,
  } as Category,
];

describe("CategoryLimitsSection", () => {
  it("shows a loading state", () => {
    render(
      <CategoryLimitsSection
        categories={[]}
        maxDailyMinutes={120}
        loading
        saving={false}
        error={null}
        onLimitChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText("Loading categories...")).toBeInTheDocument();
  });

  it("shows the empty state when there are no categories", () => {
    render(
      <CategoryLimitsSection
        categories={[]}
        maxDailyMinutes={120}
        loading={false}
        saving={false}
        error={null}
        onLimitChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(
      screen.getByText("No categories found yet. Create a category from tasks or calendar first."),
    ).toBeInTheDocument();
  });

  it("renders the section heading and categories", () => {
    render(
      <CategoryLimitsSection
        categories={categories}
        maxDailyMinutes={120}
        loading={false}
        saving={false}
        error={null}
        onLimitChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText("Category Limits")).toBeInTheDocument();
    expect(screen.getByText("Maths")).toBeInTheDocument();
    expect(screen.getByText("Science")).toBeInTheDocument();
    expect(screen.getByDisplayValue("30")).toBeInTheDocument();
  });

  it("shows an error message when provided", () => {
    render(
      <CategoryLimitsSection
        categories={categories}
        maxDailyMinutes={120}
        loading={false}
        saving={false}
        error="Failed to save category limits."
        onLimitChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText("Failed to save category limits.")).toBeInTheDocument();
  });

  it("calls onLimitChange with null when the input is cleared", async () => {
    const onLimitChange = vi.fn();

    render(
      <CategoryLimitsSection
        categories={categories}
        maxDailyMinutes={120}
        loading={false}
        saving={false}
        error={null}
        onLimitChange={onLimitChange}
        onSave={vi.fn()}
      />,
    );

    const inputs = screen.getAllByRole("spinbutton");
    await userEvent.clear(inputs[0]);

    expect(onLimitChange).toHaveBeenCalledWith(1, null);
  });

  it("calls onLimitChange with the entered number", () => {
    const onLimitChange = vi.fn();

    render(
      <CategoryLimitsSection
        categories={categories}
        maxDailyMinutes={120}
        loading={false}
        saving={false}
        error={null}
        onLimitChange={onLimitChange}
        onSave={vi.fn()}
      />,
    );

    const inputs = screen.getAllByRole("spinbutton");
    fireEvent.change(inputs[0], { target: { value: "45" } });

    expect(onLimitChange).toHaveBeenCalledWith(1, 45);
  });

  it("clamps the limit to maxDailyMinutes", async () => {
    const onLimitChange = vi.fn();

    render(
      <CategoryLimitsSection
        categories={categories}
        maxDailyMinutes={60}
        loading={false}
        saving={false}
        error={null}
        onLimitChange={onLimitChange}
        onSave={vi.fn()}
      />,
    );

    const inputs = screen.getAllByRole("spinbutton");
    await userEvent.clear(inputs[0]);
    await userEvent.type(inputs[0], "120");

    expect(onLimitChange).toHaveBeenLastCalledWith(1, 60);
  });

  it("calls onSave when save button is clicked", async () => {
    const onSave = vi.fn();

    render(
      <CategoryLimitsSection
        categories={categories}
        maxDailyMinutes={120}
        loading={false}
        saving={false}
        hasChanges
        error={null}
        onLimitChange={vi.fn()}
        onSave={onSave}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("disables save while saving", () => {
    render(
      <CategoryLimitsSection
        categories={categories}
        maxDailyMinutes={120}
        loading={false}
        saving
        error={null}
        onLimitChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: "Saving..." });
    expect(button).toBeDisabled();
  });

  it("disables save while loading", () => {
    render(
      <CategoryLimitsSection
        categories={categories}
        maxDailyMinutes={120}
        loading
        saving={false}
        error={null}
        onLimitChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText("Loading categories...")).toBeInTheDocument();
  });

  it("disables save when there are no categories", () => {
    render(
      <CategoryLimitsSection
        categories={[]}
        maxDailyMinutes={120}
        loading={false}
        saving={false}
        error={null}
        onLimitChange={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });
});
