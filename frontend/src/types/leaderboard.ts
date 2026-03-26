import type { LeaderboardProfileStats } from "@/utils/leaderboardUtils";
import type { Profile } from "./profile";

/**
 * Props for the leaderboard profile summary card.
 */
export interface LeaderboardProfileCardProps {
  profile: Profile | null;
  profileStats: LeaderboardProfileStats | null;
}

/**
 * Props for the leaderboard profile avatar block.
 */
export interface LeaderboardProfileAvatarProps {
  avatar: string | null;
  avatarFallback: string;
  name: string;
}

/**
 * Props for the leaderboard profile text content.
 */
export interface LeaderboardProfileTextProps {
  bio?: string | null;
  name: string;
  slogan: string | null;
}

/**
 * Props for the leaderboard profile identity section.
 */
export interface LeaderboardProfileIdentityProps {
  profile: Profile;
  avatarFallback: string;
  slogan: string | null;
}

/**
 * Props for the leaderboard level progress section.
 */
export interface LeaderboardProfileProgressProps {
  level: number;
  progress: number;
  requiredExp: number;
  xp: number;
}
