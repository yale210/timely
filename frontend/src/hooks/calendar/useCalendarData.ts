import { useState, useCallback, useEffect, useRef, type MutableRefObject } from "react";
import type { View } from "react-big-calendar";
import { getCalendarWindow } from "./calendarTypes";
import * as eventService from "@/services/eventService";
import * as taskService from "@/services/taskService";
import { preferenceService } from "@/services/preferenceService";
import type { Category, Event, Preference, Task } from "@/types";

interface RescheduleWarning {
  taskId: number;
  title: string;
  reason: string;
}

const useCalendarEntityState = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [preference, setPreference] = useState<Preference | null>(null);
  const [rescheduleWarnings, setRescheduleWarnings] = useState<RescheduleWarning[]>([]);

  return {
    state: { tasks, categories, events, preference, rescheduleWarnings },
    actions: { setTasks, setCategories, setEvents, setPreference, setRescheduleWarnings },
  };
};

const useCalendarLoadingState = () => {
  const [initializing, setInitializing] = useState(true);
  const [tasks, setTasks] = useState(false);
  const [categories, setCategories] = useState(false);
  const [events, setEvents] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  return {
    state: { initializing, tasks, categories, events, rescheduling, exporting, importing },
    actions: { setInitializing, setTasks, setCategories, setEvents, setRescheduling, setExporting, setImporting },
  };
};

const useCalendarErrorState = () => {
  const [tasks, setTasks] = useState<string | null>(null);
  const [categories, setCategories] = useState<string | null>(null);
  const [events, setEvents] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);

  return {
    state: { tasks, categories, events, rescheduling, exporting, importing },
    actions: { setTasks, setCategories, setEvents, setRescheduling, setExporting, setImporting },
  };
};

const loadCalendarCollection = async <T,>({
  loader,
  setLoading,
  applyResult,
  applyFallback,
  setError,
  errorMessage,
}: {
  loader: () => Promise<T>;
  setLoading: (value: boolean) => void;
  applyResult: (value: T) => void;
  applyFallback: () => void;
  setError: (value: string | null) => void;
  errorMessage: string;
}) => {
  setLoading(true);
  try {
    applyResult(await loader());
    setError(null);
  } catch (error) {
    console.error(error);
    applyFallback();
    setError(errorMessage);
  } finally {
    setLoading(false);
  }
};

const useTaskFetcher = (
  entities: ReturnType<typeof useCalendarEntityState>,
  loading: ReturnType<typeof useCalendarLoadingState>,
  error: ReturnType<typeof useCalendarErrorState>,
) => {
  const setTasks = entities.actions.setTasks;
  const setTasksLoading = loading.actions.setTasks;
  const setTaskError = error.actions.setTasks;
  return useCallback(
    async () => loadCalendarCollection({
      loader: () => taskService.getTasks(),
      setLoading: setTasksLoading,
      applyResult: setTasks,
      applyFallback: () => setTasks([]),
      setError: setTaskError,
      errorMessage: "Failed to load calendar tasks.",
    }),
    [setTaskError, setTasks, setTasksLoading],
  );
};

const useCategoryFetcher = (
  entities: ReturnType<typeof useCalendarEntityState>,
  loading: ReturnType<typeof useCalendarLoadingState>,
  error: ReturnType<typeof useCalendarErrorState>,
) => {
  const setCategories = entities.actions.setCategories;
  const setCategoriesLoading = loading.actions.setCategories;
  const setCategoryError = error.actions.setCategories;
  return useCallback(
    async () => loadCalendarCollection({
      loader: () => taskService.getCategories(),
      setLoading: setCategoriesLoading,
      applyResult: setCategories,
      applyFallback: () => setCategories([]),
      setError: setCategoryError,
      errorMessage: "Failed to load categories.",
    }),
    [setCategories, setCategoriesLoading, setCategoryError],
  );
};

const useEventFetcher = (
  entities: ReturnType<typeof useCalendarEntityState>,
  loading: ReturnType<typeof useCalendarLoadingState>,
  error: ReturnType<typeof useCalendarErrorState>,
  preferenceRef: MutableRefObject<Preference | null>,
) => {
  const setEvents = entities.actions.setEvents;
  const setEventsLoading = loading.actions.setEvents;
  const setEventError = error.actions.setEvents;
  return useCallback(
    async (activeView: View, activeDate: Date) => loadCalendarCollection({
      loader: () => eventService.getEvents(getCalendarWindow(activeView, activeDate, preferenceRef.current)),
      setLoading: setEventsLoading,
      applyResult: setEvents,
      applyFallback: () => setEvents([]),
      setError: setEventError,
      errorMessage: "Failed to load calendar events.",
    }),
    [preferenceRef, setEventError, setEvents, setEventsLoading],
  );
};

const usePreferenceFetcher = (
  entities: ReturnType<typeof useCalendarEntityState>,
  preferenceRef: MutableRefObject<Preference | null>,
) => {
  const setPreference = entities.actions.setPreference;
  return useCallback(async (): Promise<Preference | null> => {
    try {
      const nextPreference = await preferenceService.getMyPreference();
      preferenceRef.current = nextPreference;
      setPreference(nextPreference);
      return nextPreference;
    } catch (errorValue) {
      console.error(errorValue);
      preferenceRef.current = null;
      setPreference(null);
      return null;
    }
  }, [preferenceRef, setPreference]);
};

const loadInitialCalendarData = async ({
  fetchTasks,
  fetchCategories,
  fetchPreference,
  fetchEvents,
  view,
  date,
}: {
  fetchTasks: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchPreference: () => Promise<Preference | null>;
  fetchEvents: (view: View, date: Date) => Promise<void>;
  view: View;
  date: Date;
}) => {
  await Promise.all([fetchTasks(), fetchCategories(), fetchPreference()]);
  await fetchEvents(view, date);
};

const useInitialCalendarLoad = (
  fetchTasks: () => Promise<void>,
  fetchCategories: () => Promise<void>,
  fetchEvents: (view: View, date: Date) => Promise<void>,
  fetchPreference: () => Promise<Preference | null>,
  view: View,
  date: Date,
  setInitializing: (value: boolean) => void,
  hasInitializedRef: MutableRefObject<boolean>,
) => {
  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    let isMounted = true;
    const initializedRef = hasInitializedRef;
    const initialise = async () => {
      await loadInitialCalendarData({ fetchTasks, fetchCategories, fetchPreference, fetchEvents, view, date });
      if (isMounted) {
        initializedRef.current = true;
        setInitializing(false);
      }
    };
    void initialise();
    return () => {
      isMounted = false;
    };
  }, [date, fetchCategories, fetchEvents, fetchPreference, fetchTasks, hasInitializedRef, setInitializing, view]);
};

const useCalendarEventRefresh = (
  hasInitialized: MutableRefObject<boolean>,
  fetchEvents: (view: View, date: Date) => Promise<void>,
  view: View,
  date: Date,
) => {
  useEffect(() => {
    if (!hasInitialized.current) {
      return;
    }
    void fetchEvents(view, date);
  }, [date, fetchEvents, hasInitialized, view]);
};

const buildCalendarDataResult = (
  entities: ReturnType<typeof useCalendarEntityState>,
  loading: ReturnType<typeof useCalendarLoadingState>,
  error: ReturnType<typeof useCalendarErrorState>,
  fetchTasks: () => Promise<void>,
  fetchEvents: (view: View, date: Date) => Promise<void>,
) => ({
  state: entities.state,
  loading: loading.state,
  error: error.state,
  actions: {
    ...entities.actions,
    setIsRescheduling: loading.actions.setRescheduling,
    setIsExporting: loading.actions.setExporting,
    setIsImporting: loading.actions.setImporting,
    setReschedulingError: error.actions.setRescheduling,
    setExportingError: error.actions.setExporting,
    setImportingError: error.actions.setImporting,
    fetchTasks,
    fetchEvents,
  },
});

/**
 * Loads calendar entities, preferences, and loading/error state.
 * @param view - Active calendar view.
 * @param date - Active calendar date.
 * @returns Calendar data state and fetch helpers.
 */
export const useCalendarData = (view: View, date: Date) => {
  const entities = useCalendarEntityState();
  const loading = useCalendarLoadingState();
  const error = useCalendarErrorState();
  const hasInitialized = useRef(false);
  const preferenceRef = useRef<Preference | null>(null);
  const fetchTasks = useTaskFetcher(entities, loading, error);
  const fetchCategories = useCategoryFetcher(entities, loading, error);
  const fetchEvents = useEventFetcher(entities, loading, error, preferenceRef);
  const fetchPreference = usePreferenceFetcher(entities, preferenceRef);

  useInitialCalendarLoad(
    fetchTasks,
    fetchCategories,
    fetchEvents,
    fetchPreference,
    view,
    date,
    loading.actions.setInitializing,
    hasInitialized,
  );
  useCalendarEventRefresh(hasInitialized, fetchEvents, view, date);

  return buildCalendarDataResult(entities, loading, error, fetchTasks, fetchEvents);
};
