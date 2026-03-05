import { useCallback, useEffect, useMemo, useState } from "react";
import moment from "moment";
import * as eventService from "@/services/eventService";
import * as taskService from "@/services/taskService";
import * as categoryService from "@/services/categoryService";
import {
  type Category,
  type Event,
  type EventMutationContext,
  type EventSubmission,
} from "@/types";
import { useThemeFont } from "@/hooks/common/useThemeFont";

const getEventWindow = () => ({
  start_date: moment().subtract(30, "days").format("YYYY-MM-DD"),
  end_date: moment().add(30, "days").format("YYYY-MM-DD"),
});

interface EventListSections {
  pastEvents: Event[];
  todayEvents: Event[];
  upcomingEvents: Event[];
  groupedUpcomingEvents: Record<string, Event[]>;
  sortedUpcomingDates: string[];
}

interface EventListState {
  events: Event[];
  categories: Category[];
  isSidebarOpen: boolean;
  selectedEvent: Event | undefined;
  isPastCollapsed: boolean;
  search: string;
  sortBy: string;
  filters: {
    category: number | null;
    recurringOnly: boolean;
  };
  sections: EventListSections;
}

interface EventListActions {
  setSearch: (value: string) => void;
  setSortBy: (value: string) => void;
  setFilterCategory: (value: number | null) => void;
  toggleRecurringOnly: () => void;
  togglePastCollapsed: () => void;
  openNewEvent: () => void;
  openEvent: (event: Event) => void;
  closeSidebar: () => void;
  submitEvent: (data: EventSubmission, context?: EventMutationContext) => Promise<void>;
  deleteEvent: (context?: EventMutationContext) => Promise<void>;
  revertEvent: (context: EventMutationContext) => Promise<void>;
  createCategory: (text: string) => Promise<Category>;
  updateCategory: (id: number, patch: { colour?: string | null }) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
  formatDayLabel: (dateStr: string) => string;
  getInstanceKey: (event: Event, index: number) => string;
}

interface UseEventListReturn {
  state: EventListState;
  loading: boolean;
  error: string | null;
  actions: EventListActions;
}

/**
 * Provides state and actions for the events page.
 */
export const useEventList = (): UseEventListReturn => {
  useThemeFont();

const [events, setEvents] = useState<Event[]>([]);
const [categories, setCategories] = useState<Category[]>([]);
const [isSidebarOpen, setIsSidebarOpen] = useState(false);
const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);
const [isPastCollapsed, setIsPastCollapsed] = useState(true);
const [search, setSearch] = useState("");
const [sortBy, setSortBy] = useState("start_time");
const [filterCategory, setFilterCategory] = useState<number | null>(null);
const [filterRecurring, setFilterRecurring] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchEvents = useCallback(async () => {
  setLoading(true);
  try {
    const data = await eventService.getEvents(getEventWindow());
    setEvents(data);
    setError(null);
  } catch (fetchEventsError) {
    console.error(fetchEventsError);
    setError("Failed to load events.");
  } finally {
    setLoading(false);
  }
}, []);

const fetchCategories = useCallback(async () => {
  try {
    const data = await categoryService.getCategories();
    setCategories(data);
  } catch (fetchCategoriesError) {
    console.error(fetchCategoriesError);
  }
}, []);

const refresh = useCallback(async () => {
  await fetchEvents();
  await fetchCategories();
}, [fetchCategories, fetchEvents]);

useEffect(() => {
  void refresh();
}, [refresh]);

const openNewEvent = useCallback(() => {
  setSelectedEvent(undefined);
  setIsSidebarOpen(true);
}, []);

const openEvent = useCallback((event: Event) => {
  setSelectedEvent(event);
  setIsSidebarOpen(true);
}, []);

const closeSidebar = useCallback(() => {
  setIsSidebarOpen(false);
  setSelectedEvent(undefined);
}, []);

const submitEvent = useCallback(
  async (data: EventSubmission, context?: EventMutationContext) => {
    try {
      if (selectedEvent?.id) {
        await eventService.updateEvent(selectedEvent.id, data, context);
      } else {
        await eventService.createEvent(data);
      }
      await fetchEvents();
      setIsSidebarOpen(false);
    } catch (submitError) {
      console.error(submitError);
    }
  },
  [fetchEvents, selectedEvent],
);

const deleteEvent = useCallback(
  async (context?: EventMutationContext) => {
    if (!selectedEvent?.id) {
      return;
    }

    try {
      await eventService.deleteEvent(selectedEvent.id, context);
      await fetchEvents();
      setIsSidebarOpen(false);
    } catch (deleteError) {
      console.error(deleteError);
    }
  },
  [fetchEvents, selectedEvent],
);

const revertEvent = useCallback(
  async (context: EventMutationContext) => {
    if (!selectedEvent?.id || !context.original_start_time) {
      return;
    }

    try {
      await eventService.revertEventInstance(selectedEvent.id, context.original_start_time);
      await fetchEvents();
      setIsSidebarOpen(false);
    } catch (revertError) {
      console.error(revertError);
    }
  },
  [fetchEvents, selectedEvent],
);

const createCategory = useCallback(async (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Category name cannot be empty.");
  }
  const created = await categoryService.createCategory(trimmed);
  setCategories((prev) => {
    const exists = prev.some((category) => category.id === created.id);
    const next = exists ? prev : [...prev, created];
    return [...next].sort((a, b) => a.text.localeCompare(b.text));
  });
  return created;
}, []);

const updateCategory = useCallback(async (id: number, patch: { colour?: string | null }) => {
  const updated = await categoryService.updateCategory(id, patch);
  setCategories((prev) => prev.map((category) => (
    category.id === id ? { ...category, ...updated } : category
  )));
  return updated;
}, []);

const deleteCategory = useCallback(async (id: number) => {
  await categoryService.deleteCategory(id);
  setCategories((prev) => prev.filter((category) => category.id !== id));
  if (filterCategory === id) {
    setFilterCategory(null);
  }
}, [filterCategory]);

const filteredEvents = useMemo(() => {
  return events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase());
    const matchesRecurring = !filterRecurring || Boolean(event.recurrence_interval);
    const matchesCategory =
      !filterCategory || event.categories.some((category) => category.id === filterCategory);
    return matchesSearch && matchesRecurring && matchesCategory;
  });
}, [events, filterCategory, filterRecurring, search]);

const sortedEvents = useMemo(() => {
  return [...filteredEvents].sort((a, b) => {
    if (sortBy === "start_time") {
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    }
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });
}, [filteredEvents, sortBy]);

const sections = useMemo<EventListSections>(() => {
  const today = moment().startOf("day");
  const pastEvents = sortedEvents.filter((event) => moment(event.start_time).isBefore(today));
  const todayEvents = sortedEvents.filter((event) => moment(event.start_time).isSame(today, "day"));
  const upcomingEvents = sortedEvents.filter(
    (event) =>
      moment(event.start_time).isAfter(today) && !moment(event.start_time).isSame(today, "day"),
  );

  const groupedUpcomingEvents = upcomingEvents.reduce<Record<string, Event[]>>((groups, event) => {
    const date = moment(event.start_time).startOf("day").format("YYYY-MM-DD");
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {});

  const sortedUpcomingDates = Object.keys(groupedUpcomingEvents).sort();

  return {
    pastEvents,
    todayEvents,
    upcomingEvents,
    groupedUpcomingEvents,
    sortedUpcomingDates,
  };
}, [sortedEvents]);

const formatDayLabel = useCallback((dateStr: string) => {
  const date = moment(dateStr);
  const tomorrow = moment().add(1, "day").startOf("day");
  if (date.isSame(tomorrow, "day")) {
    return "Tomorrow";
  }
  return date.format("ddd D MMM");
}, []);

const getInstanceKey = useCallback((event: Event, index: number): string => {
  return event.instance_id ?? `${event.id}-${event.start_time}-${index}`;
}, []);

return {
  state: {
    events,
    categories,
    isSidebarOpen,
    selectedEvent,
    isPastCollapsed,
    search,
    sortBy,
    filters: {
      category: filterCategory,
      recurringOnly: filterRecurring,
    },
    sections,
  },
  loading,
  error,
  actions: {
    setSearch,
    setSortBy,
    setFilterCategory,
    toggleRecurringOnly: () => {
      setFilterRecurring((prev) => !prev);
    },
    togglePastCollapsed: () => {
      setIsPastCollapsed((prev) => !prev);
    },
    openNewEvent,
    openEvent,
    closeSidebar,
    submitEvent,
    deleteEvent,
    revertEvent,
    createCategory,
    updateCategory,
    deleteCategory,
    refresh,
    formatDayLabel,
    getInstanceKey,
  },
};
};
