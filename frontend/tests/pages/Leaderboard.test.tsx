import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Leaderboard from "@/pages/Leaderboard";
import api from "@/services/api";
import { getMyProfile } from "@/services/profileService";

vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/services/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("@/services/profileService", () => ({
  getMyProfile: vi.fn(),
}));

describe("Leaderboard page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and renders leaderboard data", async () => {
    vi.mocked(getMyProfile).mockResolvedValue({
      name: "Alice Example",
      bio: "Focus first.",
      slogan: "Keep going",
      creation_date: "2024-01-01T00:00:00Z",
      avatar: null,
      xp: 120,
      level: 2,
    } as any);
    vi.mocked(api.get).mockResolvedValue({
      data: [
        { name: "Alice Example", xp: 120, level: 2 },
        { name: "Bob Example", xp: 90, level: 1 },
      ],
    });

    render(<Leaderboard />);

    expect(screen.getByText("Loading leaderboard...")).toBeDefined();
    expect(await screen.findByText("2 ranked friends")).toBeDefined();
    expect(screen.getAllByText("Alice Example")).toHaveLength(2);
    expect(screen.getByText("Full standings")).toBeDefined();
    expect(api.get).toHaveBeenCalledWith("/api/profiles/leaderboard/");
  });

  it("shows an error message when loading fails", async () => {
    vi.mocked(getMyProfile).mockRejectedValue(new Error("Failed to load leaderboard"));
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    render(<Leaderboard />);

    expect(await screen.findByText("Failed to load leaderboard")).toBeDefined();
  });
});
