import type { WeeklyStats } from "@/types";
import { overviewIconClassName } from "@/components/dashboard/dashboardOverviewUtils";

interface WeeklyStatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  className?: string;
  icon: string;
  iconClassName: string;
  valueClassName?: string;
}

interface DashboardStatsGridProps {
  derivedStats: WeeklyStats | null;
  periodLabel: string;
  minutesPlannedText: string;
  averageCompletedPerDayText: string;
  averageTaskDurationText: string;
  overdueCount: number;
  overdueToneClass: string;
  streakCount: number;
  streakToneClass: string;
}

const WeeklyStatCard = ({
  title,
  value,
  subtitle,
  className,
  icon,
  iconClassName,
  valueClassName,
}: WeeklyStatCardProps) => (
  <div
    className={`flex h-full flex-col rounded-xl p-5 shadow-sm ring-1 ring-gray-900/5 ${className ?? "bg-white"}`}
  >
    <div className="flex items-center justify-between gap-3">
      <p className="min-w-0 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
        {title}
      </p>
      <span
        aria-hidden="true"
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
      >
        <span className="material-icons block text-xl leading-none">{icon}</span>
      </span>
    </div>
    <div
      className={`mt-5 text-[clamp(1.8rem,2.3vw,2.4rem)] font-semibold leading-[1.05] tracking-tight text-gray-900 ${valueClassName ?? ""}`}
    >
      {value}
    </div>
    {subtitle ? <p className="mt-2 text-sm text-gray-500">{subtitle}</p> : null}
  </div>
);

/**
 * Renders the dashboard metric cards for the selected period.
 * @param props - Derived dashboard statistics and display strings.
 * @param props.derivedStats - Aggregated stats for the selected period.
 * @param props.periodLabel - Selected period label shown in the progress card.
 * @param props.minutesPlannedText - Formatted total planned time for the period.
 * @param props.averageCompletedPerDayText - Formatted completion-rate summary.
 * @param props.averageTaskDurationText - Formatted average task duration summary.
 * @param props.overdueCount - Number of overdue tasks in the selected period.
 * @param props.overdueToneClass - Tone class applied to the overdue card.
 * @param props.streakCount - Current completion streak in days.
 * @param props.streakToneClass - Tone class applied to the streak card.
 * @returns The stats grid section.
 */
export default function DashboardStatsGrid({
  derivedStats,
  periodLabel,
  minutesPlannedText,
  averageCompletedPerDayText,
  averageTaskDurationText,
  overdueCount,
  overdueToneClass,
  streakCount,
  streakToneClass,
}: DashboardStatsGridProps) {
  return (
    <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-900/5">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            {periodLabel} Progress
          </p>
          <span
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${overviewIconClassName}`}
          >
            <span className="material-icons block text-xl leading-none">track_changes</span>
          </span>
        </div>
        <div className="mt-5 text-[clamp(1.8rem,2.3vw,2.4rem)] font-semibold leading-none tracking-tight text-gray-900">
          {derivedStats ? `${derivedStats.completion_percentage}%` : "Loading..."}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {derivedStats
            ? `${derivedStats.completed_tasks}/${derivedStats.total_tasks} tasks completed`
            : "Loading..."}
        </p>
        <div className="mt-5 h-3 w-full rounded-full bg-gray-100">
          <div
            className="h-3 rounded-full bg-cyan-500 transition-all"
            style={{
              width: derivedStats
                ? `${Math.min(100, derivedStats.completion_percentage)}%`
                : "0%",
            }}
          />
        </div>
      </div>
      <WeeklyStatCard
        title="Time Planned"
        value={minutesPlannedText}
        subtitle={derivedStats ? "Planned this period" : undefined}
        icon="schedule"
        iconClassName={overviewIconClassName}
      />
      <WeeklyStatCard
        title="Daily Averages"
        value={averageCompletedPerDayText}
        subtitle={averageTaskDurationText}
        icon="equalizer"
        iconClassName={overviewIconClassName}
        valueClassName="text-[clamp(1.65rem,2vw,2.15rem)]"
      />
      <WeeklyStatCard
        title="Overdue Tasks"
        value={String(overdueCount)}
        subtitle="Past deadline"
        className={overdueToneClass}
        icon="warning_amber"
        iconClassName={overviewIconClassName}
      />
      <WeeklyStatCard
        title="Streak"
        value={`${streakCount} day${streakCount === 1 ? "" : "s"}`}
        subtitle="Consecutive days completed"
        className={streakToneClass}
        icon="local_fire_department"
        iconClassName={overviewIconClassName}
      />
    </section>
  );
}
