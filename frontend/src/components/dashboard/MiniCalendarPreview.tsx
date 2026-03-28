import moment from "moment";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Calendar, Views, momentLocalizer, type Formats } from "react-big-calendar";
import { preferenceService } from "@/services/preferenceService";
import type { Category, Event, Task } from "@/types";
import { getOverrideColour, hexToRgba } from "@/utils/colorUtils";
import { getStoredTimeFormat, getStoredWeekStartsOn } from "@/utils/userPreferences";

const localizer = momentLocalizer(moment);
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

const buildCalendarEntries = (tasks: Task[], events: Event[]): MiniCalendarEntry[] => [
  ...tasks.flatMap((task) => (task.allocation ?? []).map((slot, index) => ({
    id: `task-${task.id}-${index}`,
    title: task.title,
    start: new Date(slot.start),
    end: new Date(slot.end),
    allDay: false,
    kind: "task" as const,
    categories: task.categories,
    colour: task.colour ?? null,
  }))),
  ...events.map((event) => ({
    id: event.instance_id ?? `event-${event.id}-${event.start_time}`,
    title: event.title,
    start: new Date(event.start_time),
    end: new Date(event.end_time),
    allDay: false,
    kind: "event" as const,
    categories: event.categories,
    colour: event.colour ?? null,
  })),
];

const getVisibleHours = (
  daySchedule: DayScheduleEntry[],
  dayStart: string,
  dayEnd: string,
): number => {
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
  return Math.max(1, Math.ceil(Math.max(1, safeEndMinutes - safeStartMinutes) / 60));
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
  const { dayStart, dayEnd, daySchedule, weekStartsOn, timeFormat } = useMiniCalendarPreferences();
  const { ref: containerRef, height: containerHeight } = useObservedHeight();
  useEffect(() => {
    syncCalendarWeekStart(weekStartsOn);
  }, [weekStartsOn]);
  const calendarEntries = useMemo(() => buildCalendarEntries(tasks, events), [tasks, events]);
  const visibleHours = useMemo(() => getVisibleHours(daySchedule, dayStart, dayEnd), [daySchedule, dayStart, dayEnd]);
  const sizingVars = useMemo(() => buildSizingVars(containerHeight, visibleHours), [containerHeight, visibleHours]);
  const formats = useMemo(() => buildFormats(timeFormat), [timeFormat]);
  return { calendarEntries, containerRef, sizingVars, formats };
};

const MiniCalendarPreview = ({ tasks, events }: MiniCalendarPreviewProps) => {
  const { calendarEntries, containerRef, sizingVars, formats } = useMiniCalendarViewModel(tasks, events);
  return (
    <div
      className="mini-calendar-preview h-full w-full overflow-hidden"
      style={sizingVars}
      ref={containerRef}
    >
      <Calendar
        localizer={localizer}
        events={calendarEntries}
        defaultView={Views.WEEK}
        views={[Views.WEEK]}
        toolbar={false}
        date={new Date()}
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
