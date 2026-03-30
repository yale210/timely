import { describe, expectTypeOf, it } from "vitest";
import type {
  LeaderboardProfileAvatarProps,
  LeaderboardProfileCardProps,
  LeaderboardProfileIdentityProps,
  LeaderboardProfileProgressProps,
  LeaderboardProfileTextProps,
} from "@/types/leaderboard";

describe("leaderboard types", () => {
  it("defines leaderboard profile card props", () => {
    const props = {
      profile: {
        name: "Test User",
        date_of_birth: null,
        creation_date: "2026-03-01T12:00:00Z",
        slogan: "Keep going",
        bio: "Bio",
        avatar: null,
        xp: 120,
        level: 3,
      },
      profileStats: {
        avatarFallback: "TU",
        joinedDate: "Mar 1, 2026",
        xp: 120,
        level: 3,
        progress: 45,
        rank: "#1",
        requiredExp: 200,
        slogan: "Keep going",
        xpRemaining: 80,
      },
    } satisfies LeaderboardProfileCardProps;

    expectTypeOf(props).toMatchTypeOf<LeaderboardProfileCardProps>();
  });

  it("defines the leaderboard child prop shapes", () => {
    const avatarProps = {
      avatar: null,
      avatarFallback: "TU",
      name: "Test User",
    } satisfies LeaderboardProfileAvatarProps;

    const textProps = {
      bio: "Bio",
      name: "Test User",
      slogan: "Keep going",
    } satisfies LeaderboardProfileTextProps;

    const identityProps = {
      profile: {
        name: "Test User",
        date_of_birth: null,
        creation_date: "2026-03-01T12:00:00Z",
        slogan: "Keep going",
        bio: "Bio",
        avatar: null,
      },
      avatarFallback: "TU",
      slogan: "Keep going",
    } satisfies LeaderboardProfileIdentityProps;

    const progressProps = {
      level: 3,
      progress: 45,
      requiredExp: 200,
      xp: 120,
    } satisfies LeaderboardProfileProgressProps;

    expectTypeOf(avatarProps).toMatchTypeOf<LeaderboardProfileAvatarProps>();
    expectTypeOf(textProps).toMatchTypeOf<LeaderboardProfileTextProps>();
    expectTypeOf(identityProps).toMatchTypeOf<LeaderboardProfileIdentityProps>();
    expectTypeOf(progressProps).toMatchTypeOf<LeaderboardProfileProgressProps>();
  });
});
