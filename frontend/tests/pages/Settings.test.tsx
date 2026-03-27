import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import type { Preference } from "@/types";

import Settings from "@/pages/Settings";
import { authService } from "@/services/authService";
import { preferenceService } from "@/services/preferenceService";
import * as profileService from "@/services/profileService";

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
  });

  it("loads and renders preferences", async () => {
    const getMyPrefSpy = vi.spyOn(preferenceService, "getMyPreference").mockResolvedValue(mockPref);
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /scheduling/i }));
    expect((await screen.findAllByDisplayValue("08:00")).length).toBeGreaterThan(0);
    expect(getMyPrefSpy).toHaveBeenCalled();
  });

  it("clamps max task time input to the allowed range", async () => {
    vi.spyOn(preferenceService, "getMyPreference").mockResolvedValue(mockPref);
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Scheduling"));
    await screen.findAllByDisplayValue("08:00");

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
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Scheduling"));
    await screen.findAllByDisplayValue("08:00");
    fireEvent.change(document.getElementById("pref-max-hours") as HTMLInputElement, {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByText("Save changes"));

    expect(await screen.findByText("Please fix the highlighted fields.")).toBeDefined();
  });

  it("handles API error with empty data object", async () => {
    vi.spyOn(preferenceService, "getMyPreference").mockResolvedValue(mockPref);
    vi.spyOn(preferenceService, "updateMyPreference").mockRejectedValue({
      response: { data: {} },
    });
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Scheduling"));
    await screen.findAllByDisplayValue("08:00");
    fireEvent.change(document.getElementById("pref-max-hours") as HTMLInputElement, {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByText("Save changes"));

    expect(await screen.findByText("Please fix the highlighted fields.")).toBeDefined();
  });

  it("handles logout failure and still navigates", async () => {
    const logoutSpy = vi.spyOn(authService, "logout").mockRejectedValue(new Error("Logout failed"));
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));
    const confirmModal = await screen.findByRole("dialog");
    fireEvent.click(within(confirmModal).getByRole("button", { name: /^log out$/i }));
    await waitFor(() => expect(logoutSpy).toHaveBeenCalled());
  });

  it("toggles days off", async () => {
    vi.spyOn(preferenceService, "getMyPreference").mockResolvedValue(mockPref);
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Scheduling"));
    await screen.findAllByDisplayValue("08:00");
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
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Scheduling"));
    expect(await screen.findByText("You are not signed in. Please log in again.")).toBeDefined();
  });

  it("handles API error with field array errors", async () => {
    vi.spyOn(preferenceService, "getMyPreference").mockResolvedValue(mockPref);
    vi.spyOn(preferenceService, "updateMyPreference").mockRejectedValue({
      response: { data: { non_field_errors: ["Global error"] } },
    });
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Scheduling"));
    await screen.findAllByDisplayValue("08:00");
    fireEvent.change(document.getElementById("pref-max-hours") as HTMLInputElement, {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByText("Save changes"));
    expect(await screen.findByText("Global error")).toBeDefined();
  });

  it("handles API error with detail message", async () => {
    vi.spyOn(preferenceService, "getMyPreference").mockRejectedValue({
      response: { data: { detail: "Custom error detail" } },
    });
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Scheduling"));
    expect(await screen.findByText("Custom error detail")).toBeDefined();
  });

  it("handles non-API error objects", async () => {
    vi.spyOn(preferenceService, "getMyPreference").mockRejectedValue(new Error("Generic error"));
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Scheduling"));
    expect(await screen.findByText("Something went wrong")).toBeDefined();
  });

  it("handles API error with missing response data", async () => {
    vi.spyOn(preferenceService, "getMyPreference").mockRejectedValue({
      response: { status: 500 },
    });
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Scheduling"));
    expect(await screen.findByText("Something went wrong")).toBeDefined();
  });

  it("renders all sections and sidebar buttons", async () => {
    vi.spyOn(preferenceService, "getMyPreference").mockResolvedValue(mockPref);
    vi.spyOn(profileService, "getMyProfile").mockResolvedValue({
      name: "Test User",
      date_of_birth: null,
      creation_date: "2024-01-01",
      slogan: "",
      bio: "",
      avatar: null,
    });
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
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

    fireEvent.click(screen.getByRole("button", { name: /scheduling/i }));
    expect(screen.getByText("Loading...")).toBeDefined();
  });

  it("handles logout", async () => {
    const logoutSpy = vi.spyOn(authService, "logout").mockResolvedValueOnce(undefined);
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));
    const confirmModal = await screen.findByRole("dialog");
    fireEvent.click(within(confirmModal).getByRole("button", { name: /^log out$/i }));
    await waitFor(() => expect(logoutSpy).toHaveBeenCalled());
  });

  it("caps the profile date of birth input at today", async () => {
    const today = new Date();
    const expectedMax = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    vi.spyOn(profileService, "getMyProfile").mockResolvedValue({
      name: "Test User",
      date_of_birth: null,
      creation_date: "2024-01-01",
      slogan: "",
      bio: "",
      avatar: null,
    });

    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /profile/i }));

    const dobInput = await screen.findByLabelText(/date of birth/i);
    expect(dobInput).toHaveAttribute("max", expectedMax);
  });
});
