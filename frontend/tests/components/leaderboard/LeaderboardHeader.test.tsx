import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LeaderboardHeader from "@/components/leaderboard/LeaderboardHeader";

describe("LeaderboardHeader", () => {
  it("renders the leaderboard title", () => {
    render(<LeaderboardHeader />);

    expect(screen.getByRole("heading", { name: "Leaderboard" })).toBeDefined();
  });
});
