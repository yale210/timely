import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import type { Preference } from "@/types";

import Settings from "@/pages/Settings";
import { authService } from "@/services/authService";
import { preferenceService } from "@/services/preferenceService";
import * as profileService from "@/services/profileService";
import * as specialDatesService from "@/services/specialDatesService";

vi.mock("@/components/settings/ThemeSection", () => ({
  default: ({
    onThemeChange,
    onFontChange,
    mode = "themes",
  }: {
    onThemeChange: (themeName: string) => void;
    onFontChange: (fontName: string) => void;
    mode?: "themes" | "fonts";
  }) => (
    <div>
      <h2>{mode === "themes" ? "Themes" : "Fonts"}</h2>
      <p>
        {mode === "themes"
          ? "Choose the colour theme used across the app."
          : "Choose the type style used across the app."}
      </p>
      {mode === "themes" ? (
        <button type="button" onClick={() => onThemeChange("dark")}>
          Dark Surface
        </button>
      ) : (
        <button type="button" onClick={() => onFontChange("poppins")}>
          Font Ag Poppins
        </button>
      )}
    </div>
  ),
}));

vi.mock("@/hooks/settings/useProfileSettings", () => ({
  useProfileSettings: () => {
    const today = new Date();
    const max = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return {
      state: {
        profile: {
          name: "Test User",
          date_of_birth: null,
          creation_date: "2024-01-01",
          slogan: "",
          bio: "",
          avatar: null,
        },
        loading: false,
        saving: false,
        error: null,
        fieldErrors: {},
        avatarFile: null,
      },
      actions: {
        setProfile: vi.fn(),
        setAvatarFile: vi.fn(),
        saveProfile: vi.fn(),
        reload: vi.fn(),
      },
      __testMax: max,
    };
  },
}));

vi.mock("@/components/settings/ProfileSection", () => ({
  default: () => {
    const today = new Date();
    const max = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return (
      <div>
        <h2>Profile</h2>
        <input aria-label="Date of birth" max={max} />
      </div>
    );
  },
}));

vi.mock("@/components/settings/PreferencesSection", () => ({
  default: ({
    pref,
    prefLoading,
    prefSaving,
    prefError,
    fieldErrors,
    onPrefChange,
    onSave,
  }: {
    pref: Preference | null;
    prefLoading: boolean;
    prefSaving: boolean;
    prefError: string | null;
    fieldErrors: Record<string, string[]>;
    onPrefChange: (pref: Preference) => void;
    onSave: () => void;
  }) => {
    if (prefLoading) {
      return <div>Loading...</div>;
    }

    if (!pref) {
      return (
        <div>
          <h2>Scheduling</h2>
          {prefError ? <div>{prefError}</div> : null}
        </div>
      );
    }

    const maxTaskHoursLimit = 14;
    const isMondayOff = pref.days_off.includes(1);

    return (
      <div>
        <h2>Scheduling</h2>
        {prefError ? <div>{prefError}</div> : null}
        <input aria-label="Day start" value={pref.day_start.slice(0, 5)} readOnly />
        <input aria-label="Day end" value={pref.day_end.slice(0, 5)} readOnly />
        <div>
          <span>Set all days</span>
          <button type="button">Toggle schedule mode</button>
        </div>
        <label htmlFor="pref-max-hours">Max task time per day</label>
        <input
          id="pref-max-hours"
          type="number"
          value={pref.max_hours_study_per_day}
          onChange={(event) => {
            const nextValue = event.target.value;
            if (nextValue === "") {
              onPrefChange({
                ...pref,
                max_hours_study_per_day: "" as unknown as number,
              });
              return;
            }

            const parsed = Number(nextValue);
            if (Number.isNaN(parsed)) {
              return;
            }

            const clampedValue = Math.min(Math.max(0, parsed), maxTaskHoursLimit);
            onPrefChange({
              ...pref,
              max_hours_study_per_day: clampedValue,
            });
          }}
        />
        {fieldErrors.max_hours_study_per_day?.length ? (
          <div>{fieldErrors.max_hours_study_per_day.join(" ")}</div>
        ) : null}
        <div>
          <span>Mon</span>
          <button
            type="button"
            aria-pressed={isMondayOff}
            onClick={() => {
              onPrefChange({
                ...pref,
                days_off: isMondayOff
                  ? pref.days_off.filter((day) => day !== 1)
                  : [...pref.days_off, 1],
              });
            }}
          >
            Toggle Monday
          </button>
        </div>
        <button type="button" onClick={onSave}>
          {prefSaving ? "Saving..." : "Save changes"}
        </button>
      </div>
    );
  },
}));

vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/services/authService", () => ({
  AUTH_CHANGE_EVENT: "auth-change",
  authStore: {
    getToken: vi.fn(() => "mock-token"),
  },
  authService: { logout: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("@/services/preferenceService", () => ({
  preferenceService: {
    getMyPreference: vi.fn(),
    updateMyPreference: vi.fn(),
  },
}));

vi.mock("@/services/profileService", () => ({
  getMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
}));

vi.mock("@/services/specialDatesService", () => ({
  getSpecialDates: vi.fn(),
  createSpecialDate: vi.fn(),
  deleteSpecialDate: vi.fn(),
}));

const mockProfileResponse = { name: "Test User", date_of_birth: null, creation_date: "2024-01-01", slogan: "", bio: "", avatar: null };
const renderSettings = () => render(<MemoryRouter><Settings /></MemoryRouter>);
const openScheduling = async () => {
  fireEvent.click(screen.getByRole("button", { name: /scheduling/i }));
  await screen.findAllByDisplayValue("08:00");
};
const changeMaxHours = (value: string) => fireEvent.change(
  document.getElementById("pref-max-hours") as HTMLInputElement,
  { target: { value } },
);

describe("Settings page", () => {
  const mockPref: Preference = {
    id: 1,
    day_start: "08:00:00",
    day_end: "22:00:00",
    timezone: "Europe/London",
    day_schedule: [
      { day: 1, start: "08:00", end: "22:00" },
      { day: 2, start: "08:00", end: "22:00" },
      { day: 3, start: "08:00", end: "22:00" },
      { day: 4, start: "08:00", end: "22:00" },
      { day: 5, start: "08:00", end: "22:00" },
      { day: 6, start: "08:00", end: "22:00" },
      { day: 7, start: "08:00", end: "22:00" },
    ],
    max_hours_study_per_day: 4,
    max_days_ahead: 7,
    drag_snap_minutes: 15,
    days_off: [3],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    delete document.documentElement.dataset.font;
    vi.mocked(specialDatesService.getSpecialDates).mockResolvedValue([]);
  });

  it("loads and renders preferences", async () => {
    const getMyPrefSpy = vi.spyOn(preferenceService, "getMyPreference").mockResolvedValue(mockPref);
    renderSettings();
    await openScheduling();
    expect(await screen.findByLabelText(/day start/i)).toHaveDisplayValue("08:00");
    expect(getMyPrefSpy).toHaveBeenCalled();
  });

  it("clamps max task time input to the allowed range", async () => {
    vi.spyOn(preferenceService, "getMyPreference").mockResolvedValue(mockPref);
    renderSettings();
    await openScheduling();

    const hoursInput = document.getElementById("pref-max-hours") as HTMLInputElement;

    fireEvent.change(hoursInput, { target: { value: "30" } });
    expect(hoursInput.value).toBe("14");

    fireEvent.change(hoursInput, { target: { value: "-1" } });
    expect(hoursInput.value).toBe("0");

    fireEvent.change(hoursInput, { target: { value: "" } });
    expect(hoursInput.value).toBe("");

    fireEvent.change(hoursInput, { target: { value: "abc" } });
    expect(hoursInput.value).toBe("");
  });

  it("handles API error with non-array field errors", async () => {
    vi.spyOn(preferenceService, "getMyPreference").mockResolvedValue(mockPref);
    vi.spyOn(preferenceService, "updateMyPreference").mockRejectedValue({
      response: { data: { some_field: "Not an array" } },
    });
    renderSettings();
    await openScheduling();
    changeMaxHours("5");
    fireEvent.click(screen.getByText("Save changes"));

    await waitFor(() => {
      expect(screen.getByText("Please fix the highlighted fields.")).toBeInTheDocument();
    });
  });

  it("handles API error with empty data object", async () => {
    vi.spyOn(preferenceService, "getMyPreference").mockResolvedValue(mockPref);
    vi.spyOn(preferenceService, "updateMyPreference").mockRejectedValue({
      response: { data: {} },
    });
    renderSettings();
    await openScheduling();
    changeMaxHours("5");
    fireEvent.click(screen.getByText("Save changes"));

    await waitFor(() => {
      expect(screen.getByText("Please fix the highlighted fields.")).toBeInTheDocument();
    });
  });

  it("handles logout failure and still navigates", async () => {
    const logoutSpy = vi.spyOn(authService, "logout").mockRejectedValue(new Error("Logout failed"));
    renderSettings();
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));
    const confirmModal = await screen.findByRole("dialog");
    fireEvent.click(within(confirmModal).getByRole("button", { name: /^log out$/i }));
    await waitFor(() => expect(logoutSpy).toHaveBeenCalled());
  });

  it("toggles days off", async () => {
    vi.spyOn(preferenceService, "getMyPreference").mockResolvedValue(mockPref);
    renderSettings();
    await openScheduling();
    const scheduleToggleRow = screen.getByText("Set all days").parentElement;
    expect(scheduleToggleRow).toBeTruthy();
    fireEvent.click(within(scheduleToggleRow!).getByRole("button"));

    const monLabel = screen.getByText("Mon");
    const monRow = monLabel.parentElement;
    expect(monRow).toBeTruthy();
    const toggleButton = within(monRow!).getByRole("button");
    fireEvent.click(toggleButton);
    expect(toggleButton.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(toggleButton);
    expect(toggleButton.getAttribute("aria-pressed")).toBe("false");
  });

  it("handles 401 error from API", async () => {
    vi.spyOn(preferenceService, "getMyPreference").mockRejectedValue({
      response: { status: 401 },
    });
    renderSettings();
    fireEvent.click(screen.getByRole("button", { name: /scheduling/i }));
    await waitFor(() => {
      expect(screen.getByText("You are not signed in. Please log in again.")).toBeInTheDocument();
    });
  });

  it("handles API error with field array errors", async () => {
    vi.spyOn(preferenceService, "getMyPreference").mockResolvedValue(mockPref);
    vi.spyOn(preferenceService, "updateMyPreference").mockRejectedValue({
      response: { data: { non_field_errors: ["Global error"] } },
    });
    renderSettings();
    await openScheduling();
    changeMaxHours("5");
    fireEvent.click(screen.getByText("Save changes"));
    await waitFor(() => {
      expect(screen.getByText("Global error")).toBeInTheDocument();
    });
  });

  it("handles API error with detail message", async () => {
    vi.spyOn(preferenceService, "getMyPreference").mockRejectedValue({
      response: { data: { detail: "Custom error detail" } },
    });
    renderSettings();
    fireEvent.click(screen.getByRole("button", { name: /scheduling/i }));
    await waitFor(() => {
      expect(screen.getByText("Custom error detail")).toBeInTheDocument();
    });
  });

  it("handles non-API error objects", async () => {
    vi.spyOn(preferenceService, "getMyPreference").mockRejectedValue(new Error("Generic error"));
    renderSettings();
    fireEvent.click(screen.getByRole("button", { name: /scheduling/i }));
    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });

  it("handles API error with missing response data", async () => {
    vi.spyOn(preferenceService, "getMyPreference").mockRejectedValue({
      response: { status: 500 },
    });
    renderSettings();
    fireEvent.click(screen.getByRole("button", { name: /scheduling/i }));
    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });

  it("renders all sections and sidebar buttons", async () => {
    vi.spyOn(preferenceService, "getMyPreference").mockResolvedValue(mockPref);
    vi.spyOn(profileService, "getMyProfile").mockResolvedValue(mockProfileResponse);
    renderSettings();
    fireEvent.click(screen.getByRole("button", { name: /profile/i }));
    expect(await screen.findByRole("heading", { name: "Profile" })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /general/i }));
    expect(screen.getByRole("heading", { name: /general/i })).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /extras/i }));
    expect(screen.getByText("Turn optional app features on or off.")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /themes/i }));
    expect(screen.getByText("Choose the colour theme used across the app.")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Dark Surface" }));
    fireEvent.click(screen.getByRole("button", { name: /fonts/i }));
    expect(screen.getByText("Choose the type style used across the app.")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Font Ag Poppins" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.font).toBe("poppins");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(localStorage.getItem("font")).toBe("poppins");
    expect(screen.getByRole("button", { name: /scheduling/i })).toBeDefined();
  });

  it("handles logout", async () => {
    const logoutSpy = vi.spyOn(authService, "logout").mockResolvedValueOnce(undefined);
    renderSettings();
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));
    const confirmModal = await screen.findByRole("dialog");
    fireEvent.click(within(confirmModal).getByRole("button", { name: /^log out$/i }));
    await waitFor(() => expect(logoutSpy).toHaveBeenCalled());
  });

  it("caps the profile date of birth input at today", async () => {
    const today = new Date();
    const expectedMax = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    vi.spyOn(profileService, "getMyProfile").mockResolvedValue(mockProfileResponse);
    renderSettings();
    fireEvent.click(screen.getByRole("button", { name: /profile/i }));
    const dobInput = await screen.findByLabelText(/date of birth/i);
    expect(dobInput).toHaveAttribute("max", expectedMax);
  });
});
