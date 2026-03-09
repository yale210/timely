import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";
import { Calendar, Views, momentLocalizer, type EventPropGetter } from "react-big-calendar";
import type { CSSProperties } from "react";
import type { Event, Task, Category } from "@/types";
import { getOverrideColour, hexToRgba } from "@/utils/colorUtils";
import { preferenceService } from "@/services/preferenceService";

const localizer = momentLocalizer(moment);

interface MiniCalendarEntry {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  kind: "task" | "event";
  categories?: Category[];
  eventData?: Event;
}

interface MiniCalendarPreviewProps {
  tasks: Task[];
  events: Event[];
  useFullHeight?: boolean;
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

const MiniCalendarPreview = ({ tasks, events, useFullHeight = false }: MiniCalendarPreviewProps) => {
  const [dayStart, setDayStart] = useState("08:00");
  const [dayEnd, setDayEnd] = useState("22:00");

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const preference = await preferenceService.getMyPreference();
        setDayStart(preference.day_start.slice(0, 5));
        setDayEnd(preference.day_end.slice(0, 5));
      } catch {
        setDayStart("08:00");
        setDayEnd("22:00");
      }
    };

    void loadPreference();
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
        kind: "task" as const,
        categories: task.categories,
      }));
    }),
    ...events.map((event) => ({
      id: event.instance_id ?? `event-${event.id}-${event.start_time}`,
      title: event.title,
      start: new Date(event.start_time),
      end: new Date(event.end_time),
      allDay: false,
      kind: "event" as const,
      eventData: event,
    })),
  ];

  const { minTime, maxTime, previewHeight, isNowVisible, visibleHours, fullHeight } = useMemo(() => {
    const startMinutes = parseClockMinutes(dayStart);
    const endMinutes = parseClockMinutes(dayEnd);
    const rawDiff = (endMinutes - startMinutes + (24 * 60)) % (24 * 60);
    const diffMinutes = rawDiff === 0 ? 24 * 60 : rawDiff;
    const safeEndMinutes = startMinutes + diffMinutes;
    const visibleHours = Math.max(1, Math.ceil(diffMinutes / 60));
    const rangeStart = startMinutes;
    const rangeEnd = safeEndMinutes;

    const today = new Date();
    const minDate = new Date(today);
    minDate.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);

    const maxDate = new Date(today);
    maxDate.setHours(Math.floor(safeEndMinutes / 60), safeEndMinutes % 60, 0, 0);

    // Match preview height to rendered grid rows to avoid trailing blank space.
    const slotGroupHeight = 24;
    const headerHeight = 32;
    const nextHeight = Math.max(
      220,
      (visibleHours * slotGroupHeight) + headerHeight,
    );
    const nextFullHeight = (visibleHours * slotGroupHeight) + headerHeight;

    const now = new Date();
    let nowMinutes = (now.getHours() * 60) + now.getMinutes();
    if (rangeEnd > (24 * 60) && nowMinutes < rangeStart) {
      nowMinutes += 24 * 60;
    }
    const nextIsNowVisible = nowMinutes >= rangeStart && nowMinutes < rangeEnd;

    return {
      minTime: minDate,
      maxTime: maxDate,
      previewHeight: nextHeight,
      isNowVisible: nextIsNowVisible,
      visibleHours,
      fullHeight: nextFullHeight,
    };
  }, [dayEnd, dayStart]);

  const eventPropGetter: EventPropGetter<MiniCalendarEntry> = (entry) => {
    const className = [
      "event-slot",
      entry.kind === "event" ? "is-event" : "",
      "is-onego",
    ]
      .filter(Boolean)
      .join(" ");

    const overrideColour =
      entry.kind === "task"
        ? getOverrideColour(entry.categories)
        : getOverrideColour(entry.eventData?.categories);

    const style: CSSProperties = {};
    if (overrideColour) {
      style.backgroundColor = hexToRgba(overrideColour, 0.5);
      style.borderLeft = `4px solid ${overrideColour}`;
      (style as Record<string, string>)["--event-stripe-color"] = hexToRgba(overrideColour, 0.6);
      style.color = "#000000";
    }

    return { className, style };
  };

  return (
    <div
      className={`mini-calendar-preview pointer-events-none ${isNowVisible ? "" : "hide-now-indicator"}`}
      style={{ "--mini-visible-hours": String(visibleHours) } as CSSProperties}
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
        eventPropGetter={eventPropGetter}
        style={{ height: useFullHeight ? `${fullHeight}px` : previewHeight }}
      />
    </div>
  );
};

export default MiniCalendarPreview;
