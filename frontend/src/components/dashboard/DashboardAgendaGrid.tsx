import DashboardUpcomingTasksCard from "@/components/dashboard/DashboardUpcomingTasksCard";
import DashboardWeeklyAgendaCard from "@/components/dashboard/DashboardWeeklyAgendaCard";
import DashboardXpProgressCard from "@/components/dashboard/DashboardXpProgressCard";
import type { ProfileStats } from "@/components/dashboard/dashboardOverviewTypes";
import type { Event, Task } from "@/types";

interface DashboardAgendaGridProps {
  tasks: Task[];
  events: Event[];
  recentTasks: Task[];
  checkedOverrides: Record<number, boolean | undefined>;
  periodLabel: string;
  profileStats: ProfileStats | null;
  onToggleTask: (task: Task, nextChecked: boolean) => void;
}

/**
 * Renders the dashboard agenda area with the calendar preview and side cards.
 * @param props - Agenda section data and handlers.
 * @param props.tasks - Tasks shown in the weekly agenda preview.
 * @param props.events - Events shown in the weekly agenda preview.
 * @param props.recentTasks - Upcoming incomplete tasks for the checklist card.
 * @param props.checkedOverrides - Optimistic completion state keyed by task id.
 * @param props.periodLabel - Empty-state label for the upcoming tasks card.
 * @param props.profileStats - Profile XP data for the sidebar progress card.
 * @param props.onToggleTask - Handler for toggling task completion from the checklist.
 * @returns The agenda grid content.
 */
export default function DashboardAgendaGrid({
  tasks,
  events,
  recentTasks,
  checkedOverrides,
  periodLabel,
  profileStats,
  onToggleTask,
}: DashboardAgendaGridProps) {
  return (
    <section className="mt-6 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-5">
      <section className="min-h-[580px] lg:col-span-3">
        <DashboardWeeklyAgendaCard tasks={tasks} events={events} />
      </section>

      <section className="lg:col-span-2">
        <div className="flex h-full flex-col gap-6">
          <DashboardUpcomingTasksCard
            tasks={recentTasks}
            checkedOverrides={checkedOverrides}
            onToggleTask={onToggleTask}
            periodLabel={periodLabel}
          />
          <DashboardXpProgressCard profileStats={profileStats} />
        </div>
      </section>
    </section>
  );
}
