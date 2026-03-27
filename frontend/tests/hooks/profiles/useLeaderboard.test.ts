import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useLeaderboard } from "@/hooks/profiles/useLeaderboard";
import type { Profile } from "@/types";

const { mockApiGet, mockGetMyProfile } = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockGetMyProfile: vi.fn(),
}));

vi.mock("@/services/api", () => ({
  default: {
    get: mockApiGet,
  },
}));

vi.mock("@/services/profileService", () => ({
  getMyProfile: mockGetMyProfile,
}));

const buildProfile = (overrides: Partial<Profile> = {}): Profile => ({
  name: "Alice Example",
  date_of_birth: null,
  creation_date: "2024-01-01T00:00:00Z",
  slogan: " Keep going ",
  bio: "Focus first.",
  avatar: null,
  xp: 120,
  level: 2,
  ...overrides,
});

describe("useLeaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads leaderboard data and derives profile summary state", async () => {
    const profile = buildProfile();
    mockGetMyProfile.mockResolvedValue(profile);
    mockApiGet.mockResolvedValue({
      data: [profile, buildProfile({ name: "Bob Example", xp: 90, level: 1 })],
    });

    const { result } = renderHook(() => useLeaderboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.profile?.name).toBe("Alice Example");
    expect(result.current.leaderboard).toHaveLength(2);
    expect(result.current.profileStats?.rank).toBe("#1");
    expect(result.current.profileStats?.avatarFallback).toBe("AE");
    expect(result.current.profileProgressStyle).toEqual({
      "--xp-progress": "23.076923076923077%",
    });
    expect(mockApiGet).toHaveBeenCalledWith("/api/profiles/leaderboard/");
  });

  it("surfaces load failures as an error state", async () => {
    mockGetMyProfile.mockRejectedValueOnce(
      new Error("Failed to load leaderboard"),
    );
    mockApiGet.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useLeaderboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to load leaderboard");
    expect(result.current.profile).toBeNull();
    expect(result.current.profileStats).toBeNull();
  });
});
