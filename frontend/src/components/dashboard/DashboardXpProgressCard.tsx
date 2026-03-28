import type { CSSProperties } from "react";
import { getRequiredExp } from "@/components/dashboard/dashboardOverviewUtils";
import type { ProfileStats } from "@/components/dashboard/dashboardOverviewTypes";

interface DashboardXpProgressCardProps {
  profileStats: ProfileStats | null;
}

/**
 * Renders the player's current XP and next-level progress.
 * @param props - Profile XP and level values.
 * @param props.profileStats - Current XP and level, or null while loading.
 * @returns The XP progress card.
 */
export default function DashboardXpProgressCard({
  profileStats,
}: DashboardXpProgressCardProps) {
  const level = profileStats?.level ?? 0;
  const exp = profileStats?.exp ?? 0;
  const requiredExp = getRequiredExp(level);
  const progress = requiredExp > 0 ? Math.min(100, (exp / requiredExp) * 100) : 0;
  const progressStyle = { "--xp-progress": `${progress}%` } as CSSProperties;

  if (!profileStats) {
    return (
      <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
        <p className="text-lg font-semibold text-gray-900">Experience</p>
        <p className="mt-2 text-sm text-gray-500">Loading XP...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-gray-900">Experience</p>
        <span className="text-sm font-semibold text-cyan-700">Level {level}</span>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        {exp} / {requiredExp} XP to next level
      </p>
      <div className="mt-4 h-3 w-full rounded-full bg-gray-100">
        <div className="xp-progress-fill h-3 rounded-full bg-cyan-500" style={progressStyle} />
      </div>
    </div>
  );
}
