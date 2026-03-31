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

const useCalendarEntries = (
  tasks: UseCalendarReturn["state"]["tasks"],
  events: UseCalendarReturn["state"]["events"],
  scheduleOrder: UseCalendarReturn["state"]["scheduleOrder"],
  timeZone: string,
) =>
  useMemo(
    () => buildCalendarEntries({ tasks, events, scheduleOrder, timeZone }),
    [events, scheduleOrder, tasks, timeZone],
  );

const getInteractionProps = (
  stateHook: ReturnType<typeof useCalendarState>,
  dataHook: ReturnType<typeof useCalendarData>,
) => ({
  ...dataHook.state,
  ...stateHook.state,
  ...dataHook.actions,
  ...stateHook.actions,
});

const getMutationProps = (
  stateHook: ReturnType<typeof useCalendarState>,
  dataHook: ReturnType<typeof useCalendarData>,
  closeSidebar: UseCalendarReturn["actions"]["closeSidebar"],
) => ({
  ...dataHook.state,
  ...stateHook.state,
  ...dataHook.actions,
  ...stateHook.actions,
  closeSidebar,
});

const buildCalendarState = (
  stateHook: ReturnType<typeof useCalendarState>,
  dataHook: ReturnType<typeof useCalendarData>,
  calendarEntries: UseCalendarReturn["state"]["calendarEntries"],
): UseCalendarReturn["state"] => ({
  ...dataHook.state,
  ...stateHook.state,
  calendarEntries,
  isRescheduling: dataHook.loading.rescheduling,
});

const buildCalendarActions = (
  stateHook: ReturnType<typeof useCalendarState>,
  interactionsHook: ReturnType<typeof useCalendarInteractions>,
  mutationsHook: ReturnType<typeof useCalendarMutations>,
): UseCalendarReturn["actions"] => ({
  setView: stateHook.actions.setView,
  setDate: stateHook.actions.setDate,
  setHeaderHeight: stateHook.actions.setHeaderHeight,
  setTimeGutterWidth: stateHook.actions.setTimeGutterWidth,
  goToToday: stateHook.actions.goToToday,
  goToPrevious: stateHook.actions.goToPrevious,
  goToNext: stateHook.actions.goToNext,
  ...interactionsHook,
  ...mutationsHook,
});

/**
 * Provides the state and actions for the calendar page.
 * @returns Structured calendar state, loading, error, and actions.
 */
export const useCalendar = (): UseCalendarReturn => {
  const stateHook = useCalendarState();
  const dataHook = useCalendarData(stateHook.state.view, stateHook.state.date);
  const activeTimezone = dataHook.state.preference?.timezone ?? getStoredUserTimezone();
  const calendarEntries = useCalendarEntries(
    dataHook.state.tasks,
    dataHook.state.events,
    stateHook.state.scheduleOrder,
    activeTimezone,
  );
  const interactionsHook = useCalendarInteractions(getInteractionProps(stateHook, dataHook));
  const mutationsHook = useCalendarMutations(
    getMutationProps(stateHook, dataHook, interactionsHook.closeSidebar),
  );

  return {
    state: buildCalendarState(stateHook, dataHook, calendarEntries),
    loading: dataHook.loading,
    error: dataHook.error,
    actions: buildCalendarActions(stateHook, interactionsHook, mutationsHook),
  };
};
