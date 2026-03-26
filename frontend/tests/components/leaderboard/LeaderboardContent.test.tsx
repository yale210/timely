import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LeaderboardContent from "@/components/leaderboard/LeaderboardContent";
import type { Profile } from "@/types";
import { buildProfileStats } from "@/utils/leaderboardUtils";

const buildProfile = (overrides: Partial<Profile> = {}): Profile => ({
  name: "Alice Example",
  date_of_birth: null,
  creation_date: "2024-01-01T00:00:00Z",
  slogan: "Keep going",
  bio: "Focus first.",
  avatar: null,
  xp: 120,
  level: 2,
  ...overrides,
});

describe("LeaderboardContent", () => {
  it("renders the loading state", () => {
    render(
      <LeaderboardContent
        error={null}
        isLoading
        leaderboard={[]}
        profile={null}
        profileStats={null}
      />,
    );

    expect(screen.getByText("Loading leaderboard...")).toBeDefined();
    expect(screen.queryByText("Full standings")).toBeNull();
  });

  it("renders the error state", () => {
    render(
      <LeaderboardContent
        error="Failed to load leaderboard"
        isLoading={false}
        leaderboard={[]}
        profile={null}
        profileStats={null}
      />,
    );

    expect(screen.getByText("Failed to load leaderboard")).toBeDefined();
    expect(screen.queryByText("Full standings")).toBeNull();
  });

  it("renders the loaded profile summary and standings", () => {
    const profile = buildProfile();
    const leaderboard = [profile];
    const profileStats = buildProfileStats(profile, leaderboard);

    render(
      <LeaderboardContent
        error={null}
        isLoading={false}
        leaderboard={leaderboard}
        profile={profile}
        profileStats={profileStats}
      />,
    );

    expect(screen.getByText("My Progress")).toBeDefined();
    expect(screen.getAllByText("Alice Example")).toHaveLength(2);
    expect(screen.getByText("Full standings")).toBeDefined();
    expect(screen.getByText("1 ranked friends")).toBeDefined();
  });
});
