import { describe, expect, it } from "vitest";
import {
  buildProfileStats,
  getNameClassName,
  getPlacementAccent,
  getProfileProgressStyle,
  getProgressMetrics,
  getRankValueClassName,
} from "@/utils/leaderboardUtils";
import type { Profile } from "@/types";

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

describe("leaderboardUtils", () => {
  it("calculates clamped XP progress metrics", () => {
    const metrics = getProgressMetrics(buildProfile({ xp: 600, level: 2 }));

    expect(metrics).toEqual({
      level: 2,
      progress: 100,
      requiredExp: 520,
      xp: 600,
      xpRemaining: 0,
    });
  });

  it("builds derived leaderboard summary stats", () => {
    const profile = buildProfile();
    const leaderboard = [buildProfile({ name: "Bob Example" }), profile];
    const expectedJoinedDate = new Date(profile.creation_date).toLocaleDateString(
      [],
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    );

    expect(buildProfileStats(profile, leaderboard)).toEqual({
      avatarFallback: "AE",
      joinedDate: expectedJoinedDate,
      level: 2,
      progress: 23.076923076923077,
      rank: "#2",
      requiredExp: 520,
      slogan: "Keep going",
      xp: 120,
      xpRemaining: 400,
    });
  });

  it("returns the inline XP progress style", () => {
    expect(getProfileProgressStyle(45)).toEqual({
      "--xp-progress": "45%",
    });
  });

  it("maps placements and rank labels to the correct accent classes", () => {
    expect(getPlacementAccent(0)).toEqual({
      iconClassName: "text-amber-500",
      rankClassName: "text-amber-600",
      ringClassName: "ring-amber-200",
    });
    expect(getPlacementAccent(4)).toEqual({
      iconClassName: "text-transparent",
      rankClassName: "text-gray-300",
      ringClassName: "ring-gray-200",
    });
    expect(getRankValueClassName("#2")).toBe("text-slate-400");
    expect(getRankValueClassName("Unranked")).toBe(
      "text-[color:var(--text-color)]",
    );
  });

  it("chooses responsive name classes based on length", () => {
    expect(getNameClassName("Alice")).toBe("text-xl sm:text-[1.55rem]");
    expect(getNameClassName("A fairly long display")).toBe("text-lg sm:text-xl");
    expect(getNameClassName("A very very long leaderboard display name")).toBe(
      "text-base sm:text-lg",
    );
  });
});
