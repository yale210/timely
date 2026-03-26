import moment from "moment";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import type { Event } from "@/types/event";

const localizer = momentLocalizer(moment);

interface CourseEventsCalendarProps {
  courseName: string;
  events: Event[];
  onClose?: () => void;
  inline?: boolean;
}

function getEventStyle(event: Event) {
  const colour = event.colour ?? "#6366F1";

  return {
    style: {
      backgroundColor: colour,
      borderColor: colour,
      color: "#fff",
      borderRadius: "0.5rem",
      paddingInline: "0.25rem",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08)",
    },
  };
}


/**
 * Renders a course events calendar either inline or in a modal depending on the `inline` flag.
 * @param props - The properties passed to the component.
 * @param props.courseName - The name of the course displayed in the calendar header.
 * @param props.events - The list of events to display. Each event object should contain `title`, `start_time`, and `end_time`.
 * @param [props.onClose] - An optional callback function invoked when the modal is closed (only applicable when `inline` is false).
 * @param [props.inline] - A flag indicating whether the calendar should be rendered inline or as a modal.
 * @returns The rendered calendar component.
 */
export default function CourseEventsCalendar({
  courseName,
  events,
  onClose,
  inline = false,
}: CourseEventsCalendarProps) {
  const calendarEvents = events.map((event) => ({
    ...event,
    title: event.title,
    start: new Date(event.start_time),
    end: new Date(event.end_time),
  }));

  if (inline) {
    return (
      <div className="flex h-full min-h-[540px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-black">{courseName}</h2>
          <p className="text-sm text-gray-500">Course events calendar</p>
        </div>

        <div className="min-h-0 flex-1">
          {calendarEvents.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <p className="text-base font-medium text-gray-900">No events yet</p>
              <p className="mt-1 text-sm text-gray-500">
                This course doesn&apos;t have any scheduled events yet.
              </p>
            </div>
          ) : (
            <div className="h-[650px]">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                defaultView={Views.MONTH}
                views={[Views.MONTH, Views.WEEK, Views.DAY]}
                eventPropGetter={getEventStyle}
                style={{ height: "100%" }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 p-4">
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-black">{courseName}</h2>
            <p className="text-sm text-gray-500">Course events calendar</p>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1">
          {calendarEvents.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <p className="text-base font-medium text-gray-900">No events yet</p>
              <p className="mt-1 text-sm text-gray-500">
                This course doesn&apos;t have any scheduled events yet.
              </p>
            </div>
          ) : (
            <div className="h-full">
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                defaultView={Views.MONTH}
                views={[Views.MONTH, Views.WEEK, Views.DAY]}
                eventPropGetter={getEventStyle}
                style={{ height: "100%" }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}