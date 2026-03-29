import moment from "moment";
import type { Category, Event, Task } from "@/types";

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
): CalendarEntry => ({
  id: `task-${task.id}-${index}`,
  title: task.title,
  start: new Date(slot.start),
  end: getRenderableEnd(slot.start, slot.end),
  actualEnd: new Date(slot.end),
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
): CalendarEntry[] => {
  const allocations = task.allocation ?? [];
  return allocations.map((slot, index) =>
    buildTaskEntry(task, slot, index, allocations.length, scheduleOrder),
  );
};

const buildEventEntry = (event: Event): CalendarEntry => ({
  id: event.instance_id ?? `event-${event.id}-${event.start_time}`,
  title: event.title,
  start: new Date(event.start_time),
  end: getRenderableEnd(event.start_time, event.end_time),
  actualEnd: new Date(event.end_time),
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
 * @returns Calendar task entries.
 */
export const buildTaskCalendarEntries = (
  tasks: Task[],
  scheduleOrder: Record<number, number>,
): CalendarEntry[] => tasks.flatMap((task) => buildTaskEntriesForTask(task, scheduleOrder));

/**
 * Maps API events into react-big-calendar event entries.
 * @param events - Events returned from the API.
 * @returns Calendar event entries.
 */
export const buildEventCalendarEntries = (events: Event[]): CalendarEntry[] =>
  events.map((event) => buildEventEntry(event));

/**
 * Maps task allocations and calendar events into react-big-calendar entries.
 * @param options - Adapter input values.
 * @param options.tasks - Tasks that may contain allocation slots.
 * @param options.events - Events returned from the API.
 * @param options.scheduleOrder - Animation ordering for newly scheduled tasks.
 * @returns Calendar entries suitable for react-big-calendar.
 */
export const buildCalendarEntries = ({
  tasks,
  events,
  scheduleOrder,
}: BuildCalendarEntriesOptions): CalendarEntry[] => [
  ...buildTaskCalendarEntries(tasks, scheduleOrder),
  ...buildEventCalendarEntries(events),
];
