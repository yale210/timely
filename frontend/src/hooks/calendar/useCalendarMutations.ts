import { useCallback, useRef, type Dispatch, type SetStateAction } from "react";
import moment from "moment";
import type { View } from "react-big-calendar";
import { hasTaskAllocationRescheduleConflict } from "@/utils/apiErrors";
import * as eventService from "@/services/eventService";
import * as taskService from "@/services/taskService";
import * as categoryService from "@/services/categoryService";
import * as schedulerService from "@/services/schedulerService";
import * as exportService from "@/services/exportService";
import * as importService from "@/services/importService";
import completeSoundUrl from "@/assets/sounds/task-complete.mp3";
import type {
  Category,
  Event,
  EventMutationContext,
  EventSubmission,
  Preference,
  Task,
  TaskSubmission,
} from "@/types";

// We define exactly what this hook needs to function:
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
  setCategories:Dispatch<SetStateAction<Category[]>>;
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

/**
 * Provides task, event, category, import, export, and reschedule mutations.
 * @param props - Mutation dependencies and state setters.
 * @returns Calendar mutation handlers.
 */
export const useCalendarMutations = (props: UseCalendarMutationsProps) => {
  const {
    selectedItem,
    date,
    view,
    tasks,
    categories,
    preference,
    fetchTasks,
    fetchEvents,
    closeSidebar,
    setCategories,
    setTasks,
    setEvents,
    setSelectedItem,
    setScheduleOrder,
    setIsRescheduling,
    setReschedulingError,
    setRescheduleWarnings,
    setIsExporting,
    setExportingError,
    setIsImporting,
    setImportingError,
  } = props;

  const completeSoundRef = useRef<HTMLAudioElement | null>(
    typeof Audio === "undefined" ? null : new Audio(completeSoundUrl),
  );

  // Ref so handleToggleTaskComplete doesn't need `tasks` as a dep (which would
  // cause it to recreate on every data update and cascade re-renders downstream).
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const activeTimezone = preference?.timezone ?? moment.tz.guess();
  const todayStartDate = moment().tz(activeTimezone).format("YYYY-MM-DD");

  const submitTask = useCallback(
    async (data: TaskSubmission) => {
      try {
        if (selectedItem && "deadline" in selectedItem && selectedItem.id !== 0) {
          const bufferBeforeChanged = typeof data.buffer_before_minutes === "number" && data.buffer_before_minutes !== (selectedItem.buffer_before_minutes ?? 0);
          const bufferAfterChanged = typeof data.buffer_after_minutes === "number" && data.buffer_after_minutes !== (selectedItem.buffer_after_minutes ?? 0);
          const completedMinutesChanged = typeof data.completed_minutes === "number" && data.completed_minutes !== (selectedItem.completed_minutes ?? 0);
          
          if (bufferBeforeChanged || bufferAfterChanged || completedMinutesChanged) {
            await taskService.saveAndRescheduleTask(selectedItem.id, data, moment(date).format("YYYY-MM-DD"));
          } else {
            await taskService.updateTask(selectedItem.id, data);
          }
        } else {
          await taskService.createTask(data);
        }
        await fetchTasks();
        closeSidebar();
      } catch (error) {
        if (selectedItem && "deadline" in selectedItem && selectedItem.id !== 0 && (selectedItem.allocation?.length ?? 0) > 0 && hasTaskAllocationRescheduleConflict(error)) {
          await taskService.saveAndRescheduleTask(selectedItem.id, data, moment(date).format("YYYY-MM-DD"));
          await fetchTasks();
          closeSidebar();
          return;
        }
        console.error(error);
        throw error;
      }
    },
    [closeSidebar, date, fetchTasks, selectedItem],
  );

  const submitEvent = useCallback(
    async (data: EventSubmission, context?: EventMutationContext) => {
      try {
        if (selectedItem && "end_time" in selectedItem && selectedItem.id !== 0) {
          await eventService.updateEvent(selectedItem.id, data, context);
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

  const deleteSelected = useCallback(
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

  const revertSelectedEvent = useCallback(
    async (context: EventMutationContext) => {
      try {
        if (!selectedItem || !("end_time" in selectedItem) || !context.original_start_time) return;

        await eventService.revertEventInstance(selectedItem.id, context.original_start_time);
        await fetchEvents(view, date);
        closeSidebar();
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    [closeSidebar, date, fetchEvents, selectedItem, view],
  );

  const rescheduleTasks = useCallback(async () => {
    setIsRescheduling(true);
    setReschedulingError(null);
    setRescheduleWarnings([]);

    try {
      const response = await schedulerService.scheduleTasks({
        start_date: todayStartDate,
        allow_split: true,
        replace_existing: true,
      });
      
      const nextOrder: Record<number, number> = {};
      response.results
        .filter((result) => result.success && result.scheduled_start && result.scheduled_end)
        .forEach((result, index) => { nextOrder[result.task_id] = index; });
        
      setScheduleOrder(nextOrder);
      setRescheduleWarnings(
        response.results.filter((result) => !result.success).map((result) => {
          const matchingTask = tasks.find((t) => t.id === result.task_id);
          return {
            taskId: result.task_id,
            title: matchingTask?.title ?? `Task #${result.task_id}`,
            reason: result.reason ?? "The scheduler could not find enough time before the deadline.",
          };
        }),
      );
      await fetchTasks();
    } catch (error) {
      console.error(error);
      setReschedulingError("Failed to reschedule tasks.");
    } finally {
      setIsRescheduling(false);
    }
  }, [fetchTasks, tasks, todayStartDate, setIsRescheduling, setReschedulingError, setRescheduleWarnings, setScheduleOrder]);

  const exportEvents = useCallback(async () => {
    setIsExporting(true);
    setExportingError(null);

    try {
      const response = await exportService.exportEvents();
      if (response) {
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "events.txt");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error(error);
      setExportingError("Failed to export events.");
    } finally {
      setIsExporting(false);
    }
  }, [setIsExporting, setExportingError]);

  const importEvents = useCallback(async (file: File) => {
    setIsImporting(true);
    setImportingError(null);

    try {
      await importService.importEvents(file);
    } catch (error) {
      console.error(error);
      setImportingError("Failed to import events.");
    } finally {
      setIsImporting(false);
    }
  }, [setIsImporting, setImportingError]);

  const createCategory = useCallback(async (text: string): Promise<Category> => {
    const trimmed = text.trim();
    if (!trimmed) throw new Error("Category name cannot be empty.");
    
    const created = await categoryService.createCategory(trimmed);
    setCategories((prev) => {
      const exists = prev.some((category) => category.id === created.id);
      const next = exists ? prev : [...prev, created];
      return [...next].sort((a, b) => a.text.localeCompare(b.text));
    });
    return created;
  }, [setCategories]);

  const updateCategory = useCallback(
    async (id: number, patch: { colour?: string | null; colour_override?: boolean }) => {
      const updated = await categoryService.updateCategory(id, patch);
      setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
      setTasks((prev) => prev.map((t) => ({ ...t, categories: t.categories.map((c) => c.id === id ? { ...c, ...updated } : c) })));
      setEvents((prev) => prev.map((e) => ({ ...e, categories: e.categories.map((c) => c.id === id ? { ...c, ...updated } : c) })));
      return updated;
    },
    [setCategories, setTasks, setEvents],
  );

  const deleteCategory = useCallback(async (id: number): Promise<void> => {
    await categoryService.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setTasks((prev) => prev.map((t) => ({ ...t, categories: t.categories.filter((c) => c.id !== id) })));
    setEvents((prev) => prev.map((e) => ({ ...e, categories: e.categories.filter((c) => c.id !== id) })));
  }, [setCategories, setTasks, setEvents]);

  const updateTaskCategories = useCallback(
    async (id: number, nextCategoryIds: number[]): Promise<void> => {
      const nextCategoryObjects = categories.filter((c) => nextCategoryIds.includes(c.id));
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, categories: nextCategoryObjects } : t));
      setSelectedItem((prev) => {
        if (!prev || !("deadline" in prev) || prev.id !== id) return prev;
        return { ...prev, categories: nextCategoryObjects };
      });
      try {
        await taskService.updateTask(id, { categories: nextCategoryIds });
      } catch (updateError) {
        console.error(updateError);
        await fetchTasks();
      }
    },
    [categories, fetchTasks, setTasks, setSelectedItem],
  );

  const handleToggleTaskComplete = useCallback(
    async (taskId: number) => {
      const task = tasksRef.current.find((entry) => entry.id === taskId);
      if (!task) return;

      const isSoundDisabled = preference?.disable_sound_effects ?? (typeof window !== "undefined" && localStorage.getItem("disable_sound_effects") === "true");

      try {
        if (!task.completed && completeSoundRef.current && !isSoundDisabled) {
          completeSoundRef.current.currentTime = 0;
          void completeSoundRef.current.play().catch(() => undefined);
        }
        const nextCompleted = !task.completed;
        await taskService.updateTask(taskId, {
          completed: nextCompleted,
          completed_minutes: nextCompleted ? task.estimated_minutes : 0,
        });
        await fetchTasks();
      } catch (error) {
        console.error(error);
      }
    },
    [fetchTasks, preference?.disable_sound_effects],
  );

  return {
    submitTask,
    submitEvent,
    deleteSelected,
    revertSelectedEvent,
    rescheduleTasks,
    exportEvents,
    importEvents,
    createCategory,
    updateCategory,
    deleteCategory,
    updateTaskCategories,
    handleToggleTaskComplete
  };
};
