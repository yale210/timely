import { useCallback } from "react";
import type { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop";
import { normalizeInteractionStart, normalizeInteractionEnd } from "./calendarTypes";
import * as taskService from "@/services/taskService";
import * as eventService from "@/services/eventService";
import type { CalendarEntry } from "@/utils/calendarAdapter";
import type { Event, EventMutationContext, Task } from "@/types";
import type { View } from "react-big-calendar";

interface UseCalendarInteractionsProps {
  tasks: Task[];
  events: Event[];
  isSidebarOpen: boolean;
  scheduleOrder: Record<number, number>;
  view: View;
  date: Date;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  setIsSidebarOpen: (val: boolean) => void;
  setSidebarMode: (val: "task" | "event") => void;
  setSelectedItem: React.Dispatch<React.SetStateAction<Task | Event | undefined>>;
  setScheduleOrder: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  fetchTasks: () => Promise<void>;
  fetchEvents: (view: View, date: Date) => Promise<void>;
}

export const useCalendarInteractions = ({
  tasks,
  events,
  isSidebarOpen,
  scheduleOrder,
  view,
  date,
  setTasks,
  setEvents,
  setIsSidebarOpen,
  setSidebarMode,
  setSelectedItem,
  setScheduleOrder,
  fetchTasks,
  fetchEvents,
}: UseCalendarInteractionsProps) => {

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
    setSelectedItem(undefined);
    setSidebarMode("event");
  }, [setIsSidebarOpen, setSelectedItem, setSidebarMode]);

  const selectSlot = useCallback(
    (slot: { start: Date; end?: Date; slots?: Date[]; action?: "select" | "click" | "doubleClick" }) => {
      if (isSidebarOpen && slot.action !== "select") return;
      if (!slot.start) return;

      const slotStart = slot.slots && slot.slots.length > 0 ? slot.slots[0] : slot.start;
      let slotEnd = slot.end ?? slotStart;
      if (slot.slots && slot.slots.length > 0) {
        slotEnd = slot.slots[slot.slots.length - 1];
      }
      if (slotEnd <= slotStart) {
        slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
      }
      
      setSidebarMode("event");
      setSelectedItem({
        id: 0,
        title: "",
        description: "",
        start_time: slotStart.toISOString(),
        end_time: slotEnd.toISOString(),
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
      setIsSidebarOpen(true);
    },
    [isSidebarOpen, setSidebarMode, setSelectedItem, setIsSidebarOpen],
  );

  const selectEntry = useCallback(
    (entry: CalendarEntry) => {
      if (entry.kind === "task") {
        const task = entry.taskData ?? tasks.find((item) => item.id === entry.sourceId);
        if (task) {
          setSidebarMode("task");
          setSelectedItem(task);
          setIsSidebarOpen(true);
        }
        return;
      }

      if (entry.eventData) {
        setSidebarMode("event");
        setSelectedItem(entry.eventData);
        setIsSidebarOpen(true);
      }
    },
    [tasks, setSidebarMode, setSelectedItem, setIsSidebarOpen],
  );

  const updateTaskAllocation = useCallback(
    async (entry: CalendarEntry, start: Date, end: Date) => {
      if (typeof entry.allocationIndex !== "number") return;
      
      const task = tasks.find((item) => item.id === entry.sourceId);
      if (!task) return;
      
      setScheduleOrder((prev) => {
        if (!Object.prototype.hasOwnProperty.call(prev, task.id)) return prev;
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
      
      const nextAllocations = [...(task.allocation ?? [])];
      nextAllocations[entry.allocationIndex] = {
        start: start.toISOString(),
        end: end.toISOString(),
      };

      setTasks((prev) =>
        prev.map((item) => (item.id === task.id ? { ...item, allocation: nextAllocations } : item)),
      );

      try {
        await taskService.updateTask(task.id, { allocation: nextAllocations });
      } catch (updateError) {
        console.error(updateError);
        await fetchTasks();
      }
    },
    [fetchTasks, tasks, setScheduleOrder, setTasks],
  );

  const updateCalendarEvent = useCallback(
    async (entry: CalendarEntry, start: Date, end: Date) => {
      const eventData = entry.eventData ?? events.find(
        (item) => item.id === entry.sourceId && item.start_time === entry.start.toISOString(),
      );

      if (!eventData) return;

      const payload: Pick<Event, "start_time" | "end_time"> = {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
      };

      const context: EventMutationContext | undefined = eventData.recurrence_interval
        ? { scope: "this", original_start_time: eventData.original_start_time ?? eventData.start_time }
        : undefined;

      setEvents((prev) =>
        prev.map((item) => {
          const isRecurringInstance =
            Boolean(eventData.instance_id) &&
            item.instance_id === eventData.instance_id &&
            item.original_start_time === eventData.original_start_time;
          const isSingleEvent =
            !eventData.instance_id &&
            item.id === eventData.id &&
            item.start_time === eventData.start_time;

          return isRecurringInstance || isSingleEvent ? { ...item, ...payload } : item;
        }),
      );

      try {
        await eventService.updateEvent(eventData.id, payload, context);
        await fetchEvents(view, date);
      } catch (updateError) {
        console.error(updateError);
        await fetchEvents(view, date);
      }
    },
    [date, events, fetchEvents, view, setEvents],
  );

  const handleEventDrop = useCallback(
    async ({ event, start, end }: EventInteractionArgs<CalendarEntry>) => {
      if (Object.keys(scheduleOrder).length > 0) {
        setScheduleOrder({});
      }
      const nextStart = normalizeInteractionStart(new Date(start));
      const nextEnd = normalizeInteractionEnd(new Date(end));
      if (event.kind === "task") {
        await updateTaskAllocation(event, nextStart, nextEnd);
        return;
      }
      await updateCalendarEvent(event, nextStart, nextEnd);
    },
    [scheduleOrder, updateCalendarEvent, updateTaskAllocation, setScheduleOrder],
  );

  const handleEventResize = useCallback(
    async ({ event, start, end }: EventInteractionArgs<CalendarEntry>) => {
      if (Object.keys(scheduleOrder).length > 0) {
        setScheduleOrder({});
      }
      const nextStart = normalizeInteractionStart(new Date(start));
      const nextEnd = normalizeInteractionEnd(new Date(end));
      if (event.kind === "task") {
        await updateTaskAllocation(event, nextStart, nextEnd);
        return;
      }
      await updateCalendarEvent(event, nextStart, nextEnd);
    },
    [scheduleOrder, updateCalendarEvent, updateTaskAllocation, setScheduleOrder],
  );

  return {
    selectSlot,
    selectEntry,
    closeSidebar,
    handleEventDrop,
    handleEventResize,
  };
};