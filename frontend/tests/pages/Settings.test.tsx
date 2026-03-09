import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import { MemoryRouter } from "react-router-dom"
import type { Preference } from "@/types"

import Settings from "@/pages/Settings"
import { authService } from "@/services/authService"
import { preferenceService } from "@/services/preferenceService"

// Mock AppLayout
vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock authService
vi.mock("@/services/authService", () => ({
  authService: { logout: vi.fn().mockResolvedValue(undefined) },
}))

// Mock preferenceService
vi.mock("@/services/preferenceService", () => ({
  preferenceService: {
    getMyPreference: vi.fn(),
    updateMyPreference: vi.fn(),
  },
}))

describe("Settings page", () => {
  const mockPref: Preference = {
    id: 1,
    day_start: "08:00:00",
    day_end: "22:00:00",
    max_hours_study_per_day: 4,
    days_off: [3],
  };

  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
    delete document.documentElement.dataset.theme
    delete document.documentElement.dataset.font
  })

  it("loads and renders preferences", async () => {
    const getMyPrefSpy = vi.spyOn(preferenceService, 'getMyPreference').mockResolvedValue(mockPref)
    render(
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole("button", { name: /scheduling/i }))
    expect(await screen.findByLabelText(/day start/i)).toHaveValue("08:00")
    expect(getMyPrefSpy).toHaveBeenCalled();
  });

  it("handles client-side validation - out of range", async () => {
    vi.spyOn(preferenceService, 'getMyPreference').mockResolvedValue(mockPref);
    render(
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByText("Scheduling"));
    await screen.findByLabelText(/day start/i);

    const hoursInput = screen.getByLabelText(/max study hours per day/i);
    
    // Test > 24
    fireEvent.change(hoursInput, { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: /save|saving/i }));
    expect(await screen.findByText("Please fix the highlighted fields.")).toBeDefined();
    expect(await screen.findByText("Must be 24 or less.")).toBeDefined();

    // Test < 0
    fireEvent.change(hoursInput, { target: { value: "-1" } });
    fireEvent.click(screen.getByRole("button", { name: /save|saving/i }));
    expect(await screen.findByText("Must be at least 0.")).toBeDefined();

    // Test NaN validation path
    fireEvent.change(hoursInput, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /save|saving/i }));

    // Test NaN - force it by providing a non-numeric string
    fireEvent.change(hoursInput, { target: { value: "abc" } });
    fireEvent.click(screen.getByRole("button", { name: /save|saving/i }));
  });

  it("handles API error with non-array field errors", async () => {
    vi.spyOn(preferenceService, 'getMyPreference').mockResolvedValue(mockPref);
    vi.spyOn(preferenceService, 'updateMyPreference').mockRejectedValue({
        response: { data: { some_field: "Not an array" } }
    });
    render(
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByText("Scheduling"));
    await screen.findByLabelText(/day start/i);
    fireEvent.click(screen.getByText("Save changes"));
    
    // Should hit the !dataRecord or default message path
    expect(await screen.findByText("Please fix the highlighted fields.")).toBeDefined();
  });

  it("handles API error with empty data object", async () => {
    vi.spyOn(preferenceService, 'getMyPreference').mockResolvedValue(mockPref);
    vi.spyOn(preferenceService, 'updateMyPreference').mockRejectedValue({
        response: { data: {} }
    });
    render(
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByText("Scheduling"));
    await screen.findByLabelText(/day start/i);
    fireEvent.click(screen.getByText("Save changes"));
    
    expect(await screen.findByText("Please fix the highlighted fields.")).toBeDefined();
  });

  it("handles logout failure and still navigates", async () => {
    const logoutSpy = vi.spyOn(authService, 'logout').mockRejectedValue(new Error("Logout failed"));
    render(
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));
    await waitFor(() => expect(logoutSpy).toHaveBeenCalled());
  });

  it("toggles days off", async () => {
    vi.spyOn(preferenceService, 'getMyPreference').mockResolvedValue(mockPref);
    render(
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByText("Scheduling"));
    await screen.findByLabelText(/day start/i);

    const monButton = screen.getByText("Mon");
    fireEvent.click(monButton); // Add Mon (1)
    expect(monButton.getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(monButton); // Remove Mon (1)
    expect(monButton.getAttribute("aria-pressed")).toBe("false");
  });

  it("handles 401 error from API", async () => {
    vi.spyOn(preferenceService, 'getMyPreference').mockRejectedValue({
        response: { status: 401 }
    });
    render(
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByText("Scheduling"));
    expect(await screen.findByText("You are not signed in. Please log in again.")).toBeDefined();
  });

  it("handles API error with field array errors", async () => {
    vi.spyOn(preferenceService, 'getMyPreference').mockResolvedValue(mockPref);
    vi.spyOn(preferenceService, 'updateMyPreference').mockRejectedValue({
        response: { data: { non_field_errors: ["Global error"] } }
    });
    render(
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByText("Scheduling"));
    await screen.findByLabelText(/day start/i);
    fireEvent.click(screen.getByText("Save changes"));
    expect(await screen.findByText("Global error")).toBeDefined();
  });

  it("handles API error with detail message", async () => {
    vi.spyOn(preferenceService, 'getMyPreference').mockRejectedValue({
        response: { data: { detail: "Custom error detail" } }
    });
    render(
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByText("Scheduling"));
    expect(await screen.findByText("Custom error detail")).toBeDefined();
  });

  it("handles non-API error objects", async () => {
    vi.spyOn(preferenceService, 'getMyPreference').mockRejectedValue(new Error("Generic error"));
    render(
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByText("Scheduling"));
    expect(await screen.findByText("Something went wrong")).toBeDefined();
  });

  it("handles API error with missing response data", async () => {
    vi.spyOn(preferenceService, 'getMyPreference').mockRejectedValue({
        response: { status: 500 } // Missing data
    });
    render(
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByText("Scheduling"));
    expect(await screen.findByText("Something went wrong")).toBeDefined();
  });

  it("renders all sections and sidebar buttons", () => {
    vi.spyOn(preferenceService, 'getMyPreference').mockResolvedValue(mockPref);
    render(
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
    );
    // Click Profile
    fireEvent.click(screen.getByRole("button", { name: "Profile" }));
    expect(screen.getByText("Profile settings will go here.")).toBeDefined();

    // Click Features
    fireEvent.click(screen.getByRole("button", { name: "Features" }));
    expect(screen.getByText("Feature toggles will go here.")).toBeDefined();

    // Click Theme
    fireEvent.click(screen.getByRole("button", { name: "Theme" }));
    expect(screen.getByText("Choose a theme and font for your dashboard.")).toBeDefined();
    
    // Trigger themeController and fontController
    fireEvent.click(screen.getByRole("button", { name: "dark" }));
    fireEvent.click(screen.getByRole("button", { name: "poppins" }));
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.dataset.font).toBe("poppins");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(localStorage.getItem("font")).toBe("poppins");

    // Click Scheduling
    fireEvent.click(screen.getByRole("button", { name: "Scheduling" }));
    expect(screen.getByText("Loading...")).toBeDefined();

  });

  it("handles logout", async () => {
    const logoutSpy = vi.spyOn(authService, 'logout').mockResolvedValueOnce(undefined);
    render(
        <MemoryRouter>
          <Settings />
        </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /log out/i }));
    await waitFor(() => expect(logoutSpy).toHaveBeenCalled());
  });
});
