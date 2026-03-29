import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SettingsFeatureSection from "@/components/settings/SettingsFeatureSection";

vi.mock("@/components/ui", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("SettingsFeatureSection", () => {
  const getFeatureCheckbox = (label: string) => {
    const row = screen.getByText(label).closest("label");
    expect(row).toBeTruthy();
    return within(row!).getByRole("checkbox");
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it("reads the stored feature flags on initial render", () => {
    localStorage.setItem("feature_assessments_enabled", "false");
    localStorage.setItem("feature_courses_enabled", "false");

    render(<SettingsFeatureSection />);

    expect(getFeatureCheckbox("Assessments")).not.toBeChecked();
    expect(getFeatureCheckbox("Courses")).not.toBeChecked();
    expect(getFeatureCheckbox("Gradebook")).toBeChecked();
  });

  it("persists the correct storage key and dispatches the feature change event", () => {
    const listener = vi.fn();
    window.addEventListener("feature-flags-changed", listener);

    render(<SettingsFeatureSection />);
    fireEvent.click(getFeatureCheckbox("Gradebook"));

    expect(localStorage.getItem("feature_gradebook_enabled")).toBe("false");
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener("feature-flags-changed", listener);
  });
});
