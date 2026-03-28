import { useState, useMemo, useCallback } from "react";
import moment from "moment-timezone";
import { type View, Views } from "react-big-calendar";
import type { Event, Task } from "@/types";
import { getNavigationUnit } from "./calendarTypes";
import { useStoredWeekStartsOn } from "@/utils/userPreferences";
import { useUserTimezone } from "@/utils/userTimezone";


export const useCalendarState = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<"task" | "event">("event");
  const [selectedItem, setSelectedItem] = useState<Task | Event | undefined>(undefined);
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [scheduleOrder, setScheduleOrder] = useState<Record<number, number>>({});
  const [headerHeight, setHeaderHeight] = useState(0);
  const [timeGutterWidth, setTimeGutterWidth] = useState(56);
  const activeTimezone = useUserTimezone();
  const weekStartsOn = useStoredWeekStartsOn();

  const currentLabel = useMemo(
    () => moment(date).tz(activeTimezone).format("MMMM YYYY"),
    [activeTimezone, date],
  );

  const dateStripDays = useMemo(() => {
    if (view === Views.WEEK) {
      const startOfWeek = moment(date)
        .tz(activeTimezone)
        .startOf(weekStartsOn === "monday" ? "isoWeek" : "week");
      return Array.from({ length: 7 }, (_, index) => startOfWeek.clone().add(index, "day"));
    }

    if (view === Views.DAY) {
      return [moment(date).tz(activeTimezone)];
    }

    return [];
  }, [activeTimezone, date, view, weekStartsOn]);

  const goToToday = useCallback(() => {
    setDate(new Date());
  }, []);

  const goToPrevious = useCallback(() => {
    setDate((currentDate) => moment(currentDate).tz(activeTimezone).subtract(1, getNavigationUnit(view)).toDate());
  }, [activeTimezone, view]);

  const goToNext = useCallback(() => {
    setDate((currentDate) => moment(currentDate).tz(activeTimezone).add(1, getNavigationUnit(view)).toDate());
  }, [activeTimezone, view]);

  return {
    state: {
      isSidebarOpen,
      sidebarMode,
      selectedItem,
      view,
      date,
      scheduleOrder,
      headerHeight,
      timeGutterWidth,
      currentLabel,
      dateStripDays,
    },
    actions: {
      setIsSidebarOpen,
      setSidebarMode,
      setSelectedItem,
      setView,
      setDate,
      setScheduleOrder,
      setHeaderHeight,
      setTimeGutterWidth,
      goToToday,
      goToPrevious,
      goToNext,

    },
  };
};
