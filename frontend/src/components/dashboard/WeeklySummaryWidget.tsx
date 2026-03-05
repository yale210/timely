import type React from "react";
import type { WeeklyStats } from "@/types";

const LoadingState = () => (
  <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 text-center">Loading…</div>
);

const StatRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between text-sm text-gray-700"> <span>{label}</span> <span className="font-mono">{value}</span> </div>
);

/**
 * Returns the Tailwind text colour class based on completion percentage.
 * @param percent - Completion percentage (0-100).
 */
const getPercentageColour = (percent: number): string => {
  if (percent < 50) return "text-red-600";
  if (percent < 70) return "text-orange-500";
  return "text-green-600";
};

const Header = ({ percentage }: { percentage: number }) => (
  <div className="mb-4">
    <h3 className="text-sm font-medium text-gray-500">Weekly Progress</h3>
    <div className={`mt-2 text-2xl font-bold ${getPercentageColour(percentage)}`}>{percentage}%</div>
  </div>
);

const NoDataState = () => (
  <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 text-center">
    <h3 className="font-semibold text-gray-900 mb-4">Weekly Summary</h3>
    <p className="text-sm text-gray-500">You had no tasks planned for this week.</p>
  </div>
);

/**
 * Renders the weekly statistics card with fixed width to match dropdown.
 * @param root0 - Props object
 * @param root0.stats - Weekly stats or null while loading
 */
export default function WeeklySummaryWidget({ stats }: { stats: WeeklyStats | null }) {
  if (!stats) return <LoadingState />;
  if (stats.total_tasks === 0) return <NoDataState />;
  const colourClass = getPercentageColour(stats.completion_percentage);
  const taskStatus = `${stats.completed_tasks}/${stats.total_tasks}`;

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 w-full max-w-xs">
      <Header percentage={stats.completion_percentage} />
      <div className="flex flex-col gap-2">
        <StatRow label="Tasks Completed" value={<span className={colourClass}>{taskStatus}</span>} />
        <StatRow label="Minutes Planned" value={stats.total_minutes_planned} />
      </div>
    </div>
  );
}
