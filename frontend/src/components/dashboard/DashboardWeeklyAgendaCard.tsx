import { Link } from "react-router-dom";
import MiniCalendarPreview from "@/components/dashboard/MiniCalendarPreview";
import type { Event, Task } from "@/types";

interface DashboardWeeklyAgendaCardProps {
  tasks: Task[];
  events: Event[];
}

/**
 * Renders the clickable weekly agenda preview card.
 * @param props - Task and event data for the mini calendar.
 * @param props.tasks - Task allocations shown in the preview calendar.
 * @param props.events - Events shown in the preview calendar.
 * @returns The weekly agenda card.
 */
export default function DashboardWeeklyAgendaCard({
  tasks,
  events,
}: DashboardWeeklyAgendaCardProps) {
  return (
    <Link
      to="/calendar"
      className="flex h-full w-full flex-col rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition hover:bg-gray-50 hover:ring-gray-300"
      aria-label="Open calendar page"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Weekly Agenda</h2>
          <p className="mt-1 text-sm text-gray-500">
            Your week at a glance. Click to open full calendar.
          </p>
        </div>
        <span className="material-icons text-2xl text-gray-500">calendar_view_week</span>
      </div>
      <div className="mt-4 flex-1 overflow-hidden rounded-md border border-gray-200">
        <div className="h-full w-full min-h-0">
          <MiniCalendarPreview tasks={tasks} events={events} />
        </div>
      </div>
    </Link>
  );
}
