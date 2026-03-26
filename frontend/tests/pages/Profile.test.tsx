import type { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProfilePage from "@/pages/Profile";
import { usePublicProfile } from "@/hooks/profiles/usePublicProfile";
import type { PublicProfile, User } from "@/types";

const { mockGetUser } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
}));

vi.mock("@/layouts/AppLayout", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/hooks/profiles/usePublicProfile", () => ({
  usePublicProfile: vi.fn(),
}));

vi.mock("@/services/authService", () => ({
  authStore: {
    getUser: mockGetUser,
  },
}));

describe("Profile page", () => {
  const buildPublicProfile = (overrides: Partial<PublicProfile> = {}): PublicProfile => ({
    username: "alice",
    name: "Alice Example",
    avatar_url: null,
    joined_at: "2024-01-01T00:00:00Z",
    bio: "Hello there",
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = (path = "/profiles/alice") =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/profiles/:username" element={<ProfilePage />} />
        </Routes>
      </MemoryRouter>,
    );

  it("shows edit profile controls for the signed-in user", () => {
    const currentUser: User = { username: "alice", email: "alice@example.com" };
    mockGetUser.mockReturnValue(currentUser);
    vi.mocked(usePublicProfile).mockReturnValue({
      profile: buildPublicProfile(),
      loading: false,
      error: null,
    });

    renderPage();

    expect(screen.getByText("@alice")).toBeDefined();
    expect(screen.getByRole("link", { name: "Edit profile" })).toHaveAttribute("href", "/settings");
  });

  it("shows the back link for another user's profile", () => {
    const currentUser: User = { username: "alice", email: "alice@example.com" };
    mockGetUser.mockReturnValue(currentUser);
    vi.mocked(usePublicProfile).mockReturnValue({
      profile: buildPublicProfile({
        username: "bob",
        name: "Bob Example",
        bio: "",
      }),
      loading: false,
      error: null,
    });

    renderPage("/profiles/bob");

    expect(screen.getByRole("link", { name: "Back to friends" })).toHaveAttribute("href", "/friends");
    expect(screen.getByText("This user has not added a bio yet.")).toBeDefined();
  });
});
