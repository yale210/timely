import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LeaderboardEntry from "@/components/leaderboard/LeaderboardEntry";
import type { Profile } from "@/types";

const buildProfile = (overrides: Partial<Profile> = {}): Profile => ({
  name: "Alice Example",
  date_of_birth: null,
  creation_date: "2024-01-01T00:00:00Z",
  slogan: "Keep going",
  bio: "Focus first.",
  avatar: null,
  xp: 90,
  level: 1,
  ...overrides,
});

describe("LeaderboardEntry", () => {
  it("renders placement, profile name, and XP progress", () => {
    render(
      <ul>
        <LeaderboardEntry entry={buildProfile()} index={0} />
      </ul>,
    );

    expect(screen.getByText("#1")).toBeDefined();
    expect(screen.getByText("Alice Example")).toBeDefined();
    expect(screen.getByText("Level 1")).toBeDefined();
    expect(screen.getByText("32%")).toBeDefined();
    expect(screen.getByText("90 / 283 XP")).toBeDefined();
  });
});
