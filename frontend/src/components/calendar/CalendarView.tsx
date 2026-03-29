import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties } from "react";
import moment from "moment";
import { Calendar, type Components, type Formats, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { UseCalendarReturn } from "@/hooks/calendar/useCalendar";
import { isOutsidePreferredDayWindow } from "@/hooks/calendar/useCalendar";
import type { CalendarEntry } from "@/utils/calendarAdapter";
import { useCalendarLocalizer } from "@/utils/calendarLocalizer";
import { getOverrideColour, hexToRgba } from "@/utils/colorUtils";
import { getStoredTimeFormat, getStoredWeekStartsOn } from "@/utils/userPreferences";
import { getStoredUserTimezone, getZonedDateParts } from "@/utils/userTimezone";

const DragAndDropCalendar = withDragAndDrop<CalendarEntry>(Calendar);
const DEFAULT_DRAG_SNAP_MINUTES = 5;

// Module-level stable references — never change, so they never cause re-renders.
const alwaysTrue = () => true;

interface CalendarViewProps {
  state: Pick<
    UseCalendarReturn["state"],
    "calendarEntries" | "view" | "date" | "preference" | "headerHeight"
  >;
  actions: Pick<
    UseCalendarReturn["actions"],
    "setView" | "setDate" | "selectSlot" | "selectEntry" | "handleEventDrop" | "handleEventResize" | "handleToggleTaskComplete" | "setTimeGutterWidth"
  >;
}

const formatEventTime = (dateValue: Date, timeFormat: "24h" | "12h") => {
  if (timeFormat === "24h") {
    return `${String(dateValue.getHours()).padStart(2, "0")}:${String(dateValue.getMinutes()).padStart(2, "0")}`;
  }
  const hours24 = dateValue.getHours();
  const minutes = dateValue.getMinutes();
  const isPm = hours24 >= 12;
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const suffix = isPm ? "pm" : "am";
  if (minutes === 0) {
    return `${hours12}${suffix}`;
  }
  const padded = String(minutes).padStart(2, "0");
  return `${hours12}:${padded}${suffix}`;
};

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
}: CalendarViewProps) => {
  const calendarShellRef = useRef<HTMLDivElement | null>(null);
  const localizer = useCalendarLocalizer();
  const activeTimezone = state.preference?.timezone ?? getStoredUserTimezone();
  const dragSnapMinutes = state.preference?.drag_snap_minutes ?? DEFAULT_DRAG_SNAP_MINUTES;
  const dragSnapTimeslots = 60 / dragSnapMinutes;
  const timeFormat = state.preference?.time_format ?? getStoredTimeFormat();
  const weekStartsOn = state.preference?.week_starts_on ?? getStoredWeekStartsOn();

  // Destructure so the React Compiler can track individual deps rather than the whole object.
  const {
    setTimeGutterWidth,
    handleToggleTaskComplete,
    handleEventDrop,
    handleEventResize,
    selectSlot,
    selectEntry,
  } = actions;

  useEffect(() => {
    moment.updateLocale("en", {
      week: { dow: weekStartsOn === "sunday" ? 0 : 1 },
    });
  }, [weekStartsOn]);

  useLayoutEffect(() => {
    if (state.view !== Views.WEEK && state.view !== Views.DAY) {
      return;
    }

    // Measure the third-party time gutter after layout so the fixed header can stay aligned.
    const measureGutter = () => {
      const shell = calendarShellRef.current;
      if (!shell) {
        return;
      }
      const gutter = shell.querySelector(".rbc-time-gutter");
      if (!(gutter instanceof HTMLElement)) {
        return;
      }
      const nextWidth = Math.ceil(gutter.getBoundingClientRect().width);
      if (nextWidth > 0) {
        setTimeGutterWidth(nextWidth);
      }
    };

    const frame = window.requestAnimationFrame(measureGutter);
    window.addEventListener("resize", measureGutter);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measureGutter);
    };
  }, [setTimeGutterWidth, state.date, state.calendarEntries.length, state.view]);

  useEffect(() => {
    if (state.view !== Views.WEEK && state.view !== Views.DAY) {
      return;
    }

    const shell = calendarShellRef.current;
    if (!shell) {
      return;
    }

    const getScrollableAncestor = (element: HTMLElement): HTMLElement | null => {
      let current: HTMLElement | null = element;
      while (current) {
        const style = window.getComputedStyle(current);
        const canScroll = current.scrollHeight > current.clientHeight + 1;
        const overflowScrollable = style.overflowY === "auto" || style.overflowY === "scroll";
        if (canScroll && overflowScrollable) {
          return current;
        }
        current = current.parentElement;
      }

      return (document.scrollingElement instanceof HTMLElement) ? document.scrollingElement : null;
    };

    // Week/day views should open near the current hour once the calendar has finished painting.
    const scrollToCurrentHour = () => {
      const slotGroups = shell.querySelectorAll(".rbc-time-gutter .rbc-timeslot-group");
      if (slotGroups.length === 0) {
        return;
      }

      const currentHour = getZonedDateParts(new Date(), activeTimezone).hour;
      const targetIndex = Math.min(Math.max(currentHour, 0), slotGroups.length - 1);
      const targetSlot = slotGroups[targetIndex];
      if (!(targetSlot instanceof HTMLElement)) {
        return;
      }

      const scroller = getScrollableAncestor(targetSlot);
      if (!scroller) {
        return;
      }

      const slotRect = targetSlot.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();
      scroller.scrollTop += Math.round(slotRect.top - scrollerRect.top);
    };

    const frame = window.requestAnimationFrame(scrollToCurrentHour);
    const timer = window.setTimeout(scrollToCurrentHour, 120);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [activeTimezone, state.date, state.calendarEntries.length, state.view]);

  useEffect(() => {
    const shell = calendarShellRef.current;
    if (!shell) {
      return;
    }

    // Toggle a document-level flag so CSS can react while calendar entries are being dragged.
    const setDraggingFlag = () => {
      document.documentElement.dataset.calendarDragging = "true";
    };
    const clearDraggingFlag = () => {
      delete document.documentElement.dataset.calendarDragging;
    };

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".rbc-event")) {
        setDraggingFlag();
      }
    };

    shell.addEventListener("mousedown", handlePointerDown);
    shell.addEventListener("touchstart", handlePointerDown, { passive: true });
    window.addEventListener("mouseup", clearDraggingFlag);
    window.addEventListener("touchend", clearDraggingFlag, { passive: true });
    window.addEventListener("touchcancel", clearDraggingFlag, { passive: true });
    window.addEventListener("dragend", clearDraggingFlag);
    window.addEventListener("blur", clearDraggingFlag);

    return () => {
      shell.removeEventListener("mousedown", handlePointerDown);
      shell.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("mouseup", clearDraggingFlag);
      window.removeEventListener("touchend", clearDraggingFlag);
      window.removeEventListener("touchcancel", clearDraggingFlag);
      window.removeEventListener("dragend", clearDraggingFlag);
      window.removeEventListener("blur", clearDraggingFlag);
      clearDraggingFlag();
    };
  }, []);

  const components = useMemo<Components<CalendarEntry>>(
    () => ({
      event: ({ event }: { event: CalendarEntry }) => {
        const actualEnd = event.actualEnd ?? event.end;
        const timeLabel = `${formatEventTime(event.start, timeFormat)} - ${formatEventTime(actualEnd, timeFormat)}`;
        if (event.kind !== "task") {
          return (
            <div className="flex h-full w-full items-start gap-2">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[20px] font-medium">{event.title}</span>
                <span className="truncate text-[15px] text-gray-700">{timeLabel}</span>
                {event.eventData?.location && (
                  <span className="truncate text-[13px] text-gray-600">
                    {event.eventData.location}
                  </span>
                )}
              </div>
            </div>
          );
        }
        return (
          <div className="flex h-full w-full items-start gap-2">
            <input
              type="checkbox"
              checked={Boolean(event.taskData?.completed)}
              onChange={(e) => {
                e.stopPropagation();
                void handleToggleTaskComplete(event.sourceId);
              }}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 task-event-checkbox"
              aria-label="Mark task complete"
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[20px] font-medium">{event.title}</span>
              <span className="truncate text-[15px] text-gray-600">{timeLabel}</span>
            </div>
          </div>
        );
      },
    }),
    [handleToggleTaskComplete, timeFormat],
  );

  const onEventDrop = useCallback(
    (args: Parameters<typeof handleEventDrop>[0]) => { void handleEventDrop(args); },
    [handleEventDrop],
  );

  const onEventResize = useCallback(
    (args: Parameters<typeof handleEventResize>[0]) => { void handleEventResize(args); },
    [handleEventResize],
  );

  const eventPropGetter = useCallback((event: CalendarEntry) => {
    const className = [
      "event-slot",
      event.kind === "task" ? "task-event" : "",
      event.repeat ? "is-repeat" : "",
      event.split ? "is-split" : "",
      event.oneGo ? "is-onego" : "",
      event.kind === "event" ? "is-event" : "",
      event.kind === "task" && typeof event.scheduleIndex === "number" ? "is-just-scheduled" : "",
    ]
      .filter(Boolean)
      .join(" ");
    const overrideColour =
      event.kind === "task"
        ? getOverrideColour(event.categories)
        : getOverrideColour(event.eventData?.categories);
    const fallbackColour =
      event.kind === "task"
        ? event.taskData?.colour ?? "#3b82f6"
        : event.eventData?.colour ?? "#f97316";
    const appliedColour = overrideColour ?? fallbackColour;

    const style: CSSProperties = {};
    if (event.kind === "task" && typeof event.scheduleIndex === "number") {
      style.animationDelay = `${event.scheduleIndex * 120}ms`;
    }
    if (appliedColour) {
      style.backgroundColor = hexToRgba(appliedColour, 0.5);
      style.borderLeft = `4px solid ${appliedColour}`;
      (style as Record<string, string>)["--event-stripe-color"] = hexToRgba(appliedColour, 0.6);
      style.color = "#000000";
    }

    return { className, style };
  }, []);

  const slotPropGetter = useCallback((slotDate: Date) => {
    if (
      (state.view !== Views.WEEK && state.view !== Views.DAY) ||
      !isOutsidePreferredDayWindow(slotDate, state.preference)
    ) {
      return {};
    }
    return { className: "calendar-off-hours-slot" };
  }, [state.view, state.preference]);

  const formats = useMemo<Formats>(() => {
    const timeLabel = timeFormat === "24h" ? "HH:mm" : "h:mm A";
    return {
      timeGutterFormat: timeLabel,
      agendaTimeFormat: timeLabel,
      agendaHeaderFormat: ({ start, end }, culture, nextLocalizer) =>
        `${nextLocalizer?.format(start, "DD MMM", culture)} - ${nextLocalizer?.format(end, "DD MMM", culture)}`,
      agendaTimeRangeFormat: ({ start, end }, culture, nextLocalizer) =>
        `${nextLocalizer?.format(start, timeLabel, culture)} - ${nextLocalizer?.format(end, timeLabel, culture)}`,
      dayRangeHeaderFormat: ({ start, end }, culture, nextLocalizer) =>
        `${nextLocalizer?.format(start, "DD MMM", culture)} - ${nextLocalizer?.format(end, "DD MMM", culture)}`,
      dayHeaderFormat: "dddd DD MMM",
      dayFormat: "ddd DD/MM",
    };
  }, [timeFormat]);

  return (
    <main
      className="relative flex min-h-0 grow overflow-hidden bg-white"
      style={{ paddingTop: `${state.headerHeight}px` }}
    >
      <div
        ref={calendarShellRef}
        className="calendar-grid-shell grow min-h-0 overflow-hidden bg-white"
      >
        <DndProvider backend={HTML5Backend}>
          <DragAndDropCalendar
            localizer={localizer}
            events={state.calendarEntries}
            view={state.view}
            onView={actions.setView}
            date={state.date}
            onNavigate={actions.setDate}
            step={dragSnapMinutes}
            timeslots={dragSnapTimeslots}
            slotPropGetter={slotPropGetter}
            selectable="ignoreEvents"
            onSelectSlot={selectSlot}
            onSelectEvent={selectEntry}
            draggableAccessor={alwaysTrue}
            resizableAccessor={alwaysTrue}
            onEventDrop={onEventDrop}
            onEventResize={onEventResize}
            formats={formats}
            showMultiDayTimes
            toolbar={false}
            className="h-full"
            components={components}
            eventPropGetter={eventPropGetter}
          />
        </DndProvider>
      </div>
    </main>
  );
};

export default memo(CalendarView);
