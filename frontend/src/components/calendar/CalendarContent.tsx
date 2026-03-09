import type { UseCalendarReturn } from "@/hooks/calendar/useCalendar";
import CalendarSidebar from "@/components/calendar/CalendarSidebar";
import CalendarToolbar from "@/components/calendar/CalendarToolbar";
import CalendarView from "@/components/calendar/CalendarView";

interface CalendarContentProps {
  state: UseCalendarReturn["state"];
  loading: UseCalendarReturn["loading"];
  actions: UseCalendarReturn["actions"];
}

/**
 * Renders the extracted calendar shell.
 * @param props - Calendar content props.
 * @param props.state - Calendar state values.
 * @param props.loading - Calendar loading values.
 * @param props.actions - Calendar action callbacks.
 * @returns The presentational calendar shell.
 */
const CalendarContent = ({
  state,
  loading,
  actions,
}: CalendarContentProps) => (
  <div className="flex h-full flex-col overflow-hidden bg-white text-black">
    <CalendarToolbar
      state={{ view: state.view, currentLabel: state.currentLabel }}
      loading={{ scheduling: loading.scheduling, unscheduling: loading.unscheduling }}
      actions={{
        setView: actions.setView,
        goToToday: actions.goToToday,
        goToPrevious: actions.goToPrevious,
        goToNext: actions.goToNext,
        scheduleTasks: actions.scheduleTasks,
        unscheduleTasks: actions.unscheduleTasks,
      }}
    />
    <CalendarView
      state={{
        calendarEntries: state.calendarEntries,
        view: state.view,
        date: state.date,
      }}
      actions={{
        setView: actions.setView,
        setDate: actions.setDate,
        selectSlot: actions.selectSlot,
        selectEntry: actions.selectEntry,
      }}
    />
    <CalendarSidebar
      state={{
        isSidebarOpen: state.isSidebarOpen,
        categories: state.categories,
        selectedItem: state.selectedItem,
        sidebarMode: state.sidebarMode,
      }}
      actions={{
        closeSidebar: actions.closeSidebar,
        submitTask: actions.submitTask,
        submitEvent: actions.submitEvent,
        deleteSelected: actions.deleteSelected,
        revertSelectedEvent: actions.revertSelectedEvent,
      }}
    />
  </div>
);

export default CalendarContent;
