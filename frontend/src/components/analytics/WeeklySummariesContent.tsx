import AppLayout from "@/layouts/AppLayout";
import type { UseWeeklySummariesReturn } from "@/hooks/analytics/useWeeklySummaries";
import GraphsPanel from "@/components/analytics/GraphsPanel";
import WeeklySummariesHeader from "@/components/analytics/WeeklySummariesHeader";

interface WeeklySummariesContentProps {
  state: UseWeeklySummariesReturn["state"];
  actions: UseWeeklySummariesReturn["actions"];
}

/**
 * Renders the weekly summaries page shell with extracted analytics components.
 * @param props - Weekly summaries content props.
 * @param props.state - Weekly summaries view state.
 * @param props.actions - Weekly summaries actions.
 * @returns The presentational weekly summaries page.
 */
const WeeklySummariesContent = ({
  state,
  actions,
}: WeeklySummariesContentProps) => (
  <AppLayout>
    <div className="flex flex-1 flex-col items-center gap-8 px-6 pt-6 pb-12">
      <WeeklySummariesHeader
        selectedWeek={state.selectedWeek}
        weekOptions={state.weekOptions}
        stats={state.stats}
        onSelectedWeekChange={actions.setSelectedWeek}
      />
      <GraphsPanel
        stats={state.stats}
        chartMode={state.chartMode}
        onChartModeChange={actions.setChartMode}
      />
    </div>
  </AppLayout>
);

export default WeeklySummariesContent;
