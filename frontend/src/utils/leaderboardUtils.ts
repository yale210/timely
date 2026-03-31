import type { CSSProperties } from "react";
import type { Profile } from "@/types";
import { formatDateInTimezone } from "@/utils/userTimezone";

/**
 * Derived profile metrics used by the leaderboard summary card.
 */
export interface LeaderboardProfileStats {
  avatarFallback: string;
  joinedDate: string;
  level: number;
  progress: number;
  rank: string;
  requiredExp: number;
  slogan: string | null;
  xp: number;
  xpRemaining: number;
}

const getRequiredExp = (level: number) => {
  const nextLevel = Math.max(1, level + 1);
  return Math.round(100 * nextLevel ** 1.5);
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Calculates XP progress information for a leaderboard profile.
 * @param profile - The profile whose level progress should be derived.
 * @returns The current level, XP totals, and progress percentage.
 */
export const getProgressMetrics = (profile: Profile) => {
  const level = profile.level ?? 0;
  const xp = profile.xp ?? 0;
  const requiredExp = getRequiredExp(level);
  const progress = requiredExp > 0 ? clamp((xp / requiredExp) * 100, 0, 100) : 0;

  return {
    level,
    progress,
    requiredExp,
    xp,
    xpRemaining: Math.max(requiredExp - xp, 0),
  };
};

const formatJoinedDate = (value?: string | null) => {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return formatDateInTimezone(date, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getAvatarFallback = (name?: string | null) => {
  if (!name?.trim()) return "?";

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

/**
 * Builds the derived data used by the current user's leaderboard summary.
 * @param profile - The signed-in user's profile.
 * @param leaderboard - The full leaderboard dataset used to compute rank.
 * @returns A normalized stats object for the summary card.
 */
export const buildProfileStats = (
  profile: Profile,
  leaderboard: Profile[],
): LeaderboardProfileStats => {
  const { level, progress, requiredExp, xp, xpRemaining } =
    getProgressMetrics(profile);
  const rankIndex = leaderboard.findIndex((entry) => entry.name === profile.name);

  return {
    avatarFallback: getAvatarFallback(profile.name),
    joinedDate: formatJoinedDate(profile.creation_date),
    level,
    progress,
    rank: rankIndex >= 0 ? `#${rankIndex + 1}` : "Unranked",
    requiredExp,
    slogan: profile.slogan?.trim() || null,
    xp,
    xpRemaining,
  };
};

/**
 * Converts an XP progress percentage into the inline CSS variable used by the progress bar.
 * @param progress - Progress percentage from 0 to 100.
 * @returns CSS custom-property style object for the XP progress fill.
 */
export const getProfileProgressStyle = (
  progress: number,
): CSSProperties => ({ "--xp-progress": `${progress}%` } as CSSProperties);

/**
 * Returns the visual accent classes for a leaderboard placement.
 * @param index - Zero-based leaderboard index.
 * @returns The rank, ring, and icon styling for that placement.
 */
export const getPlacementAccent = (index: number) => {
  if (index === 0) {
    return {
      iconClassName: "text-amber-500",
      rankClassName: "text-amber-600",
      ringClassName: "ring-amber-200",
    };
  }

  if (index === 1) {
    return {
      iconClassName: "text-slate-400",
      rankClassName: "text-slate-500",
      ringClassName: "ring-slate-200",
    };
  }

  if (index === 2) {
    return {
      iconClassName: "text-orange-600",
      rankClassName: "text-orange-700",
      ringClassName: "ring-orange-200",
    };
  }

  return {
    iconClassName: "text-transparent",
    rankClassName: "text-gray-300",
    ringClassName: "ring-gray-200",
  };
};

/**
 * Maps rank labels to the highlight color used in the summary stats.
 * @param value - Rank label such as `#1`.
 * @returns Tailwind classes for the rank value.
 */
export const getRankValueClassName = (value: string) => {
  if (value === "#1") return "text-amber-500";
  if (value === "#2") return "text-slate-400";
  if (value === "#3") return "text-orange-600";
  return "text-[color:var(--text-color)]";
};

/**
 * Chooses a responsive font size for leaderboard names based on length.
 * @param name - Display name shown in the standings list.
 * @returns Tailwind classes for the name text size.
 */
export const getNameClassName = (name: string) => {
  const length = name.trim().length;

  if (length > 24) {
    return "text-base sm:text-lg";
  }

  if (length > 18) {
    return "text-lg sm:text-xl";
  }

  return "text-xl sm:text-[1.55rem]";
};
