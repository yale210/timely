import { describe, expectTypeOf, it } from "vitest";
import type { Profile, PublicProfile } from "@/types/profile";

describe("profile types", () => {
  it("defines the authenticated profile shape", () => {
    const profile = {
      name: "Test User",
      date_of_birth: "2001-01-01",
      creation_date: "2026-03-01T12:00:00Z",
      slogan: "Plan better",
      bio: "A short bio",
      avatar: null,
      xp: 120,
      level: 3,
    } satisfies Profile;

    expectTypeOf(profile).toMatchTypeOf<Profile>();
  });

  it("defines the public profile shape", () => {
    const publicProfile = {
      username: "testuser",
      name: "Test User",
      bio: "Visible bio",
      avatar_url: null,
      joined_at: "2026-03-01T12:00:00Z",
    } satisfies PublicProfile;

    expectTypeOf(publicProfile).toMatchTypeOf<PublicProfile>();
  });
});
