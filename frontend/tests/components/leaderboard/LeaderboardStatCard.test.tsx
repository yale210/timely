import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LeaderboardStatCard from "@/components/leaderboard/LeaderboardStatCard";

describe("LeaderboardStatCard", () => {
  it("renders generic stat values", () => {
    render(<LeaderboardStatCard label="Joined" value="Jan 1, 2024" />);

    expect(screen.getByText("Joined")).toBeDefined();
    expect(screen.getByText("Jan 1, 2024")).toBeDefined();
  });

  it("highlights top-ranked friend cards", () => {
    render(<LeaderboardStatCard label="Friends Rank" value="#1" />);

    const rankValue = screen.getByText("#1");
    expect(rankValue.className).toContain("text-amber-500");
  });
});
