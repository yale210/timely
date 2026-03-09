import { AppNavbar, Footer } from "@/components";
import type { UseWeeklySummariesReturn } from "@/hooks/analytics/useWeeklySummaries";
import AnalyticsBackground from "@/components/analytics/AnalyticsBackground";
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
  <div className="relative isolate flex min-h-screen flex-col bg-white font-sans text-black">
    <AppNavbar />
    <AnalyticsBackground />
    <main className="flex grow flex-col items-center gap-12 px-4 pt-24 pb-12">
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
    </main>
    <Footer />
  </div>
);

export default WeeklySummariesContent;
