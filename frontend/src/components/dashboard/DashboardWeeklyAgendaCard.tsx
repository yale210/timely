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
      className="flex h-full w-full flex-col rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-900/5 transition hover:bg-gray-50 hover:ring-gray-300 sm:p-6"
      aria-label="Open calendar page"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Weekly Agenda</h2>
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-xl text-cyan-700 ring-1 ring-cyan-100 sm:h-10 sm:w-10 sm:text-2xl">
            <span className="material-icons">calendar_view_week</span>
          </span>
        </div>
        <p className="max-w-md text-sm leading-6 text-gray-500">
          Your week at a glance. Click to open full calendar.
        </p>
      </div>
      <div className="mt-3 flex-1 overflow-hidden rounded-md border border-gray-200 sm:mt-4">
        <div className="h-full w-full min-h-0">
          <MiniCalendarPreview tasks={tasks} events={events} />
        </div>
      </div>
    </Link>
  );
}
