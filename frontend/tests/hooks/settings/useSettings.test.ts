import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSettings } from "@/hooks/settings/useSettings";
import type { Preference } from "@/types";

const {
  mockNavigate,
  mockedLogout,
  mockedDeleteAccount,
  mockedGetMyPreference,
  mockedUpdateMyPreference,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockedLogout: vi.fn(),
  mockedDeleteAccount: vi.fn(),
  mockedGetMyPreference: vi.fn(),
  mockedUpdateMyPreference: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/services/authService", () => ({
  authService: {
    logout: mockedLogout,
    deleteAccount: mockedDeleteAccount,
  },
}));

vi.mock("@/services/preferenceService", () => ({
  preferenceService: {
    getMyPreference: mockedGetMyPreference,
    updateMyPreference: mockedUpdateMyPreference,
  },
}));

describe("useSettings", () => {
  const mockPreference: Preference = {
    id: 1,
    day_start: "08:00:00",
    day_end: "22:00:00",
    timezone: "Europe/London",
    max_hours_study_per_day: 4,
    max_days_ahead: 7,
    drag_snap_minutes: 15,
    days_off: [3],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetMyPreference.mockResolvedValue(mockPreference);
    mockedUpdateMyPreference.mockResolvedValue(mockPreference);
    mockedLogout.mockResolvedValue(undefined);
    mockedDeleteAccount.mockResolvedValue("Account deleted");
  });

  it("loads preferences when the scheduling section is selected", async () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.actions.selectSection("preferences");
    });

    await waitFor(() => expect(mockedGetMyPreference).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.state.preference).toEqual(mockPreference));

    expect(result.current.state.activeSection).toBe("preferences");
    expect(result.current.loading.preference).toBe(false);
  });

  it("blocks section switching while a save is in progress", async () => {
    let resolveSave: ((value: Preference) => void) | undefined;
    mockedUpdateMyPreference.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSave = resolve;
        }),
    );

    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.actions.selectSection("preferences");
    });

    await waitFor(() => expect(result.current.state.preference).toEqual(mockPreference));

    const savingPromise = act(async () => {
      await result.current.actions.savePreferences();
    });

    act(() => {
      result.current.actions.selectSection("themes");
    });

    expect(result.current.state.activeSection).toBe("preferences");

    act(() => {
      resolveSave?.(mockPreference);
    });

    await savingPromise;
    await waitFor(() => expect(result.current.loading.saving).toBe(false));
  });

  it("runs validation before saving preferences", async () => {
    const { result } = renderHook(() => useSettings());

    act(() => {
      result.current.actions.selectSection("preferences");
    });

    await waitFor(() => expect(result.current.state.preference).toEqual(mockPreference));

    act(() => {
      result.current.actions.setPreference({
        ...mockPreference,
        max_hours_study_per_day: 30,
      });
    });

    await act(async () => {
      await result.current.actions.savePreferences();
    });

    expect(mockedUpdateMyPreference).not.toHaveBeenCalled();
    expect(result.current.error.preference).toBe("Please fix the highlighted fields.");
    expect(result.current.state.fieldErrors.max_hours_study_per_day).toEqual(["Must be 24 or less."]);
  });

  it("navigates to login even if logout fails", async () => {
    mockedLogout.mockRejectedValue(new Error("logout failed"));

    const { result } = renderHook(() => useSettings());

    await act(async () => {
      await result.current.actions.logout();
    });

    expect(mockedLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });

  it("deletes the account and logs out", async () => {
    const { result } = renderHook(() => useSettings());

    await act(async () => {
      await result.current.actions.deleteAccount("secret");
    });

    expect(mockedDeleteAccount).toHaveBeenCalledWith("secret");
    expect(mockedLogout).toHaveBeenCalledTimes(1);
    expect(result.current.loading.deleting).toBe(false);
  });
});
