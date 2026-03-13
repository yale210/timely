import { useLayoutEffect, useRef } from "react";
import type { UseCalendarReturn } from "@/hooks/calendar/useCalendar";
import CalendarSidebar from "@/components/calendar/CalendarSidebar";
import CalendarToolbar from "@/components/calendar/CalendarToolbar";
import CalendarView from "@/components/calendar/CalendarView";

interface CalendarContentProps {
  state: UseCalendarReturn["state"];
  actions: UseCalendarReturn["actions"];
  showNavbar: boolean;
  useLayout: boolean;
}

/**
 * Renders the extracted calendar shell.
 * @param props - Calendar content props.
 * @param props.state - Calendar state values.
 * @param props.actions - Calendar action callbacks.
 * @param props.showNavbar - Whether the shared app navbar should render.
 * @param props.useLayout - Whether the page is wrapped by the shared layout.
 * @returns The presentational calendar shell.
 */
const CalendarContent = ({
  state,
  actions,
  showNavbar,
  useLayout,
}: CalendarContentProps) => {
  const headerRef = useRef<HTMLElement | null>(null);
  const calendarHeaderTopClass = showNavbar && useLayout ? "top-10" : "top-0";

  useLayoutEffect(() => {
    const element = headerRef.current;
    if (!element) {
      return;
    }

    const updateHeaderHeight = () => {
      actions.setHeaderHeight(element.getBoundingClientRect().height);
    };

    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        updateHeaderHeight();
      });
      observer.observe(element);
      return () => {
        observer.disconnect();
        window.removeEventListener("resize", updateHeaderHeight);
      };
    }

    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
    };
  }, [actions]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white text-black">
      <CalendarToolbar
        headerRef={headerRef}
        calendarHeaderTopClass={calendarHeaderTopClass}
        state={{
          view: state.view,
          date: state.date,
          currentLabel: state.currentLabel,
          dateStripDays: state.dateStripDays,
          timeGutterWidth: state.timeGutterWidth,
          isRescheduling: state.isRescheduling,
        }}
        actions={{
          setView: actions.setView,
          goToToday: actions.goToToday,
          goToPrevious: actions.goToPrevious,
          goToNext: actions.goToNext,
          rescheduleTasks: actions.rescheduleTasks,
        }}
      />
      <CalendarView
        state={{
          calendarEntries: state.calendarEntries,
          view: state.view,
          date: state.date,
          preference: state.preference,
          headerHeight: state.headerHeight,
        }}
        actions={{
          setView: actions.setView,
          setDate: actions.setDate,
          selectSlot: actions.selectSlot,
          selectEntry: actions.selectEntry,
          handleEventDrop: actions.handleEventDrop,
          handleEventResize: actions.handleEventResize,
          handleToggleTaskComplete: actions.handleToggleTaskComplete,
          setTimeGutterWidth: actions.setTimeGutterWidth,
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
          createCategory: actions.createCategory,
          updateCategory: actions.updateCategory,
          deleteCategory: actions.deleteCategory,
          updateTaskCategories: actions.updateTaskCategories,
        }}
      />
    </div>
  );
};

export default CalendarContent;
