import { useState } from "react";
import CompletionPieChart from "@/components/charts/CompletionPieChart";
import DailyTasksBarChart from "@/components/charts/DailyTasksBarChart";
import DailyTimeBarChart from "@/components/charts/DailyTimeBarChart";
import ImportanceBarChart from "@/components/charts/ImportanceBarChart";
import type { WeeklyStats } from "@/types";
import type { AnalyticsChartMode } from "@/hooks/analytics/useWeeklySummaries";

interface GraphsPanelProps {
  stats: WeeklyStats | null;
  chartMode?: AnalyticsChartMode;
  onChartModeChange?: (nextMode: AnalyticsChartMode) => void;
}

/**
 * Renders the chart selector and weekly charts panel.
 * @param props - Graph panel props.
 * @param props.stats - Weekly summary statistics.
 * @param props.chartMode - The active chart mode.
 * @param props.onChartModeChange - Optional callback to change the active chart mode.
 * @returns The analytics charts layout.
 */
const GraphsPanel = ({
  stats,
  chartMode,
  onChartModeChange,
}: GraphsPanelProps) => {
  const [internalChartMode, setInternalChartMode] = useState<AnalyticsChartMode>("importance");
  const activeChartMode = chartMode ?? internalChartMode;

  const handleChartModeChange = (nextMode: AnalyticsChartMode) => {
    if (onChartModeChange) {
      onChartModeChange(nextMode);
      return;
    }

    setInternalChartMode(nextMode);
  };

  return (
    <div className="grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-gray-900/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Breakdown</p>
            <p className="text-xs text-gray-500">Switch between the available weekly views.</p>
          </div>
          <div className="w-full max-w-[220px]">
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400">
              View
            </label>
            <select
              value={activeChartMode}
              onChange={(event) => handleChartModeChange(event.target.value as AnalyticsChartMode)}
              className="mt-2 w-full cursor-pointer rounded border border-gray-300 bg-white p-2 text-sm shadow-sm"
            >
              <option value="importance">Importance</option>
              <option value="tasks">Tasks/Day</option>
              <option value="time">Time/Day</option>
            </select>
          </div>
        </div>
        <div className="mt-6 h-80">
          {activeChartMode === "importance" ? <ImportanceBarChart stats={stats} /> : null}
          {activeChartMode === "tasks" ? <DailyTasksBarChart stats={stats} /> : null}
          {activeChartMode === "time" ? <DailyTimeBarChart stats={stats} /> : null}
        </div>
      </div>
      <div className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-gray-900/5">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-gray-900">Completion Split</p>
          <p className="text-xs text-gray-500">Completed vs remaining tasks.</p>
        </div>
        <div className="mt-6 flex h-80 items-center justify-center">
          <CompletionPieChart stats={stats} />
        </div>
      </div>
    </div>
  );
};

export default GraphsPanel;
