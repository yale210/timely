import type { Event, Task, WeeklyStats } from "@/types";

/**
 * Dashboard overview data dependencies.
 */
export interface DashboardOverviewProps {
  tasks: Task[];
  events: Event[];
  weeklyStats: WeeklyStats | null;
}

/**
 * Supported dashboard summary ranges.
 */
export type OverviewPeriod = "daily" | "weekly" | "monthly" | "yearly" | "all_time";

/**
 * Minimal profile data needed for the XP widget.
 */
export interface ProfileStats {
  exp: number;
  level: number;
}
