import { memo, useEffect, useRef, useState, type RefObject } from "react";
import moment from "moment-timezone";
import { Views } from "react-big-calendar";
import type { UseCalendarReturn } from "@/hooks/calendar/useCalendar";

interface CalendarToolbarProps {
  headerRef: RefObject<HTMLElement | null>;
  calendarHeaderTopClass: string;
  state: Pick<
    UseCalendarReturn["state"],
    "view" | "date" | "currentLabel" | "dateStripDays" | "timeGutterWidth" | "isRescheduling" | "rescheduleWarnings" | "preference"
  >;
  actions: Pick<
    UseCalendarReturn["actions"],
    "setView" | "goToToday" | "goToPrevious" | "goToNext" | "rescheduleTasks" | "openCreateSidebar"
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
}: CalendarToolbarProps) => {
  const [isWarningsOpen, setIsWarningsOpen] = useState(false);
  const warningPanelRef = useRef<HTMLDivElement | null>(null);
  const rescheduleWarnings = state.rescheduleWarnings ?? [];
  const activeTimezone = state.preference?.timezone ?? "UTC";

  useEffect(() => {
    if (!isWarningsOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!warningPanelRef.current?.contains(event.target as Node)) {
        setIsWarningsOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isWarningsOpen]);

  return (
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
          <div className="relative flex items-center gap-2" ref={warningPanelRef}>
            {rescheduleWarnings.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsWarningsOpen((current) => !current)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-red-600 transition-colors hover:bg-gray-200"
                  aria-label={`Show ${rescheduleWarnings.length} scheduling warnings`}
                  aria-expanded={isWarningsOpen}
                >
                  <span className="material-icons text-xl">warning</span>
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 text-center text-[11px] font-semibold leading-5 text-white">
                    {rescheduleWarnings.length}
                  </span>
                </button>
                {isWarningsOpen ? (
                  <div className="absolute right-0 top-12 z-30 w-96 max-w-[calc(100vw-2rem)] rounded-xl border border-red-200 bg-background p-4 text-sm text-gray-900 shadow-lg">
                    <p className="font-semibold text-red-600">
                      {rescheduleWarnings.length === 1
                        ? "1 task could not be scheduled."
                        : `${rescheduleWarnings.length} tasks could not be scheduled.`}
                    </p>
                    <div className="mt-3 space-y-2 text-gray-700">
                      {rescheduleWarnings.map((warning) => (
                        <div
                          key={warning.taskId}
                          className="rounded-lg border border-gray-200 bg-gray-100 px-3 py-2"
                        >
                          <p className="font-medium text-gray-900">{warning.title}</p>
                          <p className="mt-1 text-sm text-gray-700">{warning.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}
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

            <button
              type="button"
              onClick={actions.openCreateSidebar}
              className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition-colors hover:bg-blue-300"
              aria-label="Add task or event"
              title="Add task or event"
            >
              <span className="material-icons text-xl">add</span>
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
            const isToday = dayMoment.isSame(moment().tz(activeTimezone), "day");
            const isActiveDay = state.view === Views.DAY && dayMoment.isSame(moment(state.date).tz(activeTimezone), "day");
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
};

export default memo(CalendarToolbar);
