import DashboardOverview from "@/components/dashboard/DashboardOverview";
import AppLayout from "@/layouts/AppLayout";
import { useDashboard } from "@/hooks/dashboard/useDashboard";

/**
 * Renders the main dashboard page using a thin container.
 * @returns The rendered dashboard page.
 */
export default function Dashboard() {
  const { state } = useDashboard();

  return (
    <AppLayout>
      <DashboardOverview
        tasks={state.tasks}
        events={state.events}
        weeklyStats={state.weeklyStats}
      />
    </AppLayout>
  );
}
