import { useMemo } from "react";
import { useCalendarState } from "./useCalendarState";
import { useCalendarData } from "./useCalendarData";
import { useCalendarInteractions } from "./useCalendarInteractions";
import { useCalendarMutations } from "./useCalendarMutations";
import { buildCalendarEntries } from "@/utils/calendarAdapter";
import type { UseCalendarReturn } from "./calendarTypes";

export { isOutsidePreferredDayWindow } from "./calendarTypes";
export type { UseCalendarReturn };

/**
 * Provides the state and actions for the calendar page.
 * @returns Structured calendar state, loading, error, and actions.
 */
export const useCalendar = (): UseCalendarReturn => {
  // 1. Get the purely UI-driven State FIRST
  const stateHook = useCalendarState();

  // 2. Pass dynamic view/date into Data Fetcher so it reacts to navigation!
  const dataHook = useCalendarData(stateHook.state.view, stateHook.state.date);

  // 3. Compute calendar entries from both state & data arrays
  const calendarEntries = useMemo(
    () =>
      buildCalendarEntries({
        tasks: dataHook.state.tasks,
        events: dataHook.state.events,
        scheduleOrder: stateHook.state.scheduleOrder,
      }),
    [dataHook.state.events, dataHook.state.tasks, stateHook.state.scheduleOrder]
  );

  // 4. Get the click/drag Interactions
  const interactionsHook = useCalendarInteractions({
    ...dataHook.state, ...stateHook.state, 
    ...dataHook.actions, ...stateHook.actions
  });

  // 5. Get the Database Mutations 
  const mutationsHook = useCalendarMutations({
    ...dataHook.state, ...stateHook.state,
    ...dataHook.actions, ...stateHook.actions,
    closeSidebar: interactionsHook.closeSidebar
  });

  // 6. Smash them all together into the exact interface the Calendar UI expects!
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
      // Primitive state setters
      setView: stateHook.actions.setView,
      setDate: stateHook.actions.setDate,
      setHeaderHeight: stateHook.actions.setHeaderHeight,
      setTimeGutterWidth: stateHook.actions.setTimeGutterWidth,
      
      // UI Navigation
      goToToday: stateHook.actions.goToToday,
      goToPrevious: stateHook.actions.goToPrevious,
      goToNext: stateHook.actions.goToNext,

      // UI Interactions
      selectSlot: interactionsHook.selectSlot,
      selectEntry: interactionsHook.selectEntry,
      closeSidebar: interactionsHook.closeSidebar,
      handleEventDrop: interactionsHook.handleEventDrop,
      handleEventResize: interactionsHook.handleEventResize,

      // Database Mutations
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