import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SettingsContent from "@/components/settings/SettingsContent";
import type { Category, Preference } from "@/types";

vi.mock("@/components/settings/ProfileSection", () => ({
  default: () => <div>profile-section</div>,
}));

vi.mock("@/components/settings/PreferencesSection", () => ({
  default: () => <div>preferences-section</div>,
}));

vi.mock("@/components/settings/SettingsSidebar", () => ({
  default: () => <div>settings-sidebar</div>,
}));

vi.mock("@/components/settings/ThemeSection", () => ({
  default: () => <div>theme-section</div>,
}));

vi.mock("@/components/settings/PrivacySection", () => ({
  default: ({onDeleteEvents, onDeleteTasks}: any) => (
  <div>
  <div>privacy-section</div>,
  <button onClick={onDeleteEvents}>Delete Events</button>,
  <button onClick={onDeleteTasks}>Delete Tasks</button>,
  </div>
  ),
}));

const preference: Preference = {
  id: 1,
  day_start: "08:00:00",
  day_end: "22:00:00",
  max_hours_study_per_day: 4,
  max_days_ahead: 7,
  drag_snap_minutes: 15,
  days_off: [],
};

const createProps = (
  activeSection: "preferences" | "features" | "themes" | "fonts" | "profile" | "privacy",
) => ({
  state: {
    activeSection,
    preference,
    categories: [] as Category[],
    fieldErrors: {},
  },
  loading: {
    preference: false,
    categories: false,
    saving: false,
    deleting: false,
  },
  error: {
    preference: null,
    categories: null,
  },
  actions: {
    selectSection: vi.fn(),
    logout: vi.fn(),
    setPreference: vi.fn(),
    setCategoryLimit: vi.fn(),
    savePreferences: vi.fn(),
    saveCategoryLimits: vi.fn(),
    applyTheme: vi.fn(),
    applyFont: vi.fn(),
    deleteEvents: vi.fn(),
    deleteTasks: vi.fn(),
    makeTeacher: vi.fn(),
    unregisterTeacher: vi.fn(),
  },
});

describe("SettingsContent", () => {
  it("renders the preferences branch", () => {
    render(<SettingsContent {...createProps("preferences")} />);

    expect(screen.getByText("settings-sidebar")).toBeInTheDocument();
    expect(screen.getByText("preferences-section")).toBeInTheDocument();
  });

  it("renders feature toggles and persists their values", () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    render(<SettingsContent {...createProps("features")} />);

    const gradebookCard = screen.getByText("Gradebook").closest("label");
    if (!gradebookCard) {
      throw new Error("Gradebook feature card not found");
    }
    const gradebookToggle = within(gradebookCard).getByRole("checkbox");
    fireEvent.click(gradebookToggle);

    expect(localStorage.getItem("feature_gradebook_enabled")).toBe("false");

    const pomodoroToggle = screen.getByRole("checkbox", { name: /pomodoro/i });
    fireEvent.click(pomodoroToggle);

    expect(localStorage.getItem("feature_pomodoro_enabled")).toBe("false");
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
  });

  it("does not render a weekly summaries feature toggle", () => {
    localStorage.setItem("feature_weekly_summaries_enabled", "true");

    render(<SettingsContent {...createProps("features")} />);

    expect(screen.queryByRole("checkbox", { name: /weekly summaries/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/view weekly statistics about your tasks and productivity\./i)).not.toBeInTheDocument();
  });

  it("renders placeholder and theme branches", () => {
    const { rerender } = render(<SettingsContent {...createProps("profile")} />);
    expect(screen.getByText("profile-section")).toBeInTheDocument();

    rerender(<SettingsContent {...createProps("themes")} />);
    expect(screen.getByText("theme-section")).toBeInTheDocument();

    rerender(<SettingsContent {...createProps("fonts")} />);
    expect(screen.getByText("theme-section")).toBeInTheDocument();
  });

  it("renders privacy menu", () => {
    render(<SettingsContent {...createProps("privacy")} />);


    expect(screen.getByText("privacy-section")).toBeInTheDocument();

    const deleteEventsButton = screen.getByText("Delete Events")
    const deleteTasksButton = screen.getByText("Delete Tasks")

    fireEvent.click(deleteEventsButton);
    fireEvent.click(deleteTasksButton);
  });


});
