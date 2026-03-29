import { useMemo } from "react";
import { useCalendarState } from "./useCalendarState";
import { useCalendarData } from "./useCalendarData";
import { useCalendarInteractions } from "./useCalendarInteractions";
import { useCalendarMutations } from "./useCalendarMutations";
import { buildCalendarEntries } from "@/utils/calendarAdapter";
import { getStoredUserTimezone } from "@/utils/userTimezone";
import type { UseCalendarReturn } from "./calendarTypes";

export { isOutsidePreferredDayWindow } from "./calendarTypes";
export type { UseCalendarReturn };

/**
 * Provides the state and actions for the calendar page.
 * @returns Structured calendar state, loading, error, and actions.
 */
export const useCalendar = (): UseCalendarReturn => {
  const stateHook = useCalendarState();
  const dataHook = useCalendarData(stateHook.state.view, stateHook.state.date);
  const activeTimezone = dataHook.state.preference?.timezone ?? getStoredUserTimezone();

  const calendarEntries = useMemo(
    () =>
      buildCalendarEntries({
        tasks: dataHook.state.tasks,
        events: dataHook.state.events,
        scheduleOrder: stateHook.state.scheduleOrder,
        timeZone: activeTimezone,
      }),
    [activeTimezone, dataHook.state.events, dataHook.state.tasks, stateHook.state.scheduleOrder],
  );

  const interactionsHook = useCalendarInteractions({
    ...dataHook.state,
    ...stateHook.state,
    ...dataHook.actions,
    ...stateHook.actions,
  });

  const mutationsHook = useCalendarMutations({
    ...dataHook.state,
    ...stateHook.state,
    ...dataHook.actions,
    ...stateHook.actions,
    closeSidebar: interactionsHook.closeSidebar,
  });

  return {
    state: {
      ...dataHook.state,
      ...stateHook.state,
      calendarEntries,
      isRescheduling: dataHook.loading.rescheduling,
    },
    loading: {
      ...dataHook.loading,
    },
    error: {
      ...dataHook.error,
    },
    actions: {
      setView: stateHook.actions.setView,
      setDate: stateHook.actions.setDate,
      setHeaderHeight: stateHook.actions.setHeaderHeight,
      setTimeGutterWidth: stateHook.actions.setTimeGutterWidth,
      goToToday: stateHook.actions.goToToday,
      goToPrevious: stateHook.actions.goToPrevious,
      goToNext: stateHook.actions.goToNext,
      selectSlot: interactionsHook.selectSlot,
      selectEntry: interactionsHook.selectEntry,
      openCreateSidebar: interactionsHook.openCreateSidebar,
      closeSidebar: interactionsHook.closeSidebar,
      handleEventDrop: interactionsHook.handleEventDrop,
      handleEventResize: interactionsHook.handleEventResize,
      submitTask: mutationsHook.submitTask,
      submitEvent: mutationsHook.submitEvent,
      deleteSelected: mutationsHook.deleteSelected,
      revertSelectedEvent: mutationsHook.revertSelectedEvent,
      rescheduleTasks: mutationsHook.rescheduleTasks,
      exportEvents: mutationsHook.exportEvents,
      importEvents: mutationsHook.importEvents,
      createCategory: mutationsHook.createCategory,
      updateCategory: mutationsHook.updateCategory,
      deleteCategory: mutationsHook.deleteCategory,
      updateTaskCategories: mutationsHook.updateTaskCategories,
      handleToggleTaskComplete: mutationsHook.handleToggleTaskComplete,
    },
  };
};
