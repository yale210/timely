import { useState, useCallback, useEffect, useRef } from "react";
import type { View } from "react-big-calendar";
import { getCalendarWindow } from "./calendarTypes";
import * as eventService from "@/services/eventService";
import * as taskService from "@/services/taskService";
import { preferenceService } from "@/services/preferenceService";
import type { Category, Event, Preference, Task } from "@/types";

export const useCalendarData = (view: View, date: Date) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [preference, setPreference] = useState<Preference | null>(null);

  const [isInitializing, setIsInitializing] = useState(true);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [isEventsLoading, setIsEventsLoading] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [taskError, setTaskError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);
  const [reschedulingError, setReschedulingError] = useState<string | null>(null);
  const [exportingError, setExportingError] = useState<string | null>(null);
  const [importingError, setImportingError] = useState<string | null>(null);

  const [rescheduleWarnings, setRescheduleWarnings] = useState<
    { taskId: number; title: string; reason: string }[]
  >([]);

  const hasInitialized = useRef(false);

  const fetchTasks = useCallback(async () => {
    setIsTasksLoading(true);
    try {
      const nextTasks = await taskService.getTasks();
      setTasks(nextTasks);
      setTaskError(null);
    } catch (error) {
      console.error(error);
      setTasks([]);
      setTaskError("Failed to load calendar tasks.");
    } finally {
      setIsTasksLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setIsCategoriesLoading(true);
    try {
      const nextCategories = await taskService.getCategories();
      setCategories(nextCategories);
      setCategoryError(null);
    } catch (error) {
      console.error(error);
      setCategories([]);
      setCategoryError("Failed to load categories.");
    } finally {
      setIsCategoriesLoading(false);
    }
  }, []);

  const fetchEvents = useCallback(async (activeView: View, activeDate: Date) => {
    setIsEventsLoading(true);
    try {
      const nextEvents = await eventService.getEvents(getCalendarWindow(activeView, activeDate, preference));
      setEvents(nextEvents);
      setEventError(null);
    } catch (error) {
      console.error(error);
      setEvents([]);
      setEventError("Failed to load calendar events.");
    } finally {
      setIsEventsLoading(false);
    }
  }, [preference]);

  const fetchPreference = useCallback(async () => {
    try {
      const nextPreference = await preferenceService.getMyPreference();
      setPreference(nextPreference);
    } catch (error) {
      console.error(error);
      setPreference(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      await Promise.all([
        fetchTasks(),
        fetchCategories(),
        fetchEvents(view, date),
        fetchPreference(),
      ]);
      if (isMounted) {
        hasInitialized.current = true;
        setIsInitializing(false);
      }
    };

    void initialize();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchCategories, fetchEvents, fetchPreference, fetchTasks]);

  useEffect(() => {
    if (!hasInitialized.current) {
      return;
    }
    void fetchEvents(view, date);
  }, [date, fetchEvents, preference, view]);

  return {
    state: {
      tasks,
      categories,
      events,
      preference,
      rescheduleWarnings,
    },
    loading: {
      initializing: isInitializing,
      tasks: isTasksLoading,
      categories: isCategoriesLoading,
      events: isEventsLoading,
      rescheduling: isRescheduling,
      exporting: isExporting,
      importing: isImporting,
    },
    error: {
      tasks: taskError,
      categories: categoryError,
      events: eventError,
      rescheduling: reschedulingError,
      exporting: exportingError,
      importing: importingError,
    },
    actions: {
      setTasks,
      setCategories,
      setEvents,
      setIsRescheduling,
      setIsExporting,
      setIsImporting,
      setReschedulingError,
      setExportingError,
      setImportingError,
      setRescheduleWarnings,
      fetchTasks,
      fetchEvents,
    },
  };
};
