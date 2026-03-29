import { useCallback, useLayoutEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { View } from "react-big-calendar";
import type { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop";
import { normalizeInteractionEnd, normalizeInteractionStart } from "./calendarTypes";
import * as eventService from "@/services/eventService";
import * as taskService from "@/services/taskService";
import type { CalendarEntry } from "@/utils/calendarAdapter";
import { fromCalendarDisplayDate } from "@/utils/calendarDisplayTime";
import { getStoredUserTimezone } from "@/utils/userTimezone";
import type { Event, EventMutationContext, Preference, Task } from "@/types";

interface UseCalendarInteractionsProps {
  tasks: Task[];
  events: Event[];
  isSidebarOpen: boolean;
  scheduleOrder: Record<number, number>;
  preference: Preference | null;
  view: View;
  date: Date;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setEvents: Dispatch<SetStateAction<Event[]>>;
  setIsSidebarOpen: (val: boolean) => void;
  setSidebarMode: (val: "task" | "event") => void;
  setSelectedItem: Dispatch<SetStateAction<Task | Event | undefined>>;
  setScheduleOrder: Dispatch<SetStateAction<Record<number, number>>>;
  fetchTasks: () => Promise<void>;
  fetchEvents: (view: View, date: Date) => Promise<void>;
}

interface CalendarSelectionSlot {
  start: Date;
  end?: Date;
  slots?: Date[];
  action?: "select" | "click" | "doubleClick";
}

interface InteractionStateSnapshot {
  isSidebarOpen: boolean;
  tasks: Task[];
  events: Event[];
  view: View;
  date: Date;
  scheduleOrder: Record<number, number>;
}

const createDraftEvent = (start: Date, end: Date): Event => ({
  id: 0,
  title: "",
  description: "",
  start_time: start.toISOString(),
  end_time: end.toISOString(),
  location: "",
  recurrence_interval: null,
  recurrence_end: null,
  reminders: [],
  is_override: false,
  is_split_series: false,
  source_event_id: undefined,
  split_from_event_id: null,
  original_start_time: null,
  categories: [],
});

const getSlotRange = (
  slot: CalendarSelectionSlot,
  activeTimezone: string,
): { start: Date; end: Date } => {
  const displayStart = slot.slots?.[0] ?? slot.start;
  const selectedDisplayEnd = slot.slots?.at(-1) ?? slot.end ?? displayStart;
  const normalizedDisplayEnd = selectedDisplayEnd > displayStart
    ? selectedDisplayEnd
    : new Date(displayStart.getTime() + 60 * 60 * 1000);

  return {
    start: fromCalendarDisplayDate(displayStart, activeTimezone),
    end: fromCalendarDisplayDate(normalizedDisplayEnd, activeTimezone),
  };
};

const clearScheduleOrderIfNeeded = (
  scheduleOrder: Record<number, number>,
  setScheduleOrder: Dispatch<SetStateAction<Record<number, number>>>,
) => {
  if (Object.keys(scheduleOrder).length > 0) {
    setScheduleOrder({});
  }
};

const clearTaskScheduleAnimation = (
  taskId: number,
  setScheduleOrder: Dispatch<SetStateAction<Record<number, number>>>,
) => {
  setScheduleOrder((previous) => {
    if (!Object.prototype.hasOwnProperty.call(previous, taskId)) {
      return previous;
    }
    const next = { ...previous };
    delete next[taskId];
    return next;
  });
};

const findTaskByEntry = (tasks: Task[], entry: CalendarEntry): Task | undefined =>
  tasks.find((item) => item.id === entry.sourceId);

const findEventByEntry = (events: Event[], entry: CalendarEntry): Event | undefined =>
  entry.eventData
  ?? events.find((item) => item.id === entry.sourceId && item.start_time === entry.eventData?.start_time);

const buildEventMutationContext = (eventData: Event): EventMutationContext | undefined =>
  eventData.recurrence_interval
    ? { scope: "this", original_start_time: eventData.original_start_time ?? eventData.start_time }
    : undefined;

const buildEventTimePatch = (start: Date, end: Date): Pick<Event, "start_time" | "end_time"> => ({
  start_time: start.toISOString(),
  end_time: end.toISOString(),
});

const replaceTaskAllocationSlot = (
  task: Task,
  allocationIndex: number,
  start: Date,
  end: Date,
): { start: string; end: string }[] => {
  const nextAllocations = [...(task.allocation ?? [])];
  nextAllocations[allocationIndex] = { start: start.toISOString(), end: end.toISOString() };
  return nextAllocations;
};

const updateOptimisticEvents = (
  previous: Event[],
  eventData: Event,
  payload: Pick<Event, "start_time" | "end_time">,
): Event[] =>
  previous.map((item) => {
    const isRecurringInstance = Boolean(eventData.instance_id)
      && item.instance_id === eventData.instance_id
      && item.original_start_time === eventData.original_start_time;
    const isSingleEvent = !eventData.instance_id && item.id === eventData.id && item.start_time === eventData.start_time;
    return isRecurringInstance || isSingleEvent ? { ...item, ...payload } : item;
  });

export const buildDraftCalendarEvent = (
  slot: CalendarSelectionSlot,
  activeTimezone = getStoredUserTimezone(),
): Event => {
  const range = getSlotRange(slot, activeTimezone);
  return createDraftEvent(range.start, range.end);
};

const useInteractionStateRef = ({
  isSidebarOpen,
  tasks,
  events,
  view,
  date,
  scheduleOrder,
}: Pick<UseCalendarInteractionsProps, "isSidebarOpen" | "tasks" | "events" | "view" | "date" | "scheduleOrder">) => {
  const stateRef = useRef<InteractionStateSnapshot>({ isSidebarOpen, tasks, events, view, date, scheduleOrder });
  useLayoutEffect(() => {
    stateRef.current = { isSidebarOpen, tasks, events, view, date, scheduleOrder };
  }, [date, events, isSidebarOpen, scheduleOrder, tasks, view]);
  return stateRef;
};

const useCloseSidebarAction = (
  setIsSidebarOpen: UseCalendarInteractionsProps["setIsSidebarOpen"],
  setSelectedItem: UseCalendarInteractionsProps["setSelectedItem"],
  setSidebarMode: UseCalendarInteractionsProps["setSidebarMode"],
) =>
  useCallback(() => {
    setIsSidebarOpen(false);
    setSelectedItem(undefined);
    setSidebarMode("event");
  }, [setIsSidebarOpen, setSelectedItem, setSidebarMode]);

const useSlotSelectionAction = (
  stateRef: MutableRefObject<InteractionStateSnapshot>,
  setSidebarMode: UseCalendarInteractionsProps["setSidebarMode"],
  setSelectedItem: UseCalendarInteractionsProps["setSelectedItem"],
  setIsSidebarOpen: UseCalendarInteractionsProps["setIsSidebarOpen"],
  activeTimezone: string,
) =>
  useCallback(
    (slot: CalendarSelectionSlot) => {
      if (stateRef.current.isSidebarOpen && slot.action !== "select") {
        return;
      }
      setSidebarMode("event");
      setSelectedItem(buildDraftCalendarEvent(slot, activeTimezone));
      setIsSidebarOpen(true);
    },
    [activeTimezone, setIsSidebarOpen, setSelectedItem, setSidebarMode, stateRef],
  );

const useEntrySelectionAction = (
  stateRef: MutableRefObject<InteractionStateSnapshot>,
  setSidebarMode: UseCalendarInteractionsProps["setSidebarMode"],
  setSelectedItem: UseCalendarInteractionsProps["setSelectedItem"],
  setIsSidebarOpen: UseCalendarInteractionsProps["setIsSidebarOpen"],
) =>
  useCallback(
    (entry: CalendarEntry) => {
      const selected = entry.kind === "task"
        ? entry.taskData ?? findTaskByEntry(stateRef.current.tasks, entry)
        : findEventByEntry(stateRef.current.events, entry);
      if (!selected) {
        return;
      }
      setSidebarMode(entry.kind);
      setSelectedItem(selected);
      setIsSidebarOpen(true);
    },
    [setIsSidebarOpen, setSelectedItem, setSidebarMode, stateRef],
  );

const useCreateSidebarAction = (
  setSidebarMode: UseCalendarInteractionsProps["setSidebarMode"],
  setSelectedItem: UseCalendarInteractionsProps["setSelectedItem"],
  setIsSidebarOpen: UseCalendarInteractionsProps["setIsSidebarOpen"],
) =>
  useCallback(() => {
    const now = normalizeInteractionStart(new Date());
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    setSidebarMode("event");
    setSelectedItem(createDraftEvent(now, end));
    setIsSidebarOpen(true);
  }, [setIsSidebarOpen, setSelectedItem, setSidebarMode]);

const useTaskAllocationUpdater = (
  stateRef: MutableRefObject<InteractionStateSnapshot>,
  setScheduleOrder: UseCalendarInteractionsProps["setScheduleOrder"],
  setTasks: UseCalendarInteractionsProps["setTasks"],
  fetchTasks: UseCalendarInteractionsProps["fetchTasks"],
  activeTimezone: string,
) =>
  useCallback(
    async (entry: CalendarEntry, start: Date, end: Date) => {
      if (typeof entry.allocationIndex !== "number") {
        return;
      }
      const task = findTaskByEntry(stateRef.current.tasks, entry);
      if (!task) {
        return;
      }
      clearTaskScheduleAnimation(task.id, setScheduleOrder);
      const actualStart = fromCalendarDisplayDate(start, activeTimezone);
      const actualEnd = fromCalendarDisplayDate(end, activeTimezone);
      const nextAllocations = replaceTaskAllocationSlot(task, entry.allocationIndex, actualStart, actualEnd);
      setTasks((previous) => previous.map((item) => (item.id === task.id ? { ...item, allocation: nextAllocations } : item)));
      try {
        await taskService.updateTask(task.id, { allocation: nextAllocations });
      } catch (updateError) {
        console.error(updateError);
        await fetchTasks();
      }
    },
    [activeTimezone, fetchTasks, setScheduleOrder, setTasks, stateRef],
  );

const useCalendarEventUpdater = (
  stateRef: MutableRefObject<InteractionStateSnapshot>,
  setEvents: UseCalendarInteractionsProps["setEvents"],
  fetchEvents: UseCalendarInteractionsProps["fetchEvents"],
  activeTimezone: string,
) =>
  useCallback(
    async (entry: CalendarEntry, start: Date, end: Date) => {
      const eventData = findEventByEntry(stateRef.current.events, entry);
      if (!eventData) {
        return;
      }
      const actualStart = fromCalendarDisplayDate(start, activeTimezone);
      const actualEnd = fromCalendarDisplayDate(end, activeTimezone);
      const payload = buildEventTimePatch(actualStart, actualEnd);
      setEvents((previous) => updateOptimisticEvents(previous, eventData, payload));
      try {
        await eventService.updateEvent(eventData.id, payload, buildEventMutationContext(eventData));
      } catch (updateError) {
        console.error(updateError);
      }
      await fetchEvents(stateRef.current.view, stateRef.current.date);
    },
    [activeTimezone, fetchEvents, setEvents, stateRef],
  );

const useCalendarEntryInteractionHandler = (
  stateRef: MutableRefObject<InteractionStateSnapshot>,
  setScheduleOrder: UseCalendarInteractionsProps["setScheduleOrder"],
  updateTaskAllocation: (entry: CalendarEntry, start: Date, end: Date) => Promise<void>,
  updateCalendarEvent: (entry: CalendarEntry, start: Date, end: Date) => Promise<void>,
) =>
  useCallback(
    async ({ event, start, end }: EventInteractionArgs<CalendarEntry>) => {
      clearScheduleOrderIfNeeded(stateRef.current.scheduleOrder, setScheduleOrder);
      const nextStart = normalizeInteractionStart(new Date(start));
      const nextEnd = normalizeInteractionEnd(new Date(end));
      if (event.kind === "task") {
        await updateTaskAllocation(event, nextStart, nextEnd);
        return;
      }
      await updateCalendarEvent(event, nextStart, nextEnd);
    },
    [setScheduleOrder, stateRef, updateCalendarEvent, updateTaskAllocation],
  );

export const useCalendarInteractions = (props: UseCalendarInteractionsProps) => {
  const activeTimezone = props.preference?.timezone ?? getStoredUserTimezone();
  const stateRef = useInteractionStateRef(props);
  const closeSidebar = useCloseSidebarAction(props.setIsSidebarOpen, props.setSelectedItem, props.setSidebarMode);
  const selectSlot = useSlotSelectionAction(stateRef, props.setSidebarMode, props.setSelectedItem, props.setIsSidebarOpen, activeTimezone);
  const selectEntry = useEntrySelectionAction(stateRef, props.setSidebarMode, props.setSelectedItem, props.setIsSidebarOpen);
  const openCreateSidebar = useCreateSidebarAction(props.setSidebarMode, props.setSelectedItem, props.setIsSidebarOpen);
  const updateTaskAllocation = useTaskAllocationUpdater(
    stateRef,
    props.setScheduleOrder,
    props.setTasks,
    props.fetchTasks,
    activeTimezone,
  );
  const updateCalendarEvent = useCalendarEventUpdater(
    stateRef,
    props.setEvents,
    props.fetchEvents,
    activeTimezone,
  );
  const handleEntryInteraction = useCalendarEntryInteractionHandler(
    stateRef,
    props.setScheduleOrder,
    updateTaskAllocation,
    updateCalendarEvent,
  );

  return {
    selectSlot,
    selectEntry,
    openCreateSidebar,
    closeSidebar,
    handleEventDrop: handleEntryInteraction,
    handleEventResize: handleEntryInteraction,
  };
};
