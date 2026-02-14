import type React from "react";
import type { WeeklyStats } from "../types";

const LoadingState = () => (
  <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 text-center">Loading…</div>
);

const StatRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between text-sm text-gray-700"> <span>{label}</span> <span className="font-mono">{value}</span> </div>
);

const Header = ({ percentage }: { percentage: number }) => (
  <div className="mb-4"> <h3 className="text-sm font-medium text-gray-500">Weekly Progress</h3> <div className="mt-2 text-2xl font-bold">{percentage}%</div> </div>
);

const NoDataState = () => (
  <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 text-center">
    <h3 className="font-semibold text-gray-900 mb-4">Weekly Summary</h3>
    <p className="text-sm text-gray-500">You had no tasks planned for this week.</p>
  </div>
);

/**
 * Renders the weekly statistics card.
 * @param root0
 * @param root0.stats
 */
export default function WeeklySummaryWidget({ stats }: { stats: WeeklyStats | null }) {
  if (!stats) return <LoadingState />;
  if (stats.total_tasks === 0) return <NoDataState />;

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
      <Header percentage={stats.completion_percentage} />
      <div className="flex flex-col gap-2">
        <StatRow label="Tasks Completed" value={`${stats.completed_tasks}/${stats.total_tasks}`} />
        <StatRow label="Minutes Planned" value={stats.total_minutes_planned} />
      </div>
    </div>
  );
}
