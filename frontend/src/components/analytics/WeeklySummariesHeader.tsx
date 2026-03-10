import type { WeeklyStats } from "@/types";

interface WeekOption {
  value: string;
  label: string;
}

interface WeeklySummariesHeaderProps {
  selectedWeek: string;
  weekOptions: WeekOption[];
  stats: WeeklyStats | null;
  onSelectedWeekChange: (nextWeek: string) => void;
}

const formatMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Renders the week selector and summary widget.
 * @param props - Header props.
 * @param props.selectedWeek - The active week value.
 * @param props.weekOptions - Available week selections.
 * @param props.stats - The fetched weekly summary stats.
 * @param props.onSelectedWeekChange - Callback to change the selected week.
 * @returns The analytics header section.
 */
const WeeklySummariesHeader = ({
  selectedWeek,
  weekOptions,
  stats,
  onSelectedWeekChange,
}: WeeklySummariesHeaderProps) => (
  <div className="w-full max-w-6xl">
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Weekly Summaries</h1>
        <p className="text-sm text-gray-500">
          Track completion, time, and priorities for the selected week.
        </p>
      </div>
      <div className="w-full max-w-xs">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Week
        </label>
        <select
          value={selectedWeek}
          onChange={(event) => onSelectedWeekChange(event.target.value)}
          className="mt-2 w-full rounded-md border border-gray-300 bg-white p-2 text-sm shadow-sm"
        >
          {weekOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
        <p className="text-xs uppercase tracking-wide text-gray-400">Completion</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900">
          {stats ? `${stats.completion_percentage}%` : "--"}
        </p>
        <p className="text-sm text-gray-500">
          {stats ? `${stats.completed_tasks}/${stats.total_tasks} tasks` : "Loading..."}
        </p>
      </div>
      <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
        <p className="text-xs uppercase tracking-wide text-gray-400">Time Planned</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900">
          {stats ? formatMinutes(stats.total_minutes_planned) : "--"}
        </p>
        <p className="text-sm text-gray-500">Scheduled minutes this week</p>
      </div>
      <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
        <p className="text-xs uppercase tracking-wide text-gray-400">Avg Tasks/Day</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900">
          {stats ? (stats.completed_tasks / 7).toFixed(1) : "--"}
        </p>
        <p className="text-sm text-gray-500">Based on completed tasks</p>
      </div>
      <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5">
        <p className="text-xs uppercase tracking-wide text-gray-400">Avg Minutes/Day</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900">
          {stats ? formatMinutes(Math.round(stats.total_minutes_planned / 7)) : "--"}
        </p>
        <p className="text-sm text-gray-500">Planned workload</p>
      </div>
    </div>
  </div>
);

export default WeeklySummariesHeader;
