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
    <div className="relative z-10 grid w-full max-w-350 grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-32">
      <div>
        <div className="relative z-50 mb-6">
          <label className="mb-2 block text-xs font-bold uppercase text-gray-400">
            Category
          </label>
          <select
            value={activeChartMode}
            onChange={(event) => handleChartModeChange(event.target.value as AnalyticsChartMode)}
            className="w-full max-w-xs cursor-pointer rounded border bg-white p-2 shadow-sm"
          >
            <option value="importance">Importance</option>
            <option value="tasks">Tasks/Day</option>
            <option value="time">Time/Day</option>
          </select>
        </div>
        <div className="h-96">
          {activeChartMode === "importance" ? <ImportanceBarChart stats={stats} /> : null}
          {activeChartMode === "tasks" ? <DailyTasksBarChart stats={stats} /> : null}
          {activeChartMode === "time" ? <DailyTimeBarChart stats={stats} /> : null}
        </div>
      </div>
      <div className="flex items-center justify-center">
        <div className="flex h-96 items-center justify-center">
          <CompletionPieChart stats={stats} />
        </div>
      </div>
    </div>
  );
};

export default GraphsPanel;
