import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DashboardXpProgressCard from "@/components/dashboard/DashboardXpProgressCard";

describe("DashboardXpProgressCard", () => {
  it("renders the loading state when profile stats are unavailable", () => {
    render(<DashboardXpProgressCard profileStats={null} />);

    expect(screen.getByText("Experience")).toBeInTheDocument();
    expect(screen.getByText("Loading XP...")).toBeInTheDocument();
  });

  it("renders the current level and xp progress", () => {
    render(<DashboardXpProgressCard profileStats={{ exp: 150, level: 2 }} />);

    expect(screen.getByText("Level 2")).toBeInTheDocument();
    expect(screen.getByText("150 / 520 XP to next level")).toBeInTheDocument();
  });
});
