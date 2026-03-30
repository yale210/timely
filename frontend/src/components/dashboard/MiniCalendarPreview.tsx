import moment from "moment";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Calendar, Views, type Formats } from "react-big-calendar";
import { preferenceService } from "@/services/preferenceService";
import type { Category, Event, Task } from "@/types";
import { CALENDAR_DISPLAY_TIMEZONE, toCalendarDisplayDate } from "@/utils/calendarDisplayTime";
import { useCalendarLocalizer } from "@/utils/calendarLocalizer";
import { getOverrideColour, hexToRgba } from "@/utils/colorUtils";
import { getStoredTimeFormat, getStoredWeekStartsOn } from "@/utils/userPreferences";
import { getStoredUserTimezone } from "@/utils/userTimezone";
const DEFAULT_DAY_START = "08:00";
const DEFAULT_DAY_END = "22:00";

interface MiniCalendarEntry {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  kind: "task" | "event";
  categories?: Category[];
  colour?: string | null;
}

interface MiniCalendarPreviewProps {
  tasks: Task[];
  events: Event[];
}

interface DayScheduleEntry {
  day: number;
  start: string;
  end: string;
}

interface MiniCalendarPreferences {
  dayStart: string;
  dayEnd: string;
  daySchedule: DayScheduleEntry[];
  weekStartsOn: "monday" | "sunday";
  timeFormat: "24h" | "12h";
  timezone: string;
}

const parseClockMinutes = (value: string): number => {
  const source = value.includes("T") ? (value.split("T")[1] ?? value) : value;
  const match = /(\d{1,2}):(\d{2})/.exec(source);
  const hour = Number.parseInt(match?.[1] ?? "0", 10);
  const minute = Number.parseInt(match?.[2] ?? "0", 10);
  if (Number.isNaN(hour) || Number.isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return 0;
  }
  return (hour * 60) + minute;
};

const getFallbackPreferences = (): MiniCalendarPreferences => ({
  dayStart: DEFAULT_DAY_START,
  dayEnd: DEFAULT_DAY_END,
  daySchedule: [],
  weekStartsOn: getStoredWeekStartsOn(),
  timeFormat: getStoredTimeFormat(),
  timezone: getStoredUserTimezone(),
});

const loadMiniCalendarPreferences = async (): Promise<MiniCalendarPreferences> => {
  const fallback = getFallbackPreferences();
  try {
    const preference = await preferenceService.getMyPreference();
    return {
      dayStart: preference.day_start.slice(0, 5),
      dayEnd: preference.day_end.slice(0, 5),
      daySchedule: preference.day_schedule ?? [],
      weekStartsOn: preference.week_starts_on ?? fallback.weekStartsOn,
      timeFormat: preference.time_format ?? fallback.timeFormat,
      timezone: preference.timezone ?? fallback.timezone,
    };
  } catch {
    return fallback;
  }
};

const useMiniCalendarPreferences = (): MiniCalendarPreferences => {
  const [preferences, setPreferences] = useState<MiniCalendarPreferences>(getFallbackPreferences);
  useEffect(() => {
    void loadMiniCalendarPreferences().then(setPreferences);
  }, []);
  return preferences;
};

const useObservedHeight = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!ref.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setHeight(Math.round(entry.contentRect.height));
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, height };
};

const syncCalendarWeekStart = (weekStartsOn: "monday" | "sunday") => {
  moment.updateLocale("en", {
    week: { dow: weekStartsOn === "sunday" ? 0 : 1 },
  });
};

const buildCalendarEntries = (tasks: Task[], events: Event[], timeZone: string): MiniCalendarEntry[] => [
  ...tasks.flatMap((task) => (task.allocation ?? []).map((slot, index) => ({
    id: `task-${task.id}-${index}`,
    title: task.title,
    start: toCalendarDisplayDate(slot.start, timeZone),
    end: toCalendarDisplayDate(slot.end, timeZone),
    allDay: false,
    kind: "task" as const,
    categories: task.categories,
    colour: task.colour ?? null,
  }))),
  ...events.map((event) => ({
    id: event.instance_id ?? `event-${event.id}-${event.start_time}`,
    title: event.title,
    start: toCalendarDisplayDate(event.start_time, timeZone),
    end: toCalendarDisplayDate(event.end_time, timeZone),
    allDay: false,
    kind: "event" as const,
    categories: event.categories,
    colour: event.colour ?? null,
  })),
];

interface VisibleRange {
  hours: number;
  startMinutes: number;
  endMinutes: number;
}

const getVisibleRange = (
  daySchedule: DayScheduleEntry[],
  dayStart: string,
  dayEnd: string,
): VisibleRange => {
  const schedule = daySchedule.length > 0 ? daySchedule : [{ day: 1, start: dayStart, end: dayEnd }];
  let minStartMinutes: number | null = null;
  let maxEndMinutes: number | null = null;

  schedule.forEach((entry) => {
    const startMinutes = parseClockMinutes(entry.start);
    const endMinutes = parseClockMinutes(entry.end);
    const normalizedEnd = endMinutes <= startMinutes ? endMinutes + (24 * 60) : endMinutes;
    if (minStartMinutes === null || startMinutes < minStartMinutes) minStartMinutes = startMinutes;
    if (maxEndMinutes === null || normalizedEnd > maxEndMinutes) maxEndMinutes = normalizedEnd;
  });

  const safeStartMinutes = minStartMinutes ?? parseClockMinutes(dayStart);
  const safeEndMinutes = maxEndMinutes ?? parseClockMinutes(dayEnd);
  const hours = Math.max(1, Math.ceil(Math.max(1, safeEndMinutes - safeStartMinutes) / 60));
  return { hours, startMinutes: safeStartMinutes, endMinutes: Math.min(safeEndMinutes, 24 * 60) };
};

const minutesToDate = (minutes: number): Date => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return new Date(Date.UTC(1970, 0, 1, h, m, 0));
};

const buildSizingVars = (containerHeight: number, visibleHours: number): CSSProperties => {
  const headerHeight = 32;
  if (!containerHeight) {
    return { "--mini-header-height": `${headerHeight}px` } as CSSProperties;
  }
  const rawHourHeight = (containerHeight - headerHeight) / visibleHours;
  return {
    "--mini-header-height": `${headerHeight}px`,
    "--mini-hour-height": `${Math.max(12, rawHourHeight).toFixed(3)}px`,
  } as CSSProperties;
};

const buildFormats = (timeFormat: "24h" | "12h"): Formats => {
  const timeLabel = timeFormat === "24h" ? "HH:mm" : "h:mm A";
  return {
    timeGutterFormat: timeLabel,
    eventTimeRangeFormat: ({ start, end }, culture, nextLocalizer) =>
      `${nextLocalizer?.format(start, timeLabel, culture)} - ${nextLocalizer?.format(end, timeLabel, culture)}`,
    dayHeaderFormat: "dddd DD MMM",
    dayFormat: "ddd DD/MM",
  };
};

const getEntryStyle = (entry: MiniCalendarEntry) => {
  const overrideColour = getOverrideColour(entry.categories);
  const fallbackColour = entry.colour ?? (entry.kind === "task" ? "#3b82f6" : "#f97316");
  const appliedColour = overrideColour ?? fallbackColour;
  if (!appliedColour) return {};
  return {
    style: {
      backgroundColor: hexToRgba(appliedColour, 0.85),
      borderLeft: `3px solid ${appliedColour}`,
      color: "#000000",
    },
  };
};

const useMiniCalendarViewModel = (tasks: Task[], events: Event[]) => {
  const { dayStart, dayEnd, daySchedule, weekStartsOn, timeFormat, timezone } = useMiniCalendarPreferences();
  const { ref: containerRef, height: containerHeight } = useObservedHeight();
  const localizer = useCalendarLocalizer(CALENDAR_DISPLAY_TIMEZONE);
  useEffect(() => {
    syncCalendarWeekStart(weekStartsOn);
  }, [weekStartsOn]);
  const calendarEntries = useMemo(() => buildCalendarEntries(tasks, events, timezone), [tasks, events, timezone]);
  const displayDate = useMemo(() => toCalendarDisplayDate(new Date(), timezone), [timezone]);
  const visibleRange = useMemo(() => getVisibleRange(daySchedule, dayStart, dayEnd), [daySchedule, dayStart, dayEnd]);
  const sizingVars = useMemo(() => buildSizingVars(containerHeight, visibleRange.hours), [containerHeight, visibleRange.hours]);
  const formats = useMemo(() => buildFormats(timeFormat), [timeFormat]);
  const min = useMemo(() => minutesToDate(visibleRange.startMinutes), [visibleRange.startMinutes]);
  const max = useMemo(() => minutesToDate(visibleRange.endMinutes), [visibleRange.endMinutes]);
  return { calendarEntries, containerRef, sizingVars, formats, localizer, displayDate, min, max };
};

const MiniCalendarPreview = ({ tasks, events }: MiniCalendarPreviewProps) => {
  const { calendarEntries, containerRef, sizingVars, formats, localizer, displayDate, min, max } = useMiniCalendarViewModel(tasks, events);
  return (
    <div
      className="mini-calendar-preview h-full w-full overflow-hidden"
      style={sizingVars}
      ref={containerRef}
    >
      <Calendar<MiniCalendarEntry>
        localizer={localizer}
        events={calendarEntries}
        defaultView={Views.WEEK}
        views={[Views.WEEK]}
        toolbar={false}
        date={displayDate}
        min={min}
        max={max}
        startAccessor="start"
        endAccessor="end"
        step={60}
        timeslots={1}
        formats={formats}
        eventPropGetter={getEntryStyle}
        style={{ height: "100%" }}
      />
    </div>
  );
};

export default MiniCalendarPreview;
