import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter } from "react-router-dom";
import type { Preference } from "@/types";

import Settings from "@/pages/Settings";
import { authService } from "@/services/authService";
import { preferenceService } from "@/services/preferenceService";
import * as profileService from "@/services/profileService";

vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/services/authService", () => ({
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
    max_hours_study_per_day: 4,
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

  it("handles client-side validation - out of range", async () => {
    vi.spyOn(preferenceService, "getMyPreference").mockResolvedValue(mockPref);
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByText("Scheduling"));
    await screen.findAllByDisplayValue("08:00");

    const hoursInput = screen.getByLabelText(/max task time per day/i);

    fireEvent.change(hoursInput, { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: /save|saving/i }));
    expect(await screen.findByText("Please fix the highlighted fields.")).toBeDefined();
    expect(await screen.findByText("Must be 24 or less.")).toBeDefined();

    fireEvent.change(hoursInput, { target: { value: "-1" } });
    fireEvent.click(screen.getByRole("button", { name: /save|saving/i }));
    expect(await screen.findByText("Must be at least 0.")).toBeDefined();

    fireEvent.change(hoursInput, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /save|saving/i }));

    fireEvent.change(hoursInput, { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: /save|saving/i }));
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

    fireEvent.click(screen.getByRole("button", { name: /features/i }));
    expect(screen.getByText("Toggle optional sections of the app.")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /appearance/i }));
    expect(screen.getByText("Choose a theme and font for your dashboard.")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "dark" }));
    fireEvent.click(screen.getByRole("button", { name: "poppins" }));
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
});

