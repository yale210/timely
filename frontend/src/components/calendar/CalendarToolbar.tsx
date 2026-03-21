
import { Views } from "react-big-calendar";
import type { UseCalendarReturn } from "@/hooks/calendar/useCalendar";

interface CalendarToolbarProps {
  state: Pick<UseCalendarReturn["state"], "view" | "currentLabel">;
  loading: Pick<UseCalendarReturn["loading"], "scheduling" | "unscheduling" | "exporting" | "importing">;
  actions: Pick<
    UseCalendarReturn["actions"],
    "setView" | "goToToday" | "goToPrevious" | "goToNext" | "scheduleTasks" | "unscheduleTasks" | "exportEvents" | "importEvents"
  >;
}

/**
 * Renders the calendar toolbar controls.
 * @param props - Toolbar props.
 * @param props.state - Toolbar state values.
 * @param props.loading - Toolbar loading values.
 * @param props.actions - Toolbar action callbacks.
 * @returns The calendar toolbar.
 */
const CalendarToolbar = ({
  state,
  loading,
  actions,
}: CalendarToolbarProps) => (
  <header className="z-10 flex-none border-b border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
      <div className="flex items-center gap-6">
        <h1 className="text-2xl font-bold tracking-tight text-black">
          Calendar
        </h1>
        <div className="hidden rounded-lg bg-gray-100 p-1 md:flex">
          {[
            { label: "Month", value: Views.MONTH },
            { label: "Week", value: Views.WEEK },
            { label: "Day", value: Views.DAY },
            { label: "Agenda", value: Views.AGENDA },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => actions.setView(item.value)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-all ${
                state.view === item.value
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-500 hover:bg-blue-100 hover:text-black"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void actions.scheduleTasks();
            }}
            disabled={loading.scheduling || loading.unscheduling}
            className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
              loading.scheduling || loading.unscheduling
                ? "cursor-not-allowed bg-gray-200 text-gray-500"
                : "bg-primary text-white hover:bg-blue-300"
            }`}
          >
            <span className="material-icons mr-1.5 text-lg">auto_awesome</span>
            {loading.scheduling ? "Scheduling..." : "Schedule Tasks"}
          </button>
          <button
            type="button"
            onClick={() => {
              void actions.unscheduleTasks();
            }}
            disabled={loading.scheduling || loading.unscheduling}
            className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
              loading.scheduling || loading.unscheduling
                ? "cursor-not-allowed bg-gray-200 text-gray-500"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="material-icons mr-1.5 text-lg">event_busy</span>
            {loading.unscheduling ? "Unscheduling..." : "Unschedule Tasks"}
          </button>
          //
          <button
            type="button"
            onClick={() => {
              void actions.exportEvents();
            }}
            disabled={loading.exporting}
            className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
              loading.exporting
                ? "cursor-not-allowed bg-gray-200 text-gray-500"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="material-icons mr-1.5 text-lg">event_busy</span>
            {loading.exporting ? "Exporting..." : "Export Events"}
          </button>


          //
    

          <button
            type="button"
            onClick={() => {
              const input = document.createElement("input")
              input.type = "file"
              input.onchange = (event) => {
                const target = event.target
                
                if (target instanceof HTMLInputElement && target.files) {
                  const file = target.files[0]
                  actions.importEvents(file)
                }
              }
              input.click()
            }}
            
            className={`flex items-center rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors ${
              loading.importing
                ? "cursor-not-allowed bg-gray-200 text-gray-500"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="material-icons mr-1.5 text-lg">event_busy</span>
            {loading.importing ? "Importing..." : "Import Events"}
          </button>


          //
        </div>
        <div className="flex items-center overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={actions.goToPrevious}
            className="border-r border-gray-200 p-2 text-gray-500 transition-colors hover:bg-blue-100"
          >
            <span className="material-icons text-xl">chevron_left</span>
          </button>
          <button
            type="button"
            onClick={actions.goToToday}
            className="px-4 py-2 font-medium text-black transition-colors hover:bg-blue-100"
          >
            Today
          </button>
          <button
            type="button"
            onClick={actions.goToNext}
            className="border-l border-gray-200 p-2 text-gray-500 transition-colors hover:bg-blue-100"
          >
            <span className="material-icons text-xl">chevron_right</span>
          </button>
        </div>
        <h2 className="w-48 text-center text-xl font-semibold uppercase tracking-wide text-black">
          {state.currentLabel}
        </h2>
      </div>
    </div>
  </header>
);



export default CalendarToolbar;
