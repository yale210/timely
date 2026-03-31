import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import moment from "moment";
import { Calendar, type Components, type Formats, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import type { UseCalendarReturn } from "@/hooks/calendar/useCalendar";
import type { CalendarEntry } from "@/utils/calendarAdapter";
import { useCalendarLocalizer } from "@/utils/calendarLocalizer";
import {
  buildCalendarComponents,
  getCalendarEntryClassName,
  getCalendarEntryStyle,
} from "@/components/calendar/CalendarViewEventContent";
import {
  fromCalendarDisplayDate,
  getCalendarDisplayDayOfWeek,
  getCalendarDisplayMinutes,
  toCalendarDisplayDate,
} from "@/utils/calendarDisplayTime";
import { getStoredTimeFormat, getStoredWeekStartsOn } from "@/utils/userPreferences";
import { getStoredUserTimezone } from "@/utils/userTimezone";

const DragAndDropCalendar = withDragAndDrop<CalendarEntry>(Calendar);
const DEFAULT_DRAG_SNAP_MINUTES = 5;

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

const parseClockMinutes = (value: string): number => {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number.parseInt(hourRaw ?? "0", 10);
  const minute = Number.parseInt(minuteRaw ?? "0", 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return 0;
  }
  return (hour * 60) + minute;
};

const measureTimeGutterWidth = (shell: HTMLDivElement | null): number | null => {
  const gutter = shell?.querySelector(".rbc-time-gutter");
  return gutter instanceof HTMLElement ? Math.ceil(gutter.getBoundingClientRect().width) : null;
};

const syncTimeGutterWidth = (
  shell: HTMLDivElement | null,
  setTimeGutterWidth: (width: number) => void,
) => {
  const nextWidth = measureTimeGutterWidth(shell);
  if (nextWidth !== null) {
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

const scrollCalendarToMidpoint = (shell: HTMLDivElement | null) => {
  const slotGroups = shell?.querySelectorAll(".rbc-time-gutter .rbc-timeslot-group");
  if (!slotGroups || slotGroups.length === 0) {
    return;
  }
  const targetSlot = slotGroups[0];
  if (!(targetSlot instanceof HTMLElement)) {
    return;
  }
  const scroller = getScrollableAncestor(targetSlot);
  if (!scroller) {
    return;
  }
  scroller.scrollTop = Math.max(0, Math.round((scroller.scrollHeight - scroller.clientHeight) * 0.4));
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
  const displayDate = useMemo(
    () => toCalendarDisplayDate(state.date, activeTimezone),
    [activeTimezone, state.date],
  );
  const calendarDate = useMemo(() => {
    if (state.view !== Views.AGENDA) {
      return displayDate;
    }

    return moment.utc(displayDate).startOf("month").toDate();
  }, [displayDate, state.view]);
  const agendaLength = useMemo(
    () => (state.view === Views.AGENDA ? moment.utc(calendarDate).daysInMonth() : undefined),
    [calendarDate, state.view],
  );
  const dragSnapMinutes = state.preference?.drag_snap_minutes ?? DEFAULT_DRAG_SNAP_MINUTES;
  const dragSnapTimeslots = 60 / dragSnapMinutes;
  const timeFormat = state.preference?.time_format ?? getStoredTimeFormat();
  const weekStartsOn = state.preference?.week_starts_on ?? getStoredWeekStartsOn();

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
    const scrollToMidpoint = () => scrollCalendarToMidpoint(calendarShellRef.current);
    const frame = window.requestAnimationFrame(scrollToMidpoint);
    const timer = window.setTimeout(scrollToMidpoint, 120);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [state.date, state.calendarEntries.length, state.view]);

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
    if ((state.view !== Views.WEEK && state.view !== Views.DAY) || !state.preference) {
      return {};
    }

    const dayOfWeek = getCalendarDisplayDayOfWeek(slotDate);
    const dayKey = dayOfWeek === 0 ? 7 : dayOfWeek;
    const schedule = state.preference.day_schedule ?? [];
    const daySchedule = schedule.find((item) => item.day === dayKey);
    const windowStart = parseClockMinutes(daySchedule?.start ?? state.preference.day_start);
    const windowEnd = parseClockMinutes(daySchedule?.end ?? state.preference.day_end);
    const slotMinutes = getCalendarDisplayMinutes(slotDate);

    if (windowStart === windowEnd) {
      return {};
    }

    const outsideWindow = windowStart < windowEnd
      ? slotMinutes < windowStart || slotMinutes >= windowEnd
      : slotMinutes >= windowEnd && slotMinutes < windowStart;

    if (!outsideWindow) {
      return {};
    }

    return { className: "calendar-off-hours-slot" };
  }, [state.preference, state.view]);

  const handleNavigate = useCallback((nextDisplayDate: Date) => {
    const normalizedDisplayDate = state.view === Views.AGENDA
      ? moment.utc(nextDisplayDate).startOf("month").toDate()
      : nextDisplayDate;
    actions.setDate(fromCalendarDisplayDate(normalizedDisplayDate, activeTimezone));
  }, [actions, activeTimezone, state.view]);

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
            date={calendarDate}
            onNavigate={handleNavigate}
            length={agendaLength}
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