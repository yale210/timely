import type { CSSProperties } from "react";
import type { Components } from "react-big-calendar";
import type { CalendarEntry } from "@/utils/calendarAdapter";
import { formatCalendarDisplayTime } from "@/utils/calendarDisplayTime";
import { getOverrideColour, hexToRgba } from "@/utils/colorUtils";

type CalendarEntryStyle = CSSProperties & { "--event-stripe-color"?: string };

/**
 * Builds the rendered time range label for a calendar entry.
 * @param event - Calendar entry being rendered.
 * @param timeFormat - User-selected time format.
 * @returns Human-readable time range label.
 */
const getEventTimeLabel = (event: CalendarEntry, timeFormat: "24h" | "12h") => {
  const actualEnd = event.actualEnd ?? event.end;
  return `${formatCalendarDisplayTime(event.start, timeFormat)} - ${formatCalendarDisplayTime(actualEnd, timeFormat)}`;
};

/**
 * Renders standard event content inside the calendar cell.
 * @param props - Component props.
 * @param props.event - Calendar entry being rendered.
 * @param props.timeLabel - Preformatted event time range.
 * @returns Event content markup.
 */
const CalendarStandardEventContent = ({ event, timeLabel }: { event: CalendarEntry; timeLabel: string }) => (
  <div className="calendar-entry-content flex h-full w-full items-start gap-2">
    <div className="flex min-w-0 flex-col">
      <span className="calendar-entry-title truncate text-[20px] font-medium">{event.title}</span>
      <span className="calendar-entry-time truncate text-[15px] text-gray-700">{timeLabel}</span>
      {event.eventData?.location && (
        <span className="calendar-entry-location truncate text-[13px] text-gray-600">{event.eventData.location}</span>
      )}
    </div>
  </div>
);

/**
 * Renders task content including the completion checkbox.
 * @param props - Component props.
 * @param props.event - Calendar task entry being rendered.
 * @param props.timeLabel - Preformatted task time range.
 * @param props.handleToggleTaskComplete - Toggles completion state for the task.
 * @returns Task content markup.
 */
const CalendarTaskEventContent = ({
  event,
  timeLabel,
  handleToggleTaskComplete,
}: {
  event: CalendarEntry;
  timeLabel: string;
  handleToggleTaskComplete: (taskId: number) => Promise<void>;
}) => (
  <div className="calendar-entry-content calendar-task-content flex h-full w-full items-start gap-2">
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
      <span className="calendar-entry-title truncate text-[20px] font-medium">{event.title}</span>
      <span className="calendar-entry-time truncate text-[15px] text-gray-600">{timeLabel}</span>
    </div>
  </div>
);

/**
 * Chooses the appropriate cell content for a task or event entry.
 * @param props - Component props.
 * @param props.event - Calendar entry being rendered.
 * @param props.timeFormat - User-selected time format.
 * @param props.handleToggleTaskComplete - Toggles completion state for task entries.
 * @returns Entry content markup.
 */
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

/**
 * Builds the react-big-calendar component overrides for event cells.
 * @param handleToggleTaskComplete - Toggles completion state for task entries.
 * @param timeFormat - User-selected time format.
 * @returns Calendar component override map.
 */
export const buildCalendarComponents = (
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

/**
 * Computes the CSS class list applied to a calendar entry.
 * @param event - Calendar entry being rendered.
 * @returns Space-delimited class name string.
 */
export const getCalendarEntryClassName = (event: CalendarEntry): string =>
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

/**
 * Computes inline styling for a calendar entry.
 * @param event - Calendar entry being rendered.
 * @returns Inline style object for the entry.
 */
export const getCalendarEntryStyle = (event: CalendarEntry): CSSProperties => {
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
