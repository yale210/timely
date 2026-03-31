import { useState, useMemo, useCallback, type Dispatch, type SetStateAction } from "react";
import moment from "moment-timezone";
import { type View, Views } from "react-big-calendar";
import type { Event, Task } from "@/types";
import { getNavigationUnit } from "./calendarTypes";
import { useStoredWeekStartsOn } from "@/utils/userPreferences";
import { useUserTimezone } from "@/utils/userTimezone";

const useCalendarSidebarState = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<"task" | "event">("event");
  const [selectedItem, setSelectedItem] = useState<Task | Event | undefined>(undefined);

  return {
    state: { isSidebarOpen, sidebarMode, selectedItem },
    actions: { setIsSidebarOpen, setSidebarMode, setSelectedItem },
  };
};

const useCalendarRangeState = () => {
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [scheduleOrder, setScheduleOrder] = useState<Record<number, number>>({});

  return {
    state: { view, date, scheduleOrder },
    actions: { setView, setDate, setScheduleOrder },
  };
};

const useCalendarLayoutState = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [timeGutterWidth, setTimeGutterWidth] = useState(56);

  return {
    state: { headerHeight, timeGutterWidth },
    actions: { setHeaderHeight, setTimeGutterWidth },
  };
};

const useCalendarDerivedLabels = (date: Date, view: View, activeTimezone: string, weekStartsOn: "monday" | "sunday") => {
  const currentLabel = useMemo(() => moment(date).tz(activeTimezone).format("MMMM YYYY"), [activeTimezone, date]);
  const dateStripDays = useMemo(() => {
    if (view === Views.WEEK) {
      const startOfWeek = moment(date)
        .tz(activeTimezone)
        .startOf(weekStartsOn === "monday" ? "isoWeek" : "week");
      return Array.from({ length: 7 }, (_, index) => startOfWeek.clone().add(index, "day"));
    }
    return view === Views.DAY ? [moment(date).tz(activeTimezone)] : [];
  }, [activeTimezone, date, view, weekStartsOn]);

  return { currentLabel, dateStripDays };
};

const useCalendarNavigation = (
  setDate: Dispatch<SetStateAction<Date>>,
  activeTimezone: string,
  view: View,
) => {
  const goToToday = useCallback(() => {
    setDate(new Date());
  }, [setDate]);
  const goToPrevious = useCallback(() => {
    setDate((currentDate) => moment(currentDate).tz(activeTimezone).subtract(1, getNavigationUnit(view)).toDate());
  }, [activeTimezone, setDate, view]);
  const goToNext = useCallback(() => {
    setDate((currentDate) => moment(currentDate).tz(activeTimezone).add(1, getNavigationUnit(view)).toDate());
  }, [activeTimezone, setDate, view]);

  return { goToToday, goToPrevious, goToNext };
};

/**
 * Stores local calendar UI state derived from user preferences.
 * @returns Calendar state plus navigation and layout actions.
 */
export const useCalendarState = () => {
  const sidebar = useCalendarSidebarState();
  const range = useCalendarRangeState();
  const layout = useCalendarLayoutState();
  const activeTimezone = useUserTimezone();
  const weekStartsOn = useStoredWeekStartsOn();
  const { currentLabel, dateStripDays } = useCalendarDerivedLabels(
    range.state.date,
    range.state.view,
    activeTimezone,
    weekStartsOn,
  );
  const navigation = useCalendarNavigation(range.actions.setDate, activeTimezone, range.state.view);

  return {
    state: {
      ...sidebar.state,
      ...range.state,
      ...layout.state,
      currentLabel,
      dateStripDays,
    },
    actions: {
      ...sidebar.actions,
      ...range.actions,
      ...layout.actions,
      ...navigation,
    },
  };
};
