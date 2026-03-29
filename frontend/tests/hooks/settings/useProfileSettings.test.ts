import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProfileSettings } from "@/hooks/settings/useProfileSettings";
import type { Profile } from "@/types";
import * as profileService from "@/services/profileService";

vi.mock("@/services/profileService", () => ({
  getMyProfile: vi.fn(),
  updateMyProfile: vi.fn(),
}));

vi.mock("@/utils/apiErrors", () => ({
  formatDjangoFormError: vi.fn((error) => ({ message: error.message, fieldErrors: {} })),
}));

describe("useProfileSettings", () => {
  const mockProfile: Profile = {
    name: "Test User",
    date_of_birth: null,
    creation_date: "2024-01-01",
    slogan: "",
    bio: "Original bio",
    avatar: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(profileService.getMyProfile).mockResolvedValue(mockProfile);
    vi.mocked(profileService.updateMyProfile).mockResolvedValue(mockProfile);
  });

  it("loads the profile when active", async () => {
    const { result } = renderHook(() => useProfileSettings(true));

    await waitFor(() => expect(profileService.getMyProfile).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.state.profile).toEqual(mockProfile));
    expect(result.current.state.loading).toBe(false);
    expect(result.current.state.isDirty).toBe(false);
  });

  it("does not load automatically when inactive", () => {
    renderHook(() => useProfileSettings(false));

    expect(profileService.getMyProfile).not.toHaveBeenCalled();
  });

  it("tracks dirty state and saves profile changes", async () => {
    const updatedProfile = { ...mockProfile, bio: "Updated bio" };
    vi.mocked(profileService.updateMyProfile).mockResolvedValue(updatedProfile);
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    const { result } = renderHook(() => useProfileSettings(true));

    await waitFor(() => expect(result.current.state.profile).toEqual(mockProfile));

    act(() => {
      result.current.actions.setProfile(updatedProfile);
    });
    expect(result.current.state.isDirty).toBe(true);

    act(() => {
      result.current.actions.setAvatarFile(file);
    });
    expect(result.current.state.avatarFile).toBe(file);
    expect(result.current.state.isDirty).toBe(true);

    await act(async () => {
      await result.current.actions.saveProfile();
    });

    expect(profileService.updateMyProfile).toHaveBeenCalledWith(updatedProfile, file);
    expect(result.current.state.profile).toEqual(updatedProfile);
    expect(result.current.state.avatarFile).toBeNull();
    expect(result.current.state.isDirty).toBe(false);
  });

  it("surfaces save errors", async () => {
    vi.mocked(profileService.updateMyProfile).mockRejectedValue(new Error("Save failed"));
    const { result } = renderHook(() => useProfileSettings(true));

    await waitFor(() => expect(result.current.state.profile).toEqual(mockProfile));

    act(() => {
      result.current.actions.setProfile({ ...mockProfile, bio: "Broken save" });
    });

    await act(async () => {
      await result.current.actions.saveProfile();
    });

    expect(result.current.state.error).toBe("Save failed");
    expect(result.current.state.saving).toBe(false);
  });

  it("ignores stale profile fetches after deactivation and re-entry", async () => {
    const firstProfile = { ...mockProfile, bio: "First load" };
    const secondProfile = { ...mockProfile, bio: "Second load" };
    const unsavedProfile = { ...secondProfile, bio: "Unsaved edit" };
    let resolveFirstLoad: ((profile: Profile) => void) | undefined;
    let resolveSecondLoad: ((profile: Profile) => void) | undefined;

    vi.mocked(profileService.getMyProfile)
      .mockImplementationOnce(
        () =>
          new Promise<Profile>((resolve) => {
            resolveFirstLoad = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<Profile>((resolve) => {
            resolveSecondLoad = resolve;
          }),
      );

    const { result, rerender } = renderHook(
      ({ isActive }) => useProfileSettings(isActive),
      { initialProps: { isActive: true } },
    );

    await waitFor(() => expect(profileService.getMyProfile).toHaveBeenCalledTimes(1));

    rerender({ isActive: false });
    rerender({ isActive: true });

    await waitFor(() => expect(profileService.getMyProfile).toHaveBeenCalledTimes(2));

    await act(async () => {
      resolveSecondLoad?.(secondProfile);
      await Promise.resolve();
    });

    await waitFor(() => expect(result.current.state.profile).toEqual(secondProfile));
    await waitFor(() => expect(result.current.state.savedProfile).toEqual(secondProfile));

    act(() => {
      result.current.actions.setProfile(unsavedProfile);
    });

    expect(result.current.state.profile).toEqual(unsavedProfile);
    expect(result.current.state.isDirty).toBe(true);

    await act(async () => {
      resolveFirstLoad?.(firstProfile);
      await Promise.resolve();
    });

    expect(result.current.state.profile).toEqual(unsavedProfile);
    expect(result.current.state.savedProfile).toEqual(secondProfile);
    expect(result.current.state.isDirty).toBe(true);
  });
});
