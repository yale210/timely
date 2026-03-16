import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SettingsContent from "@/components/settings/SettingsContent";
import type { Preference } from "@/types";

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

const preference: Preference = {
  id: 1,
  day_start: "08:00:00",
  day_end: "22:00:00",
  max_hours_study_per_day: 4,
  days_off: [],
};

const createProps = (activeSection: "preferences" | "features" | "appearance" | "profile") => ({
  state: {
    activeSection,
    preference,
    fieldErrors: {},
  },
  loading: {
    preference: false,
    saving: false,
  },
  error: {
    preference: null,
  },
  actions: {
    selectSection: vi.fn(),
    logout: vi.fn(),
    setPreference: vi.fn(),
    savePreferences: vi.fn(),
    applyTheme: vi.fn(),
    applyFont: vi.fn(),
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

    const gradebookToggle = screen.getByRole("checkbox", { name: /gradebook/i });
    fireEvent.click(gradebookToggle);

    expect(localStorage.getItem("feature_gradebook_enabled")).toBe("false");
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
  });

  it("renders placeholder and theme branches", () => {
    const { rerender } = render(<SettingsContent {...createProps("profile")} />);
    expect(screen.getByText("profile-section")).toBeInTheDocument();

    rerender(<SettingsContent {...createProps("appearance")} />);
    expect(screen.getByText("theme-section")).toBeInTheDocument();
  });
});
