import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Calendar, Views, momentLocalizer } from "react-big-calendar";
import type { Event, Task } from "@/types";
import { preferenceService } from "@/services/preferenceService";
import { getOverrideColour, hexToRgba } from "@/utils/colorUtils";

const localizer = momentLocalizer(moment);

interface MiniCalendarEntry {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  kind: "task" | "event";
  categories?: Task["categories"] | Event["categories"];
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

const parseClockMinutes = (value: string): number => {
  const source = value.includes("T") ? (value.split("T")[1] ?? value) : value;
  const match = /(\d{1,2}):(\d{2})/.exec(source);
  const hourRaw = match?.[1];
  const minuteRaw = match?.[2];
  const hour = Number.parseInt(hourRaw ?? "0", 10);
  const minute = Number.parseInt(minuteRaw ?? "0", 10);

  if (Number.isNaN(hour) || Number.isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return 0;
  }

  return (hour * 60) + minute;
};

const MiniCalendarPreview = ({ tasks, events }: MiniCalendarPreviewProps) => {
  const [dayStart, setDayStart] = useState("08:00");
  const [dayEnd, setDayEnd] = useState("22:00");
  const [daySchedule, setDaySchedule] = useState<DayScheduleEntry[]>([]);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const preference = await preferenceService.getMyPreference();
        setDayStart(preference.day_start.slice(0, 5));
        setDayEnd(preference.day_end.slice(0, 5));
        setDaySchedule(preference.day_schedule ?? []);
      } catch {
        setDayStart("08:00");
        setDayEnd("22:00");
        setDaySchedule([]);
      }
    };

    void loadPreference();
  }, []);

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContainerHeight(Math.round(entry.contentRect.height));
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const calendarEntries: MiniCalendarEntry[] = [
    ...tasks.flatMap((task) => {
      const allocations = task.allocation ?? [];
      return allocations.map((slot, index) => ({
        id: `task-${task.id}-${index}`,
        title: task.title,
        start: new Date(slot.start),
        end: new Date(slot.end),
        allDay: false,
        kind: "task",
        categories: task.categories,
        colour: task.colour ?? null,
      }));
    }),
    ...events.map((event) => ({
      id: event.instance_id ?? `event-${event.id}-${event.start_time}`,
      title: event.title,
      start: new Date(event.start_time),
      end: new Date(event.end_time),
      allDay: false,
      kind: "event",
      categories: event.categories,
      colour: event.colour ?? null,
    })),
  ];

  const { minTime, maxTime, visibleHours } = useMemo(() => {
    const schedule = daySchedule.length > 0
      ? daySchedule
      : [{ day: 1, start: dayStart, end: dayEnd }];

    let minStartMinutes: number | null = null;
    let maxEndMinutes: number | null = null;

    schedule.forEach((entry) => {
      const startMinutes = parseClockMinutes(entry.start);
      const endMinutes = parseClockMinutes(entry.end);
      const normalizedEnd = endMinutes <= startMinutes ? endMinutes + (24 * 60) : endMinutes;
      if (minStartMinutes === null || startMinutes < minStartMinutes) {
        minStartMinutes = startMinutes;
      }
      if (maxEndMinutes === null || normalizedEnd > maxEndMinutes) {
        maxEndMinutes = normalizedEnd;
      }
    });

    const safeStartMinutes = minStartMinutes ?? parseClockMinutes(dayStart);
    const safeEndMinutes = maxEndMinutes ?? parseClockMinutes(dayEnd);
    const diffMinutes = Math.max(1, safeEndMinutes - safeStartMinutes);
    const visibleHours = Math.max(1, Math.ceil(diffMinutes / 60));

    const today = new Date();
    const minDate = new Date(today);
    minDate.setHours(Math.floor(safeStartMinutes / 60), safeStartMinutes % 60, 0, 0);

    const maxDate = new Date(today);
    maxDate.setHours(Math.floor((safeStartMinutes + diffMinutes) / 60), (safeStartMinutes + diffMinutes) % 60, 0, 0);

    return {
      minTime: minDate,
      maxTime: maxDate,
      visibleHours,
    };
  }, [dayEnd, daySchedule, dayStart]);

  const sizingVars = useMemo(() => {
    const headerHeight = 32;
    if (!containerHeight) {
      return {
        "--mini-header-height": `${headerHeight}px`,
      } as CSSProperties;
    }
    const rawHourHeight = (containerHeight - headerHeight) / visibleHours;
    const hourHeight = Math.max(12, rawHourHeight);
    return {
      "--mini-header-height": `${headerHeight}px`,
      "--mini-hour-height": `${hourHeight.toFixed(3)}px`,
    } as CSSProperties;
  }, [containerHeight, visibleHours]);

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
        min={minTime}
        max={maxTime}
        step={60}
        timeslots={1}
        showAllDay={false}
        eventPropGetter={(entry) => {
          const overrideColour =
            entry.kind === "task"
              ? getOverrideColour(entry.categories as Task["categories"])
              : getOverrideColour(entry.categories as Event["categories"]);
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
        }}
        style={{ height: "100%" }}
      />
    </div>
  );
};

export default MiniCalendarPreview;
