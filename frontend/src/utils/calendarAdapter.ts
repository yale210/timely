import moment from "moment";
import type { Category, Event, Task } from "@/types";
import { toCalendarDisplayDate } from "@/utils/calendarDisplayTime";

/**
 * Represents a calendar event rendered by react-big-calendar.
 */
export interface CalendarEntry {
  id: string;
  title: string;
  start: Date;
  end: Date;
  actualEnd: Date;
  allDay: boolean;
  kind: "task" | "event";
  sourceId: number;
  repeat?: boolean;
  split?: boolean;
  oneGo?: boolean;
  scheduleIndex?: number;
  eventData?: Event;
  categories?: Category[];
  allocationIndex?: number;
  taskData?: Task;
}

interface BuildCalendarEntriesOptions {
  tasks: Task[];
  events: Event[];
  scheduleOrder: Record<number, number>;
  timeZone: string;
}

const getRenderableEnd = (startValue: string, endValue: string): Date => {
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (end.getTime() <= start.getTime()) {
    return end;
  }

  return new Date(end.getTime() - 1);
};

const buildTaskEntry = (
  task: Task,
  slot: { start: string; end: string },
  index: number,
  allocationCount: number,
  scheduleOrder: Record<number, number>,
  timeZone: string,
): CalendarEntry => ({
  id: `task-${task.id}-${index}`,
  title: task.title,
  start: toCalendarDisplayDate(slot.start, timeZone),
  end: toCalendarDisplayDate(getRenderableEnd(slot.start, slot.end), timeZone),
  actualEnd: toCalendarDisplayDate(slot.end, timeZone),
  allDay: moment(slot.end).diff(moment(slot.start), "hours") >= 24,
  kind: "task",
  sourceId: task.id,
  taskData: task,
  split: allocationCount > 1,
  oneGo: allocationCount === 1,
  scheduleIndex: scheduleOrder[task.id],
  categories: task.categories,
  allocationIndex: index,
});

const buildTaskEntriesForTask = (
  task: Task,
  scheduleOrder: Record<number, number>,
  timeZone: string,
): CalendarEntry[] => {
  const allocations = task.allocation ?? [];
  return allocations.map((slot, index) =>
    buildTaskEntry(task, slot, index, allocations.length, scheduleOrder, timeZone),
  );
};

const buildEventEntry = (event: Event, timeZone: string): CalendarEntry => ({
  id: event.instance_id ?? `event-${event.id}-${event.start_time}`,
  title: event.title,
  start: toCalendarDisplayDate(event.start_time, timeZone),
  end: toCalendarDisplayDate(getRenderableEnd(event.start_time, event.end_time), timeZone),
  actualEnd: toCalendarDisplayDate(event.end_time, timeZone),
  allDay: false,
  kind: "event",
  sourceId: event.id,
  oneGo: true,
  eventData: event,
});

/**
 * Maps task allocations into react-big-calendar task entries.
 * @param tasks - Tasks that may contain allocation slots.
 * @param scheduleOrder - Animation ordering for newly scheduled tasks.
 * @param timeZone - Active timezone used for the synthetic display clock.
 * @returns Calendar task entries.
 */
export const buildTaskCalendarEntries = (
  tasks: Task[],
  scheduleOrder: Record<number, number>,
  timeZone: string,
): CalendarEntry[] => tasks.flatMap((task) => buildTaskEntriesForTask(task, scheduleOrder, timeZone));

/**
 * Maps API events into react-big-calendar event entries.
 * @param events - Events returned from the API.
 * @param timeZone - Active timezone used for the synthetic display clock.
 * @returns Calendar event entries.
 */
export const buildEventCalendarEntries = (events: Event[], timeZone: string): CalendarEntry[] =>
  events.map((event) => buildEventEntry(event, timeZone));

/**
 * Maps task allocations and calendar events into react-big-calendar entries.
 * @param options - Adapter input values.
 * @param options.tasks - Tasks that may contain allocation slots.
 * @param options.events - Events returned from the API.
 * @param options.scheduleOrder - Animation ordering for newly scheduled tasks.
 * @param options.timeZone - Active timezone used for the synthetic display clock.
 * @returns Calendar entries suitable for react-big-calendar.
 */
export const buildCalendarEntries = ({
  tasks,
  events,
  scheduleOrder,
  timeZone,
}: BuildCalendarEntriesOptions): CalendarEntry[] => [
  ...buildTaskCalendarEntries(tasks, scheduleOrder, timeZone),
  ...buildEventCalendarEntries(events, timeZone),
];
