import type { RefObject } from "react";
import moment from "moment";
import { Views } from "react-big-calendar";
import type { UseCalendarReturn } from "@/hooks/calendar/useCalendar";

interface CalendarToolbarProps {
  headerRef: RefObject<HTMLElement | null>;
  calendarHeaderTopClass: string;
  state: Pick<
    UseCalendarReturn["state"],
    "view" | "date" | "currentLabel" | "dateStripDays" | "timeGutterWidth" | "isRescheduling"
  >;
  actions: Pick<
    UseCalendarReturn["actions"],
    "setView" | "goToToday" | "goToPrevious" | "goToNext" | "rescheduleTasks"
  >;
}

/**
 * Renders the calendar header controls and date strip.
 * @param props - Toolbar props.
 * @param props.headerRef - Ref to measure header height.
 * @param props.calendarHeaderTopClass - Top offset class for fixed header.
 * @param props.state - Toolbar state values.
 * @param props.actions - Toolbar action callbacks.
 * @returns The calendar toolbar.
 */
const CalendarToolbar = ({
  headerRef,
  calendarHeaderTopClass,
  state,
  actions,
}: CalendarToolbarProps) => (
  <header
    ref={headerRef}
    className={`calendar-header fixed left-0 right-0 z-20 flex-none border-b border-gray-200 bg-white pt-2 pb-0 shadow-sm ${calendarHeaderTopClass}`}
  >
    <div className="flex flex-col md:flex-row justify-between items-center gap-2 px-4">
      <div className="flex items-center gap-6">
        <h1 className="text-2xl font-bold tracking-tight text-black">
          Calendar
        </h1>
        <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <button
            type="button"
            onClick={actions.goToPrevious}
            className="flex h-8 w-8 items-center justify-center hover:bg-blue-100 text-gray-500 transition-colors border-r border-gray-200"
          >
            <span className="material-icons text-xl">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={actions.goToToday}
            className="hidden h-8 items-center justify-center px-4 text-sm font-medium text-black hover:bg-blue-100 transition-colors sm:flex"
          >
            Today
          </button>
          <button
            type="button"
            onClick={actions.goToNext}
            className="flex h-8 w-8 items-center justify-center hover:bg-blue-100 text-gray-500 transition-colors border-l border-gray-200"
          >
            <span className="material-icons text-xl">chevron_right</span>
          </button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { void actions.rescheduleTasks(); }}
            disabled={state.isRescheduling}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm transition-colors ${
              state.isRescheduling
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-primary text-white hover:bg-blue-300"
            }`}
          >
            <span className="material-icons text-lg mr-1.5">update</span>
            {state.isRescheduling ? "Rescheduling..." : "Reschedule"}
          </button>
        </div>
        <div className="hidden md:flex bg-gray-100 p-1 rounded-lg">
          {(
            [
              { label: "Month", value: Views.MONTH },
              { label: "Week", value: Views.WEEK },
              { label: "Day", value: Views.DAY },
              { label: "Agenda", value: Views.AGENDA },
            ] as const
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => actions.setView(item.value)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                state.view === item.value
                  ? "bg-white shadow-sm text-black"
                  : "text-gray-500 hover:bg-blue-100 hover:text-black"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <h2 className="text-xl font-semibold w-48 text-center uppercase tracking-wide text-black">
          {state.currentLabel}
        </h2>
      </div>
    </div>
    {state.dateStripDays.length > 0 && (
      <div
        className="mt-2 grid border-t border-gray-200 bg-white"
        style={{
          gridTemplateColumns: `${state.timeGutterWidth}px repeat(${state.dateStripDays.length}, minmax(0, 1fr))`,
        }}
      >
        <div className="border-r border-gray-200 bg-gray-50" />
        {state.dateStripDays.map((dayMoment) => {
          const isToday = dayMoment.isSame(moment(), "day");
          const isActiveDay = state.view === Views.DAY && dayMoment.isSame(moment(state.date), "day");
          return (
            <div
              key={dayMoment.format("YYYY-MM-DD")}
              className={`border-l border-gray-200 px-3 py-2 text-center ${
                isToday || isActiveDay
                  ? "calendar-day-header-highlight text-black"
                  : "bg-white text-gray-700"
              }`}
            >
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {dayMoment.format("ddd")}
              </p>
              <p className="text-sm font-semibold">
                {dayMoment.format("D MMM")}
              </p>
            </div>
          );
        })}
      </div>
    )}
  </header>
);

export default CalendarToolbar;
