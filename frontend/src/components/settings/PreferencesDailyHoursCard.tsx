import { useEffect, useMemo, useState } from "react";
import type { Preference } from "@/types";
import SettingsInfoLabel from "@/components/settings/SettingsInfoLabel";
import { buildDefaultSchedule, dayLabels } from "@/components/settings/preferencesSectionUtils";

interface PreferencesDailyHoursCardProps {
  pref: Preference;
  displayFieldErrors: Record<string, string[]>;
  onPrefChange: (pref: Preference) => void;
}

const inputClassName = (hasErrors: boolean, isDayOff = false) =>
  `bg-white px-3 py-2 block w-full min-w-0 rounded-md text-left outline sm:w-45 sm:text-right ${
    hasErrors ? "outline-red-300" : "outline-gray-300"
  } focus:outline-2 focus:outline-turquoise-600 ${isDayOff ? "opacity-60" : ""}`;

const PreferencesDailyHoursCard = ({
  pref,
  displayFieldErrors,
  onPrefChange,
}: PreferencesDailyHoursCardProps) => {
  const isUniformSchedule = useMemo(() => {
    const schedule = pref.day_schedule ?? [];
    if (schedule.length === 0) {
      return false;
    }
    const first = schedule[0];
    return schedule.every((entry) => entry.start === first.start && entry.end === first.end);
  }, [pref.day_schedule]);

  const [useSetAllDays, setUseSetAllDays] = useState(isUniformSchedule);

  useEffect(() => {
    setUseSetAllDays(isUniformSchedule);
  }, [isUniformSchedule]);

  useEffect(() => {
    if (!useSetAllDays || pref.days_off.length === 0) {
      return;
    }

    onPrefChange({
      ...pref,
      days_off: [],
    });
  }, [onPrefChange, pref, useSetAllDays]);

  const toggleDayOnOff = (dayId: number) => {
    const hasDayOff = pref.days_off.includes(dayId);
    onPrefChange({
      ...pref,
      days_off: hasDayOff
        ? pref.days_off.filter((day) => day !== dayId)
        : [...pref.days_off, dayId],
    });
  };

  const schedule = pref.day_schedule?.length
    ? pref.day_schedule
    : buildDefaultSchedule(
        pref.day_start?.slice(0, 5) ?? "08:00",
        pref.day_end?.slice(0, 5) ?? "22:00",
      );
  const hasScheduleErrors = Boolean(
    displayFieldErrors.day_start || displayFieldErrors.day_end || displayFieldErrors.day_schedule,
  );

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm">
      <SettingsInfoLabel
        label="Daily hours"
        tooltip="Tasks will be auto-scheduled during these hours."
      />
      <div className="mt-5 flex items-center gap-3">
        <div className="text-xs font-medium text-gray-600">
          {useSetAllDays ? "Set all days" : "Set per day"}
        </div>
        <button
          type="button"
          onClick={() => {
            const nextValue = !useSetAllDays;
            setUseSetAllDays(nextValue);
            if (nextValue) {
              const baseStart = pref.day_schedule?.[0]?.start ?? pref.day_start?.slice(0, 5) ?? "08:00";
              const baseEnd = pref.day_schedule?.[0]?.end ?? pref.day_end?.slice(0, 5) ?? "22:00";
              onPrefChange({
                ...pref,
                day_start: baseStart,
                day_end: baseEnd,
                day_schedule: buildDefaultSchedule(baseStart, baseEnd),
                days_off: [],
              });
            }
          }}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            useSetAllDays ? "bg-primary" : "bg-gray-300"
          }`}
          aria-pressed={useSetAllDays}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
              useSetAllDays ? "translate-x-4" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {useSetAllDays ? (
        <>
          <div className="mt-3 hidden grid-cols-[80px_1fr] items-center gap-y-2 text-xs font-medium text-gray-500 sm:grid">
            <div />
            <div className="flex justify-end gap-3">
              <div className="w-45 text-left">Start</div>
              <div className="w-45 text-left">End</div>
            </div>
          </div>
          <div className="grid grid-cols-1 items-start gap-y-2 sm:grid-cols-[80px_1fr] sm:items-center">
            <div className="text-sm font-medium text-gray-700">All</div>
            <div className="grid min-w-0 gap-2 sm:flex sm:justify-end sm:gap-3">
              <label className="block min-w-0">
                <span className="mb-1 block text-xs font-medium text-gray-500 sm:hidden">Start</span>
                <input
                  type="time"
                  value={pref.day_start?.slice(0, 5) ?? "08:00"}
                  onChange={(event) => {
                    onPrefChange({
                      ...pref,
                      day_start: event.target.value,
                      day_schedule: buildDefaultSchedule(
                        event.target.value,
                        pref.day_end?.slice(0, 5) ?? "22:00",
                      ),
                    });
                  }}
                  className={inputClassName(hasScheduleErrors)}
                />
              </label>
              <label className="block min-w-0">
                <span className="mb-1 block text-xs font-medium text-gray-500 sm:hidden">End</span>
                <input
                  type="time"
                  value={pref.day_end?.slice(0, 5) ?? "22:00"}
                  onChange={(event) => {
                    onPrefChange({
                      ...pref,
                      day_end: event.target.value,
                      day_schedule: buildDefaultSchedule(
                        pref.day_start?.slice(0, 5) ?? "08:00",
                        event.target.value,
                      ),
                    });
                  }}
                  className={inputClassName(hasScheduleErrors)}
                />
              </label>
            </div>
            {hasScheduleErrors ? (
                <div className="mt-2 text-xs text-red-700 sm:col-start-2">
                  {displayFieldErrors.day_start?.join(" ")} {displayFieldErrors.day_end?.join(" ")} {displayFieldErrors.day_schedule?.join(" ")}
                </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3">
          <div className="hidden grid-cols-[80px_1fr] items-center gap-y-2 text-xs font-medium text-gray-500 sm:grid">
            <div />
            <div className="flex justify-end gap-3">
              <div className="w-45 text-left">Start</div>
              <div className="w-45 text-left">End</div>
              <div className="w-15 text-right">Day off</div>
            </div>
          </div>
          {schedule.map((entry) => {
            const isDayOff = pref.days_off.includes(entry.day);
            return (
              <div
                key={entry.day}
                className="grid grid-cols-[56px_minmax(0,1fr)] items-start gap-y-2 sm:grid-cols-[80px_1fr] sm:items-center"
              >
                <div className="pt-7 text-sm font-medium text-gray-700 sm:pt-0">
                  {dayLabels.find(([day]) => day === entry.day)?.[1] ?? `Day ${entry.day}`}
                </div>
                <div className="grid min-w-0 gap-2 sm:flex sm:justify-end sm:gap-3">
                  <label className="block min-w-0">
                    <span className="mb-1 block text-xs font-medium text-gray-500 sm:hidden">Start</span>
                    <input
                      type="time"
                      value={entry.start}
                      disabled={isDayOff}
                      onChange={(event) => {
                        const nextSchedule = schedule.map((item) => (
                          item.day === entry.day ? { ...item, start: event.target.value } : item
                        ));
                        onPrefChange({
                          ...pref,
                          day_schedule: nextSchedule,
                          day_start: nextSchedule[0]?.start ?? pref.day_start,
                          day_end: nextSchedule[0]?.end ?? pref.day_end,
                        });
                      }}
                      className={inputClassName(Boolean(displayFieldErrors.day_schedule), isDayOff)}
                    />
                  </label>
                  <label className="block min-w-0">
                    <span className="mb-1 block text-xs font-medium text-gray-500 sm:hidden">End</span>
                    <input
                      type="time"
                      value={entry.end}
                      disabled={isDayOff}
                      onChange={(event) => {
                        const nextSchedule = schedule.map((item) => (
                          item.day === entry.day ? { ...item, end: event.target.value } : item
                        ));
                        onPrefChange({
                          ...pref,
                          day_schedule: nextSchedule,
                          day_start: nextSchedule[0]?.start ?? pref.day_start,
                          day_end: nextSchedule[0]?.end ?? pref.day_end,
                        });
                      }}
                      className={inputClassName(Boolean(displayFieldErrors.day_schedule), isDayOff)}
                    />
                  </label>
                  <div className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 sm:w-15 sm:justify-end sm:border-0 sm:px-0 sm:py-0">
                    <span className="text-xs font-medium text-gray-500 sm:hidden">Day off</span>
                    <button
                      type="button"
                      onClick={() => toggleDayOnOff(entry.day)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        isDayOff ? "bg-gray-400" : "bg-gray-200"
                      }`}
                      aria-pressed={isDayOff}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                          isDayOff ? "translate-x-4" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {displayFieldErrors.day_schedule?.length ? (
            <div className="text-xs text-red-700">
              {displayFieldErrors.day_schedule.join(" ")}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default PreferencesDailyHoursCard;
