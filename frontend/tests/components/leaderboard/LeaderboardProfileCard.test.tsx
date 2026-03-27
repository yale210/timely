import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LeaderboardProfileCard from "@/components/leaderboard/LeaderboardProfileCard";
import type { Profile } from "@/types";
import { buildProfileStats } from "@/utils/leaderboardUtils";

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

describe("LeaderboardProfileCard", () => {
  it("shows an empty-state message when profile data is unavailable", () => {
    render(<LeaderboardProfileCard profile={null} profileStats={null} />);

    expect(screen.getByText("No profile data available.")).toBeDefined();
  });

  it("renders the current user's derived leaderboard stats", () => {
    const profile = buildProfile();
    const profileStats = buildProfileStats(profile, [profile]);

    render(
      <LeaderboardProfileCard profile={profile} profileStats={profileStats} />,
    );

    expect(screen.getByText("Alice Example")).toBeDefined();
    expect(screen.getByText("AE")).toBeDefined();
    expect(screen.getByText("\"Keep going\"")).toBeDefined();
    expect(screen.getByText("Joined")).toBeDefined();
    expect(screen.getByText("#1")).toBeDefined();
    expect(screen.getByText("23%")).toBeDefined();
    expect(screen.getByText("120 / 520 XP toward Level 3")).toBeDefined();
  });
});
