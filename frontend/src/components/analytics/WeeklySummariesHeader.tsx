import { WeeklySummaryWidget } from "@/components";
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
  <div className="z-10 mt-12 mb-20 flex w-full max-w-md flex-col items-center gap-6">
    <div className="relative z-50 w-full">
      <select
        value={selectedWeek}
        onChange={(event) => onSelectedWeekChange(event.target.value)}
        className="w-full rounded-md border border-gray-300 p-2 shadow-sm"
      >
        {weekOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
    <WeeklySummaryWidget stats={stats} />
  </div>
);

export default WeeklySummariesHeader;
