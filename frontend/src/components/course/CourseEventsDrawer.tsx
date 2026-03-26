import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import moment from "moment";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import type { Event } from "@/types/event";

const localizer = momentLocalizer(moment);

interface CourseEventsDrawerProps {
  courseName: string;
  events: Event[];
  loading: boolean;
  onClose: () => void;
}

/**
 * Renders a drawer component that displays calendar events for a course.
 * @param props - Properties passed to the component.
 * @param props.courseName - The name of the course.
 * @param props.events - An array of event objects to be displayed on the calendar. Each event object should include details such as title, start_time, and end_time.
 * @param props.loading - Indicates whether the event data is currently being loaded.
 * @param props.onClose - A callback function invoked when the drawer or its backdrop is closed.
 * @returns The rendered component for the course events drawer.
 */
export default function CourseEventsDrawer({
  courseName,
  events,
  loading,
  onClose,
}: CourseEventsDrawerProps) {
  const calendarEvents = events.map((event) => ({
    ...event,
    title: event.title,
    start: new Date(event.start_time),
    end: new Date(event.end_time),
  }));

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close course drawer backdrop"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      <aside className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-2xl">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-black">{courseName}</h2>
              <p className="text-sm text-gray-500">Course events calendar</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden bg-white p-4">
            {loading ? (
              <div className="px-2 py-2 text-sm text-gray-500">Loading events...</div>
            ) : (
              <div className="mini-calendar-preview h-full w-full">
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  defaultView={Views.MONTH}
                  views={[Views.MONTH, Views.WEEK, Views.DAY]}
                  className="h-full"
                  style={{ height: "100%" }}
                />
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}