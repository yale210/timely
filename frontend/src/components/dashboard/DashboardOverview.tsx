import { StatCard } from "@/components/index";
import { CalendarPage } from "@/pages/index";

interface DashboardOverviewProps {
  todayTaskTitles: string[];
  pendingTaskTitles: string[];
  overdueTaskTitles: string[];
}

/**
 * Renders the dashboard header, stat cards, and embedded calendar.
 * @param props - Dashboard content props.
 * @param props.todayTaskTitles - The titles of tasks due today.
 * @param props.pendingTaskTitles - The titles of pending future tasks.
 * @param props.overdueTaskTitles - The titles of overdue tasks.
 * @returns The dashboard presentational layout.
 */
const DashboardOverview = ({
  todayTaskTitles,
  pendingTaskTitles,
  overdueTaskTitles,
}: DashboardOverviewProps) => (
  <main className="min-h-screen w-full px-6 pt-2 pb-10 lg:px-10">
    <header className="mb-10 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
        Dashboard
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Overview of your schedule and upcoming tasks
      </p>
    </header>

    <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Today's Tasks"
        value={todayTaskTitles}
        seeMoreHref="/tasks"
      />
      <StatCard
        title="Pending Tasks"
        value={pendingTaskTitles}
        seeMoreHref="/tasks"
      />
      <StatCard
        title="Overdue Tasks"
        value={overdueTaskTitles}
        seeMoreHref="/tasks"
      />

      <section className="col-span-3">
        <div className="w-full rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
          <CalendarPage showNavbar={false} useLayout={false} />
        </div>
      </section>
    </section>
  </main>
);

export default DashboardOverview;
