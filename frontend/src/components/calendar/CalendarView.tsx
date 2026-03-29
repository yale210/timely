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

type CalendarEntryStyle = CSSProperties & { "--event-stripe-color"?: string };

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

const getEventTimeLabel = (event: CalendarEntry, timeFormat: "24h" | "12h") => {
  const actualEnd = event.actualEnd ?? event.end;
  return `${formatEventTime(event.start, timeFormat)} - ${formatEventTime(actualEnd, timeFormat)}`;
};

const CalendarStandardEventContent = ({ event, timeLabel }: { event: CalendarEntry; timeLabel: string }) => (
  <div className="flex h-full w-full items-start gap-2">
    <div className="flex min-w-0 flex-col">
      <span className="truncate text-[20px] font-medium">{event.title}</span>
      <span className="truncate text-[15px] text-gray-700">{timeLabel}</span>
      {event.eventData?.location && (
        <span className="truncate text-[13px] text-gray-600">{event.eventData.location}</span>
      )}
    </div>
  </div>
);

const CalendarTaskEventContent = ({
  event,
  timeLabel,
  handleToggleTaskComplete,
}: {
  event: CalendarEntry;
  timeLabel: string;
  handleToggleTaskComplete: (taskId: number) => Promise<void>;
}) => (
  <div className="flex h-full w-full items-start gap-2">
    <input
      type="checkbox"
      checked={Boolean(event.taskData?.completed)}
      onChange={(inputEvent) => {
        inputEvent.stopPropagation();
        void handleToggleTaskComplete(event.sourceId);
      }}
      onClick={(inputEvent) => inputEvent.stopPropagation()}
      className="mt-1 task-event-checkbox"
      aria-label="Mark task complete"
    />
    <div className="flex min-w-0 flex-col">
      <span className="truncate text-[20px] font-medium">{event.title}</span>
      <span className="truncate text-[15px] text-gray-600">{timeLabel}</span>
    </div>
  </div>
);

const CalendarEntryContent = ({
  event,
  timeFormat,
  handleToggleTaskComplete,
}: {
  event: CalendarEntry;
  timeFormat: "24h" | "12h";
  handleToggleTaskComplete: (taskId: number) => Promise<void>;
}) => {
  const timeLabel = getEventTimeLabel(event, timeFormat);
  return event.kind === "task"
    ? <CalendarTaskEventContent event={event} timeLabel={timeLabel} handleToggleTaskComplete={handleToggleTaskComplete} />
    : <CalendarStandardEventContent event={event} timeLabel={timeLabel} />;
};

const buildCalendarComponents = (
  handleToggleTaskComplete: (taskId: number) => Promise<void>,
  timeFormat: "24h" | "12h",
): Components<CalendarEntry> => ({
  event: ({ event }: { event: CalendarEntry }) => (
    <CalendarEntryContent
      event={event}
      timeFormat={timeFormat}
      handleToggleTaskComplete={handleToggleTaskComplete}
    />
  ),
});

const getCalendarEntryClassName = (event: CalendarEntry): string =>
  [
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

const getCalendarEntryColour = (event: CalendarEntry): string =>
  getOverrideColour(event.kind === "task" ? event.categories : event.eventData?.categories)
  ?? (event.kind === "task" ? event.taskData?.colour ?? "#3b82f6" : event.eventData?.colour ?? "#f97316");

const getCalendarEntryStyle = (event: CalendarEntry): CSSProperties => {
  const style: CalendarEntryStyle = {};
  if (event.kind === "task" && typeof event.scheduleIndex === "number") {
    style.animationDelay = `${event.scheduleIndex * 120}ms`;
  }
  const appliedColour = getCalendarEntryColour(event);
  style.backgroundColor = hexToRgba(appliedColour, 0.5);
  style.borderLeft = `4px solid ${appliedColour}`;
  style["--event-stripe-color"] = hexToRgba(appliedColour, 0.6);
  style.color = "#000000";
  return style;
};

const measureTimeGutterWidth = (shell: HTMLDivElement | null): number => {
  const gutter = shell?.querySelector(".rbc-time-gutter");
  return gutter instanceof HTMLElement ? Math.ceil(gutter.getBoundingClientRect().width) : 0;
};

const syncTimeGutterWidth = (
  shell: HTMLDivElement | null,
  setTimeGutterWidth: (width: number) => void,
) => {
  const nextWidth = measureTimeGutterWidth(shell);
  if (nextWidth > 0) {
    setTimeGutterWidth(nextWidth);
  }
};

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
  return document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null;
};

const scrollCalendarToCurrentHour = (shell: HTMLDivElement | null, activeTimezone: string) => {
  const slotGroups = shell?.querySelectorAll(".rbc-time-gutter .rbc-timeslot-group");
  if (!slotGroups || slotGroups.length === 0) {
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
  scroller.scrollTop += Math.round(targetSlot.getBoundingClientRect().top - scroller.getBoundingClientRect().top);
};

const addWindowDraggingListeners = (clearDraggingFlag: () => void) => {
  window.addEventListener("mouseup", clearDraggingFlag);
  window.addEventListener("touchend", clearDraggingFlag, { passive: true });
  window.addEventListener("touchcancel", clearDraggingFlag, { passive: true });
  window.addEventListener("dragend", clearDraggingFlag);
  window.addEventListener("blur", clearDraggingFlag);
  return () => {
    window.removeEventListener("mouseup", clearDraggingFlag);
    window.removeEventListener("touchend", clearDraggingFlag);
    window.removeEventListener("touchcancel", clearDraggingFlag);
    window.removeEventListener("dragend", clearDraggingFlag);
    window.removeEventListener("blur", clearDraggingFlag);
  };
};

const registerDraggingFlagListeners = (shell: HTMLDivElement) => {
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
  const removeWindowListeners = addWindowDraggingListeners(clearDraggingFlag);
  shell.addEventListener("mousedown", handlePointerDown);
  shell.addEventListener("touchstart", handlePointerDown, { passive: true });
  return () => {
    shell.removeEventListener("mousedown", handlePointerDown);
    shell.removeEventListener("touchstart", handlePointerDown);
    removeWindowListeners();
    clearDraggingFlag();
  };
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
    const measureGutter = () => syncTimeGutterWidth(calendarShellRef.current, setTimeGutterWidth);
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
    const scrollToCurrentHour = () => scrollCalendarToCurrentHour(calendarShellRef.current, activeTimezone);
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
    return registerDraggingFlagListeners(shell);
  }, []);

  const components = useMemo<Components<CalendarEntry>>(
    () => buildCalendarComponents(handleToggleTaskComplete, timeFormat),
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
    return {
      className: getCalendarEntryClassName(event),
      style: getCalendarEntryStyle(event),
    };
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
            messages={{
              noEventsInRange: "No events available for this period",
            }}
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
