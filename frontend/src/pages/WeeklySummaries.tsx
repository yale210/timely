import WeeklySummariesContent from "@/components/analytics/WeeklySummariesContent";
import { useWeeklySummaries } from "@/hooks/analytics/useWeeklySummaries";

/**
 * Renders the weekly summaries page using a thin container.
 * @returns The rendered weekly summaries page.
 */
export default function WeeklySummaries() {
  const { state, actions } = useWeeklySummaries();

  return <WeeklySummariesContent state={state} actions={actions} />;
}
