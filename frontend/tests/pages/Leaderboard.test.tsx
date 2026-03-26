import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Leaderboard from "@/pages/Leaderboard";
import type { Profile } from "@/types";

const { mockApiGet, mockGetMyProfile } = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockGetMyProfile: vi.fn(),
}));

vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/services/api", () => ({
  default: {
    get: mockApiGet,
  },
}));

vi.mock("@/services/profileService", () => ({
  getMyProfile: mockGetMyProfile,
}));

describe("Leaderboard page", () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and renders leaderboard data", async () => {
    mockGetMyProfile.mockResolvedValue(buildProfile());
    mockApiGet.mockResolvedValue({
      data: [
        buildProfile(),
        buildProfile({ name: "Bob Example", xp: 90, level: 1 }),
      ],
    });

    render(<Leaderboard />);

    expect(screen.getByText("Loading leaderboard...")).toBeDefined();
    expect(await screen.findByText("2 ranked friends")).toBeDefined();
    expect(screen.getAllByText("Alice Example")).toHaveLength(2);
    expect(screen.getByText("Full standings")).toBeDefined();
    expect(mockApiGet).toHaveBeenCalledWith("/api/profiles/leaderboard/");
  });

  it("shows an error message when loading fails", async () => {
    mockGetMyProfile.mockRejectedValue(new Error("Failed to load leaderboard"));
    mockApiGet.mockResolvedValue({ data: [] });

    render(<Leaderboard />);

    expect(await screen.findByText("Failed to load leaderboard")).toBeDefined();
  });

  it("shows the fallback bio text when the profile bio is blank", async () => {
    mockGetMyProfile.mockResolvedValue(buildProfile({ bio: "   " }));
    mockApiGet.mockResolvedValue({ data: [buildProfile({ bio: "   " })] });

    render(<Leaderboard />);

    expect(
      await screen.findByText(
        "Add a bio to make your profile card feel more personal.",
      ),
    ).toBeDefined();
  });
});
