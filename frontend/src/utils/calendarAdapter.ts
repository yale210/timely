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
  ...tasks.flatMap((task) => {
    const allocations = task.allocation ?? [];
    if (allocations.length === 0) {
      return [];
    }

    return allocations.map((slot, index) => ({
      id: `task-${task.id}-${index}`,
      title: task.title,
      start: new Date(slot.start),
      end: getRenderableEnd(slot.start, slot.end),
      actualEnd: new Date(slot.end),
      allDay: moment(slot.end).diff(moment(slot.start), "hours") >= 24,
      kind: "task" as const,
      sourceId: task.id,
      taskData: task,
      split: allocations.length > 1,
      oneGo: allocations.length === 1,
      scheduleIndex: scheduleOrder[task.id],
      categories: task.categories,
      allocationIndex: index,
    }));
  }),
  ...events.map((event) => ({
    id: event.instance_id ?? `event-${event.id}-${event.start_time}`,
    title: event.title,
    start: new Date(event.start_time),
    end: getRenderableEnd(event.start_time, event.end_time),
    actualEnd: new Date(event.end_time),
    allDay: false,
    kind: "event" as const,
    sourceId: event.id,
    oneGo: true,
    eventData: event,
  })),
];
