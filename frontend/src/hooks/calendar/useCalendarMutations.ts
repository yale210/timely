import { useCallback, useLayoutEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import moment from "moment";
import type { View } from "react-big-calendar";
import { hasTaskAllocationRescheduleConflict } from "@/utils/apiErrors";
import { calendarMutationHelpers } from "./calendarMutationHelpers";
import * as categoryService from "@/services/categoryService";
import * as eventService from "@/services/eventService";
import * as exportService from "@/services/exportService";
import * as importService from "@/services/importService";
import * as schedulerService from "@/services/schedulerService";
import * as taskService from "@/services/taskService";
import completeSoundUrl from "@/assets/sounds/task-complete.mp3";
import type { Category, Event, EventMutationContext, EventSubmission, Preference, Task, TaskSubmission } from "@/types";

interface UseCalendarMutationsProps {
  selectedItem: Task | Event | undefined;
  date: Date;
  view: View;
  tasks: Task[];
  categories: Category[];
  preference: Preference | null;
  fetchTasks: () => Promise<void>;
  fetchEvents: (view: View, date: Date) => Promise<void>;
  closeSidebar: () => void;
  setCategories: Dispatch<SetStateAction<Category[]>>;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setEvents: Dispatch<SetStateAction<Event[]>>;
  setSelectedItem: Dispatch<SetStateAction<Task | Event | undefined>>;
  setScheduleOrder: Dispatch<SetStateAction<Record<number, number>>>;
  setIsRescheduling: (val: boolean) => void;
  setReschedulingError: (val: string | null) => void;
  setRescheduleWarnings: (val: { taskId: number; title: string; reason: string }[]) => void;
  setIsExporting: (val: boolean) => void;
  setExportingError: (val: string | null) => void;
  setIsImporting: (val: boolean) => void;
  setImportingError: (val: string | null) => void;
}

const useTasksRef = (tasks: Task[]): MutableRefObject<Task[]> => {
  const tasksRef = useRef(tasks);
  useLayoutEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);
  return tasksRef;
};

const useTaskSubmissionMutation = (
  selectedItem: Task | Event | undefined,
  date: Date,
  fetchTasks: UseCalendarMutationsProps["fetchTasks"],
  closeSidebar: UseCalendarMutationsProps["closeSidebar"],
) =>
  useCallback(
    async (data: TaskSubmission) => {
      const selectedTask = calendarMutationHelpers.getSelectedTask(selectedItem);
      try {
        await calendarMutationHelpers.saveTaskSubmission(selectedTask, data, date);
        await fetchTasks();
        closeSidebar();
      } catch (error) {
        if (!selectedTask || !calendarMutationHelpers.hasTaskAllocations(selectedTask) || !hasTaskAllocationRescheduleConflict(error)) {
          console.error(error);
          throw error;
        }
        await calendarMutationHelpers.retryTaskRescheduleSave(selectedTask, data, date);
        await fetchTasks();
        closeSidebar();
      }
    },
    [closeSidebar, date, fetchTasks, selectedItem],
  );

const useEventSubmissionMutation = (
  selectedItem: Task | Event | undefined,
  view: View,
  date: Date,
  fetchEvents: UseCalendarMutationsProps["fetchEvents"],
  closeSidebar: UseCalendarMutationsProps["closeSidebar"],
) =>
  useCallback(
    async (data: EventSubmission, context?: EventMutationContext) => {
      try {
        const selectedEvent = calendarMutationHelpers.getSelectedEvent(selectedItem);
        if (selectedEvent && selectedEvent.id !== 0) {
          await eventService.updateEvent(selectedEvent.id, data, context);
        } else {
          await eventService.createEvent(data);
        }
        await fetchEvents(view, date);
        closeSidebar();
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    [closeSidebar, date, fetchEvents, selectedItem, view],
  );

const useDeleteSelectedMutation = (
  selectedItem: Task | Event | undefined,
  view: View,
  date: Date,
  fetchTasks: UseCalendarMutationsProps["fetchTasks"],
  fetchEvents: UseCalendarMutationsProps["fetchEvents"],
  closeSidebar: UseCalendarMutationsProps["closeSidebar"],
) =>
  useCallback(
    async (context?: EventMutationContext) => {
      try {
        if (!selectedItem?.id) {
          console.error("There is either no item, or its id is not valid.");
          return;
        }
        if ("end_time" in selectedItem) {
          await eventService.deleteEvent(selectedItem.id, context);
          await fetchEvents(view, date);
        } else {
          await taskService.deleteTask(selectedItem.id);
          await fetchTasks();
        }
        closeSidebar();
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    [closeSidebar, date, fetchEvents, fetchTasks, selectedItem, view],
  );

const useRevertSelectedEventMutation = (
  selectedItem: Task | Event | undefined,
  view: View,
  date: Date,
  fetchEvents: UseCalendarMutationsProps["fetchEvents"],
  closeSidebar: UseCalendarMutationsProps["closeSidebar"],
) =>
  useCallback(
    async (context: EventMutationContext) => {
      try {
        const selectedEvent = calendarMutationHelpers.getSelectedEvent(selectedItem);
        if (!selectedEvent || !context.original_start_time) {
          return;
        }
        await eventService.revertEventInstance(selectedEvent.id, context.original_start_time);
        await fetchEvents(view, date);
        closeSidebar();
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    [closeSidebar, date, fetchEvents, selectedItem, view],
  );

const useRescheduleTasksMutation = (
  tasks: Task[],
  preference: Preference | null,
  fetchTasks: UseCalendarMutationsProps["fetchTasks"],
  setScheduleOrder: UseCalendarMutationsProps["setScheduleOrder"],
  setIsRescheduling: UseCalendarMutationsProps["setIsRescheduling"],
  setReschedulingError: UseCalendarMutationsProps["setReschedulingError"],
  setRescheduleWarnings: UseCalendarMutationsProps["setRescheduleWarnings"],
) => {
  const startDate = moment().tz(preference?.timezone ?? moment.tz.guess()).format("YYYY-MM-DD");
  return useCallback(async () => {
    setIsRescheduling(true);
    setReschedulingError(null);
    setRescheduleWarnings([]);
    try {
      const response = await schedulerService.scheduleTasks({ start_date: startDate, allow_split: true, replace_existing: true });
      setScheduleOrder(calendarMutationHelpers.buildScheduleOrder(response.results));
      setRescheduleWarnings(calendarMutationHelpers.buildRescheduleWarnings(response.results, tasks));
      await fetchTasks();
    } catch (error) {
      console.error(error);
      setReschedulingError("Failed to reschedule tasks.");
    } finally {
      setIsRescheduling(false);
    }
  }, [fetchTasks, setIsRescheduling, setRescheduleWarnings, setReschedulingError, setScheduleOrder, startDate, tasks]);
};

const useExportEventsMutation = (
  setIsExporting: UseCalendarMutationsProps["setIsExporting"],
  setExportingError: UseCalendarMutationsProps["setExportingError"],
) =>
  useCallback(async () => {
    setIsExporting(true);
    setExportingError(null);
    try {
      const response = await exportService.exportEvents();
      if (!response) {
        return;
      }
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "events.txt");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
      setExportingError("Failed to export events.");
    } finally {
      setIsExporting(false);
    }
  }, [setExportingError, setIsExporting]);

const useImportEventsMutation = (
  setIsImporting: UseCalendarMutationsProps["setIsImporting"],
  setImportingError: UseCalendarMutationsProps["setImportingError"],
) =>
  useCallback(async (file: File) => {
    setIsImporting(true);
    setImportingError(null);
    try {
      await importService.importEvents(file);
      importService.pageReloader.reload();
    } catch (error) {
      console.error(error);
      setImportingError("Failed to import events.");
    } finally {
      setIsImporting(false);
    }
  }, [setImportingError, setIsImporting]);

const useCreateCategoryMutation = (setCategories: UseCalendarMutationsProps["setCategories"]) =>
  useCallback(async (text: string): Promise<Category> => {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error("Category name cannot be empty.");
    }
    const created = await categoryService.createCategory(trimmed);
    setCategories((previous) => {
      const next = previous.some((category) => category.id === created.id) ? previous : [...previous, created];
      return [...next].sort((left, right) => left.text.localeCompare(right.text));
    });
    return created;
  }, [setCategories]);

const useCategorySyncMutations = (
  setCategories: UseCalendarMutationsProps["setCategories"],
  setTasks: UseCalendarMutationsProps["setTasks"],
  setEvents: UseCalendarMutationsProps["setEvents"],
) => {
  const updateCategory = useCallback(async (id: number, patch: { colour?: string | null; colour_override?: boolean }) => {
    const updated = await categoryService.updateCategory(id, patch);
    setCategories((previous) => previous.map((category) => (category.id === id ? { ...category, ...updated } : category)));
    setTasks((previous) => calendarMutationHelpers.updateCategoriesInItems(previous, id, updated));
    setEvents((previous) => calendarMutationHelpers.updateCategoriesInItems(previous, id, updated));
    return updated;
  }, [setCategories, setEvents, setTasks]);
  const deleteCategory = useCallback(async (id: number): Promise<void> => {
    await categoryService.deleteCategory(id);
    setCategories((previous) => previous.filter((category) => category.id !== id));
    setTasks((previous) => calendarMutationHelpers.removeCategoryFromItems(previous, id));
    setEvents((previous) => calendarMutationHelpers.removeCategoryFromItems(previous, id));
  }, [setCategories, setEvents, setTasks]);

  return { updateCategory, deleteCategory };
};

const useUpdateTaskCategoriesMutation = (
  categories: Category[],
  fetchTasks: UseCalendarMutationsProps["fetchTasks"],
  setTasks: UseCalendarMutationsProps["setTasks"],
  setSelectedItem: UseCalendarMutationsProps["setSelectedItem"],
) =>
  useCallback(async (id: number, nextCategoryIds: number[]): Promise<void> => {
    const nextCategories = categories.filter((category) => nextCategoryIds.includes(category.id));
    setTasks((previous) => previous.map((task) => (task.id === id ? { ...task, categories: nextCategories } : task)));
    setSelectedItem((previous) => (!previous || !("deadline" in previous) || previous.id !== id ? previous : { ...previous, categories: nextCategories }));
    try {
      await taskService.updateTask(id, { categories: nextCategoryIds });
    } catch (updateError) {
      console.error(updateError);
      await fetchTasks();
    }
  }, [categories, fetchTasks, setSelectedItem, setTasks]);

const useToggleTaskCompleteMutation = (
  tasksRef: MutableRefObject<Task[]>,
  preference: Preference | null,
  fetchTasks: UseCalendarMutationsProps["fetchTasks"],
) => {
  const completeSoundRef = useRef<HTMLAudioElement | null>(typeof Audio === "undefined" ? null : new Audio(completeSoundUrl));
  return useCallback(async (taskId: number) => {
    const task = tasksRef.current.find((entry) => entry.id === taskId);
    if (!task) {
      return;
    }
    try {
      if (!task.completed && completeSoundRef.current && !calendarMutationHelpers.isSoundEffectsDisabled(preference)) {
        completeSoundRef.current.currentTime = 0;
        void completeSoundRef.current.play().catch(() => undefined);
      }
      await taskService.updateTask(taskId, calendarMutationHelpers.getTaskCompletionPatch(task));
      await fetchTasks();
    } catch (error) {
      console.error(error);
    }
  }, [fetchTasks, preference, tasksRef]);
};

/**
 * Provides task, event, category, import, export, and reschedule mutations.
 * @param props - Mutation dependencies and state setters.
 * @returns Calendar mutation handlers.
 */
export const useCalendarMutations = (props: UseCalendarMutationsProps) => {
  const tasksRef = useTasksRef(props.tasks);
  const submitTask = useTaskSubmissionMutation(props.selectedItem, props.date, props.fetchTasks, props.closeSidebar);
  const submitEvent = useEventSubmissionMutation(props.selectedItem, props.view, props.date, props.fetchEvents, props.closeSidebar);
  const deleteSelected = useDeleteSelectedMutation(props.selectedItem, props.view, props.date, props.fetchTasks, props.fetchEvents, props.closeSidebar);
  const revertSelectedEvent = useRevertSelectedEventMutation(props.selectedItem, props.view, props.date, props.fetchEvents, props.closeSidebar);
  const rescheduleTasks = useRescheduleTasksMutation(props.tasks, props.preference, props.fetchTasks, props.setScheduleOrder, props.setIsRescheduling, props.setReschedulingError, props.setRescheduleWarnings);
  const exportEvents = useExportEventsMutation(props.setIsExporting, props.setExportingError);
  const importEvents = useImportEventsMutation(props.setIsImporting, props.setImportingError);
  const createCategory = useCreateCategoryMutation(props.setCategories);
  const categorySyncMutations = useCategorySyncMutations(props.setCategories, props.setTasks, props.setEvents);
  const updateTaskCategories = useUpdateTaskCategoriesMutation(props.categories, props.fetchTasks, props.setTasks, props.setSelectedItem);
  const handleToggleTaskComplete = useToggleTaskCompleteMutation(tasksRef, props.preference, props.fetchTasks);

  return {
    submitTask,
    submitEvent,
    deleteSelected,
    revertSelectedEvent,
    rescheduleTasks,
    exportEvents,
    importEvents,
    createCategory,
    ...categorySyncMutations,
    updateTaskCategories,
    handleToggleTaskComplete,
  };
};
