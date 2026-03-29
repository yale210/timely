import { type View, Views } from "react-big-calendar";
import type { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop";
import type { Category, Event, EventMutationContext, EventSubmission, Preference, Task, TaskSubmission } from "@/types";
import type { CalendarEntry } from "@/utils/calendarAdapter";
import { getStoredUserTimezone } from "@/utils/userTimezone";
import { getStoredWeekStartsOn } from "@/utils/userPreferences";
import moment from "moment";

interface CalendarState {
  tasks: Task[];
  categories: Category[];
  events: Event[];
  calendarEntries: CalendarEntry[];
  isSidebarOpen: boolean;
  selectedItem: Task | Event | undefined;
  view: View;
  date: Date;
  sidebarMode: "task" | "event";
  scheduleOrder: Record<number, number>;
  currentLabel: string;
  preference: Preference | null;
  dateStripDays: moment.Moment[];
  headerHeight: number;
  timeGutterWidth: number;
  isRescheduling: boolean;
  rescheduleWarnings: { taskId: number; title: string; reason: string }[];
}

interface CalendarLoading {
  initializing: boolean;
  tasks: boolean;
  categories: boolean;
  events: boolean;
  rescheduling: boolean;
  exporting: boolean;
  importing: boolean;
}

interface CalendarError {
  tasks: string | null;
  categories: string | null;
  events: string | null;
  rescheduling: string | null;
  exporting: string | null;
  importing: string | null;
}

interface CalendarActions {
  setView: (nextView: View) => void;
  setDate: (nextDate: Date) => void;
  goToToday: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  selectSlot: (slot: { start: Date; end?: Date; slots?: Date[]; action?: "select" | "click" | "doubleClick" }) => void;
  selectEntry: (entry: CalendarEntry) => void;
  openCreateSidebar: () => void;
  closeSidebar: () => void;
  submitTask: (data: TaskSubmission) => Promise<void>;
  submitEvent: (data: EventSubmission, context?: EventMutationContext) => Promise<void>;
  deleteSelected: (context?: EventMutationContext) => Promise<void>;
  revertSelectedEvent: (context: EventMutationContext) => Promise<void>;
  rescheduleTasks: () => Promise<void>;
  exportEvents: () => Promise<void>;
  importEvents: (file: File) => Promise<void>;
  createCategory: (text: string) => Promise<Category>;
  updateCategory: (id: number, patch: { colour?: string | null; colour_override?: boolean }) => Promise<Category>;
  deleteCategory: (id: number) => Promise<void>;
  updateTaskCategories: (id: number, nextCategoryIds: number[]) => Promise<void>;
  handleEventDrop: (args: EventInteractionArgs<CalendarEntry>) => Promise<void>;
  handleEventResize: (args: EventInteractionArgs<CalendarEntry>) => Promise<void>;
  handleToggleTaskComplete: (taskId: number) => Promise<void>;
  setHeaderHeight: (height: number) => void;
  setTimeGutterWidth: (width: number) => void;
}

/**
 * Describes the structured calendar hook contract.
 */
export interface UseCalendarReturn {
  state: CalendarState;
  loading: CalendarLoading;
  error: CalendarError;
  actions: CalendarActions;
}

interface CalendarWindow {
  start_date: string;
  end_date: string;
}
type CalendarWindowUnit = "week" | "isoWeek";

const formatWindow = (start: moment.Moment, end: moment.Moment): CalendarWindow => ({
  start_date: start.format("YYYY-MM-DD"),
  end_date: end.format("YYYY-MM-DD"),
});

const getMonthWindow = (anchor: moment.Moment, startOfWeekUnit: CalendarWindowUnit): CalendarWindow =>
  formatWindow(
    anchor.clone().startOf("month").startOf(startOfWeekUnit),
    anchor.clone().endOf("month").endOf(startOfWeekUnit),
  );

const getWeekWindow = (anchor: moment.Moment, startOfWeekUnit: CalendarWindowUnit): CalendarWindow =>
  formatWindow(anchor.clone().startOf(startOfWeekUnit), anchor.clone().endOf(startOfWeekUnit));

const getDayWindow = (anchor: moment.Moment): CalendarWindow =>
  formatWindow(anchor.clone().startOf("day"), anchor.clone().endOf("day"));

const getAgendaWindow = (anchor: moment.Moment): CalendarWindow =>
  formatWindow(anchor.clone().startOf("day"), anchor.clone().add(30, "days").endOf("day"));

const resolveCalendarWindow = (
  currentView: View,
  anchor: moment.Moment,
  startOfWeekUnit: CalendarWindowUnit,
): CalendarWindow => {
  if (currentView === Views.MONTH) {
    return getMonthWindow(anchor, startOfWeekUnit);
  }
  if (currentView === Views.WEEK) {
    return getWeekWindow(anchor, startOfWeekUnit);
  }
  if (currentView === Views.DAY) {
    return getDayWindow(anchor);
  }
  return getAgendaWindow(anchor);
};

/**
 * Computes the inclusive date window to load for the current calendar view.
 * @param currentView - Active calendar view.
 * @param currentDate - Anchor date for the view.
 * @param preference - Optional saved calendar preferences used for timezone and week-start handling.
 * @returns Date window formatted for API queries.
 */
export const getCalendarWindow = (
  currentView: View,
  currentDate: Date,
  preference?: Preference | null,
): CalendarWindow => {
  const activeTimezone = preference?.timezone ?? getStoredUserTimezone();
  const weekStartsOn = preference?.week_starts_on ?? getStoredWeekStartsOn();
  const anchor = moment(currentDate).tz(activeTimezone);
  const startOfWeekUnit = weekStartsOn === "monday" ? "isoWeek" : "week";
  if (currentView === Views.AGENDA) {
    return formatWindow(anchor.clone().startOf("month"), anchor.clone().endOf("month"));
  }
  return resolveCalendarWindow(currentView, anchor, startOfWeekUnit);
};

/**
 * Maps the active calendar view to its navigation step size.
 * @param view - Active calendar view.
 * @returns Unit used for previous/next navigation.
 */
export const getNavigationUnit = (view: View): "month" | "week" | "day" => {
  if (view === Views.MONTH) {
    return "month";
  }
  if (view === Views.AGENDA) {
    return "month";
  }
  if (view === Views.DAY) {
    return "day";
  }
  return "week";
};

/**
 * Parses an `HH:mm` clock string into total minutes.
 * @param value - Time string to parse.
 * @returns Minute count from midnight.
 */
const parseClockMinutes = (value: string): number => {
  const [hourRaw, minuteRaw] = value.split(":");
  const hour = Number.parseInt(hourRaw ?? "0", 10);
  const minute = Number.parseInt(minuteRaw ?? "0", 10);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return 0;
  }

  return (hour * 60) + minute;
};

/**
 * Normalizes an interaction start time to minute precision.
 * @param value - Raw interaction start date.
 * @returns Clamped start date.
 */
export const normalizeInteractionStart = (value: Date): Date => {
  const next = new Date(value);
  next.setSeconds(0, 0);
  return next;
};

/**
 * Normalizes an interaction end time to minute precision.
 * @param value - Raw interaction end date.
 * @returns Clamped end date.
 */
export const normalizeInteractionEnd = (value: Date): Date => {
  const next = new Date(value);
  if (next.getSeconds() === 0 && next.getMilliseconds() === 0) {
    return next;
  }

  next.setSeconds(0, 0);
  next.setMinutes(next.getMinutes() + 1);
  return next;
};

/**
 * Extracts weekday and time-of-day values in the target timezone.
 * @param slotDate - Slot date being inspected.
 * @param timezone - IANA timezone used for formatting.
 * @returns Weekday index and minutes-from-midnight pair.
 */
const getSlotTzParts = (slotDate: Date, timezone: string): { dayOfWeek: number; minutes: number } => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(slotDate);
    const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
    const dayOfWeek = weekdayNames.indexOf(weekday);
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10) % 24;
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
    return {
      dayOfWeek: dayOfWeek === -1 ? slotDate.getDay() : dayOfWeek,
      minutes: (hour * 60) + minute,
    };
  } catch {
    return {
      dayOfWeek: slotDate.getDay(),
      minutes: (slotDate.getHours() * 60) + slotDate.getMinutes(),
    };
  }
};

/**
 * Resolves the preferred schedule window for a specific day.
 * @param preference - User scheduling preference.
 * @param dayOfWeek - JavaScript weekday index.
 * @returns Start and end clock values for that day.
 */
const getDayScheduleWindow = (preference: Preference, dayOfWeek: number): { start: string; end: string } => {
  const dayKey = dayOfWeek === 0 ? 7 : dayOfWeek;
  const schedule = preference.day_schedule ?? [];
  const entry = schedule.find((item) => item.day === dayKey);
  if (entry?.start && entry?.end) {
    return { start: entry.start, end: entry.end };
  }
  return {
    start: preference.day_start,
    end: preference.day_end,
  };
};

/**
 * Returns true when a slot falls outside the preferred schedule window.
 * @param slotDate - Slot time to evaluate.
 * @param preference - User preference schedule, if available.
 */
export const isOutsidePreferredDayWindow = (slotDate: Date, preference: Preference | null): boolean => {
  if (!preference) {
    return false;
  }

  const { dayOfWeek, minutes: slotMinutes } = getSlotTzParts(slotDate, preference.timezone);
  const { start, end } = getDayScheduleWindow(preference, dayOfWeek);
  const startMinutes = parseClockMinutes(start);
  const endMinutes = parseClockMinutes(end);

  if (startMinutes === endMinutes) {
    return false;
  }

  if (startMinutes < endMinutes) {
    return slotMinutes < startMinutes || slotMinutes >= endMinutes;
  }

  return slotMinutes >= endMinutes && slotMinutes < startMinutes;
};
