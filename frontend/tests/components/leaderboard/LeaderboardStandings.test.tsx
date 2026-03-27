import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LeaderboardStandings from "@/components/leaderboard/LeaderboardStandings";
import type { Profile } from "@/types";

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

describe("LeaderboardStandings", () => {
  it("renders the empty state when no entries are available", () => {
    render(<LeaderboardStandings leaderboard={[]} />);

    expect(screen.getByText("Full standings")).toBeDefined();
    expect(screen.getByText("0 ranked friends")).toBeDefined();
    expect(screen.getByText("No friends yet.")).toBeDefined();
  });

  it("renders each ranked friend", () => {
    render(
      <LeaderboardStandings
        leaderboard={[
          buildProfile(),
          buildProfile({ name: "Bob Example", xp: 90, level: 1 }),
        ]}
      />,
    );

    expect(screen.getByText("2 ranked friends")).toBeDefined();
    expect(screen.getByText("Alice Example")).toBeDefined();
    expect(screen.getByText("Bob Example")).toBeDefined();
    expect(screen.queryByText("No friends yet.")).toBeNull();
  });
});
