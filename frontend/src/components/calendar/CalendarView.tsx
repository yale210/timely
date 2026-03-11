import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { type CSSProperties } from "react";
import moment from "moment";
import { Calendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { UseCalendarReturn } from "@/hooks/calendar/useCalendar";
import type { CalendarEntry } from "@/utils/calendarAdapter";
import { getOverrideColour, hexToRgba } from "@/utils/colorUtils";

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop<CalendarEntry>(Calendar);

interface CalendarViewProps {
  state: Pick<
    UseCalendarReturn["state"],
    "calendarEntries" | "view" | "date"
  >;
  actions: Pick<
    UseCalendarReturn["actions"],
    "setView" | "setDate" | "selectSlot" | "selectEntry" | "handleEventDrop" | "handleEventResize"
  >;
}

/**
 * Renders the react-big-calendar view with drag-and-drop and colour overrides.
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
      <DndProvider backend={HTML5Backend}>
        <DragAndDropCalendar
          localizer={localizer}
          events={state.calendarEntries}
          view={state.view}
          onView={actions.setView}
          date={state.date}
          onNavigate={actions.setDate}
          selectable
          onSelectSlot={actions.selectSlot}
          onSelectEvent={actions.selectEntry}
          draggableAccessor={() => true}
          resizableAccessor={() => true}
          onEventDrop={(args) => {
            void actions.handleEventDrop(args);
          }}
          onEventResize={(args) => {
            void actions.handleEventResize(args);
          }}
          toolbar={false}
          className="h-full"
          eventPropGetter={(event: CalendarEntry) => {
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

            const overrideColour =
              event.kind === "task"
                ? getOverrideColour(event.categories)
                : getOverrideColour(event.eventData?.categories);

            const style: CSSProperties = {};
            if (event.kind === "task" && typeof event.scheduleIndex === "number") {
              style.animationDelay = `${event.scheduleIndex * 120}ms`;
            }
            if (overrideColour) {
              style.backgroundColor = hexToRgba(overrideColour, 0.5);
              style.borderLeft = `4px solid ${overrideColour}`;
              (style as Record<string, string>)["--event-stripe-color"] = hexToRgba(
                overrideColour,
                0.6,
              );
              style.color = "#000000";
            }

            return { className, style };
          }}
        />
      </DndProvider>
    </div>
  </main>
);

export default CalendarView;
