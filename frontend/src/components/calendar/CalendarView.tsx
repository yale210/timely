import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
import { Calendar, momentLocalizer } from "react-big-calendar";
import type { UseCalendarReturn } from "@/hooks/calendar/useCalendar";
import type { CalendarEntry } from "@/utils/calendarAdapter";

const localizer = momentLocalizer(moment);

interface CalendarViewProps {
  state: Pick<
    UseCalendarReturn["state"],
    "calendarEntries" | "view" | "date"
  >;
  actions: Pick<
    UseCalendarReturn["actions"],
    "setView" | "setDate" | "selectSlot" | "selectEntry"
  >;
}

/**
 * Renders the react-big-calendar view with calendar entries.
 * @param props - Calendar view props.
 * @param props.state - Calendar view state values.
 * @param props.actions - Calendar view action callbacks.
 * @returns The calendar view region.
 */
const CalendarView = ({
  state,
  actions,
}: CalendarViewProps) => (
  <main className="relative flex grow overflow-hidden bg-white p-4">
    <div className="grow overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <Calendar<CalendarEntry>
        localizer={localizer}
        events={state.calendarEntries}
        view={state.view}
        onView={actions.setView}
        date={state.date}
        onNavigate={actions.setDate}
        selectable
        onSelectSlot={actions.selectSlot}
        onSelectEvent={actions.selectEntry}
        toolbar={false}
        className="h-full"
        eventPropGetter={(event) => {
          const className = [
            "event-slot",
            event.repeat ? "is-repeat" : "",
            event.split ? "is-split" : "",
            event.oneGo ? "is-onego" : "",
            event.kind === "event" ? "is-event" : "",
            event.kind === "task" && typeof event.scheduleIndex === "number"
              ? "is-just-scheduled"
              : "",
          ]
            .filter(Boolean)
            .join(" ");
          const style =
            event.kind === "task" && typeof event.scheduleIndex === "number"
              ? { animationDelay: `${event.scheduleIndex * 120}ms` }
              : undefined;
          return { className, style };
        }}
      />
    </div>
  </main>
);

export default CalendarView;
