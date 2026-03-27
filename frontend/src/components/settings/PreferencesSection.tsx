import { useEffect, useMemo, useState } from "react";
import { Tooltip } from "@/components/ui";
import type { Preference } from "@/types";
import { getAvailableSchedulingDayMaxMinutes, getSchedulingDayMaxMinutes } from "@/utils/schedulingLimits";
import { validatePreference } from "@/utils/preferenceValidation";

interface PreferencesSectionProps {
  pref: Preference | null;
  prefLoading: boolean;
  prefSaving: boolean;
  prefDirty?: boolean;
  prefError: string | null;
  fieldErrors: Record<string, string[]>;
  onPrefChange: (pref: Preference) => void;
  onSave: () => void;
}

const dayLabels: [number, string][] = [
  [1, "Mon"],
  [2, "Tue"],
  [3, "Wed"],
  [4, "Thu"],
  [5, "Fri"],
  [6, "Sat"],
  [7, "Sun"],
];

const getTimezoneOptions = (): string[] => {
  if (typeof Intl.supportedValuesOf === "function") {
    return Intl.supportedValuesOf("timeZone");
  }

  return [
    "UTC",
    "Europe/London",
    "Europe/Paris",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];
};

const buildDefaultSchedule = (start: string, end: string) =>
  dayLabels.map(([day]) => ({ day, start, end }));

const InfoLabel = ({
  label,
  tooltip,
  htmlFor,
}: {
  label: string;
  tooltip?: string;
  htmlFor?: string;
}) => (
  <div className="flex items-center gap-2">
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-900">
      {label}
    </label>
    {tooltip ? (
      <Tooltip content={tooltip}>
        <button
          type="button"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500 hover:bg-gray-100"
          aria-label={`Explain ${label}`}
        >
          ?
        </button>
      </Tooltip>
    ) : null}
  </div>
);

const PreferencesSection = ({
  pref,
  prefLoading,
  prefSaving,
  prefDirty = false,
  prefError,
  fieldErrors,
  onPrefChange,
  onSave,
}: PreferencesSectionProps) => {
  const timezoneOptions = useMemo(() => getTimezoneOptions(), []);
  const liveFieldErrors = useMemo(
    () => (pref ? validatePreference(pref) : {}),
    [pref],
  );
  const displayFieldErrors = useMemo(() => ({
    ...fieldErrors,
    ...liveFieldErrors,
  }), [fieldErrors, liveFieldErrors]);
  const isUniformSchedule = useMemo(() => {
    const schedule = pref?.day_schedule ?? [];
    if (schedule.length === 0) return false;
    const first = schedule[0];
    return schedule.every((entry) => entry.start === first.start && entry.end === first.end);
  }, [pref?.day_schedule]);
  const [useSetAllDays, setUseSetAllDays] = useState(isUniformSchedule);
  const [maxHoursInput, setMaxHoursInput] = useState(
    pref ? String(pref.max_hours_study_per_day ?? 0) : "",
  );
  const [maxDaysAheadInput, setMaxDaysAheadInput] = useState(
    pref ? String(pref.max_days_ahead >= 365 ? 30 : pref.max_days_ahead) : "",
  );
  const hasBlockingErrors = Object.keys(liveFieldErrors).length > 0;
  const maxTaskHoursLimit = Math.max(0, Math.floor(getAvailableSchedulingDayMaxMinutes(pref) / 60));

  useEffect(() => {
    if (!pref || !useSetAllDays || pref.days_off.length === 0) {
      return;
    }

    // Uniform scheduling should override any stale per-day day-off selections.
    onPrefChange({
      ...pref,
      days_off: [],
    });
  }, [onPrefChange, pref, useSetAllDays]);

  const toggleDayOnOff = (dayId: number) => {
    if (!pref) {
      return;
    }
    const has = pref.days_off.includes(dayId);
    onPrefChange({
      ...pref,
      days_off: has ? pref.days_off.filter((day) => day !== dayId) : [...pref.days_off, dayId],
    });
  };

  return (
    <>
      <div className="w-full">
        <h2 className="text-lg font-semibold">Scheduling</h2>
      <p className="mt-2 text-sm text-gray-600">
        Configure when scheduling can happen and how far ahead the planner should search.
      </p>

      {prefError && (
        <div className="mt-4 text-sm text-red-700 rounded-md bg-red-50 p-3">
          {prefError}
        </div>
      )}

      {prefLoading && (
        <div className="mt-4 text-sm text-gray-600">
          Loading...
        </div>
      )}

      {!prefLoading && pref && (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm">
              <InfoLabel
                htmlFor="pref-max-hours"
                label="Max task time per day"
                tooltip="Limits how much task time the scheduler can place in a single day. Turning it off uses the full available daily window instead."
              />
              <div className="mt-2 flex items-center gap-3">
                <div className="text-xs font-medium text-gray-600">
                  {pref.limit_max_hours === false ? "No limit" : "Limit max hours"}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextValue = !(pref.limit_max_hours ?? true);
                    onPrefChange({
                      ...pref,
                      limit_max_hours: nextValue,
                    });
                    if (!nextValue) {
                      // "No limit" still stores a concrete cap equal to the widest available daily window.
                      const maxHours = Math.floor(getSchedulingDayMaxMinutes(pref) / 60);
                      onPrefChange({
                        ...pref,
                        limit_max_hours: false,
                        max_hours_study_per_day: maxHours,
                      });
                      setMaxHoursInput(String(maxHours));
                    } else if (maxHoursInput !== "" && !Number.isNaN(Number(maxHoursInput))) {
                      const nextHours = Math.min(Math.max(0, Number(maxHoursInput)), maxTaskHoursLimit);
                      onPrefChange({
                        ...pref,
                        limit_max_hours: true,
                        max_hours_study_per_day: nextHours,
                      });
                      setMaxHoursInput(String(nextHours));
                    }
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    pref.limit_max_hours === false ? "bg-gray-300" : "bg-primary"
                  }`}
                  aria-pressed={pref.limit_max_hours !== false}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      pref.limit_max_hours === false ? "translate-x-1" : "translate-x-4"
                    }`}
                  />
                </button>
              </div>
              {pref.limit_max_hours === false ? null : (
                <input
                  id="pref-max-hours"
                  type="number"
                  min={0}
                  max={maxTaskHoursLimit}
                  value={maxHoursInput}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    if (nextValue === "") {
                      setMaxHoursInput(nextValue);
                      return;
                    }
                    const parsed = Number(nextValue);
                    if (Number.isNaN(parsed)) return;
                    const clampedValue = Math.min(Math.max(0, parsed), maxTaskHoursLimit);
                    setMaxHoursInput(String(clampedValue));
                    onPrefChange({
                      ...pref,
                      max_hours_study_per_day: clampedValue,
                    });
                  }}
                  className={`mt-2 bg-white px-3 py-2 block outline w-full rounded-md ${
                    displayFieldErrors.max_hours_study_per_day ? "outline-red-300" : "outline-gray-300"
                  } max-w-[4.75rem] focus: outline-2 focus:outline-turquoise-600`}
                />
              )}
              {displayFieldErrors.max_hours_study_per_day?.length ? (
                <div className="mt-1 text-xs text-red-700">
                  {displayFieldErrors.max_hours_study_per_day.join(" ")}
                </div>
              ) : null}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm">
              <InfoLabel
                htmlFor="pref-max-days-ahead"
                label="Max schedule ahead"
                tooltip="The scheduler will search this many days ahead when auto-scheduling tasks."
              />
              <div className="mt-2 flex items-center gap-3">
                <div className="text-xs font-medium text-gray-600">
                  {pref.max_days_ahead >= 365 ? "No limit" : "Limit schedule ahead"}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const isUnlimited = pref.max_days_ahead >= 365;
                    if (isUnlimited) {
                      const parsed = Number(maxDaysAheadInput);
                      const nextValue = Number.isNaN(parsed) || parsed < 1 || parsed >= 365 ? 30 : parsed;
                      onPrefChange({
                        ...pref,
                        max_days_ahead: nextValue,
                      });
                      setMaxDaysAheadInput(String(nextValue));
                      return;
                    }

                    onPrefChange({
                      ...pref,
                      max_days_ahead: 365,
                    });
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    pref.max_days_ahead >= 365 ? "bg-gray-300" : "bg-primary"
                  }`}
                  aria-pressed={pref.max_days_ahead < 365}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      pref.max_days_ahead >= 365 ? "translate-x-1" : "translate-x-4"
                    }`}
                  />
                </button>
              </div>
              {pref.max_days_ahead >= 365 ? null : (
                <input
                  id="pref-max-days-ahead"
                  type="number"
                  min={1}
                  max={365}
                  value={maxDaysAheadInput}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setMaxDaysAheadInput(nextValue);
                    if (nextValue === "") {
                      return;
                    }
                    const parsed = Number(nextValue);
                    if (Number.isNaN(parsed)) return;
                    onPrefChange({
                      ...pref,
                      max_days_ahead: parsed,
                    });
                  }}
                  className={`mt-2 bg-white px-3 py-2 block outline w-full rounded-md ${
                    displayFieldErrors.max_days_ahead ? "outline-red-300" : "outline-gray-300"
                  } max-w-[4.75rem] focus:outline-2 focus:outline-turquoise-600`}
                />
              )}
              {displayFieldErrors.max_days_ahead?.length ? (
                <div className="mt-1 text-xs text-red-700">
                  {displayFieldErrors.max_days_ahead.join(" ")}
                </div>
              ) : null}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm">
              <InfoLabel
                htmlFor="pref-timezone"
                label="Timezone"
                tooltip="Used for scheduling, reminders, and date and time display throughout the app."
              />
              <select
                id="pref-timezone"
                value={pref.timezone}
                onChange={(event) => {
                  onPrefChange({
                    ...pref,
                    timezone: event.target.value,
                  });
                }}
                className={`mt-2 bg-white px-3 py-2 block outline w-full rounded-md ${
                  displayFieldErrors.timezone ? "outline-red-300" : "outline-gray-300"
                } max-w-[14rem] focus:outline-2 focus:outline-turquoise-600`}
              >
                {timezoneOptions.map((timeZone) => (
                  <option key={timeZone} value={timeZone}>
                    {timeZone}
                  </option>
                ))}
              </select>
              {displayFieldErrors.timezone?.length ? (
                <div className="mt-1 text-xs text-red-700">
                  {displayFieldErrors.timezone.join(" ")}
                </div>
              ) : null}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm">
              <InfoLabel
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
                      // When switching back to a uniform schedule, seed every day from the current base hours.
                      const baseStart = pref.day_schedule?.[0]?.start ?? pref.day_start?.slice(0, 5) ?? "08:00";
                      const baseEnd = pref.day_schedule?.[0]?.end ?? pref.day_end?.slice(0, 5) ?? "22:00";
                      const nextSchedule = buildDefaultSchedule(baseStart, baseEnd);
                      onPrefChange({
                        ...pref,
                        day_start: baseStart,
                        day_end: baseEnd,
                        day_schedule: nextSchedule,
                        days_off: [],
                      });
                    }
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    useSetAllDays
                      ? "bg-primary"
                      : "bg-gray-300"
                  }`}
                  aria-pressed={useSetAllDays}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      useSetAllDays
                        ? "translate-x-4"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {useSetAllDays ? (
                <div className="mt-3 grid grid-cols-[80px_1fr] items-center gap-y-2 text-xs font-medium text-gray-500">
                  <div />
                  <div className="flex justify-end gap-3">
                    <div className="w-45 text-left">Start</div>
                    <div className="w-45 text-left">End</div>
                  </div>
                </div>
              ) : null}
              {useSetAllDays ? (
                <div className="grid grid-cols-[80px_1fr] items-center gap-y-2">
                  <div className="text-sm font-medium text-gray-700">All</div>
                  <div className="flex justify-end gap-3">
                    <input
                      type="time"
                      value={pref.day_start?.slice(0, 5) ?? "08:00"}
                      onChange={(event) => {
                        const nextSchedule = buildDefaultSchedule(
                          event.target.value,
                          pref.day_end?.slice(0, 5) ?? "22:00",
                        );
                        onPrefChange({
                          ...pref,
                          day_start: event.target.value,
                          day_schedule: nextSchedule,
                        });
                      }}
                      className={`bg-white px-3 py-2 block outline w-45 rounded-md text-right ${
                        displayFieldErrors.day_start || displayFieldErrors.day_end || displayFieldErrors.day_schedule
                          ? "outline-red-300"
                          : "outline-gray-300"
                      } focus:outline-2 focus:outline-turquoise-600`}
                    />
                    <input
                      type="time"
                      value={pref.day_end?.slice(0, 5) ?? "22:00"}
                      onChange={(event) => {
                        const nextSchedule = buildDefaultSchedule(
                          pref.day_start?.slice(0, 5) ?? "08:00",
                          event.target.value,
                        );
                        onPrefChange({
                          ...pref,
                          day_end: event.target.value,
                          day_schedule: nextSchedule,
                        });
                      }}
                      className={`bg-white px-3 py-2 block outline w-45 rounded-md text-right ${
                        displayFieldErrors.day_start || displayFieldErrors.day_end || displayFieldErrors.day_schedule
                          ? "outline-red-300"
                          : "outline-gray-300"
                      } focus:outline-2 focus:outline-turquoise-600`}
                    />
                  </div>
                  {(displayFieldErrors.day_start?.length || displayFieldErrors.day_end?.length || displayFieldErrors.day_schedule?.length) ? (
                    <div className="col-start-2 mt-2 text-xs text-red-700">
                      {displayFieldErrors.day_start?.join(" ")} {displayFieldErrors.day_end?.join(" ")} {displayFieldErrors.day_schedule?.join(" ")}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {!useSetAllDays ? (
                <div className="mt-3 grid grid-cols-1 gap-3">
                <div className="grid grid-cols-[80px_1fr] items-center gap-y-2 text-xs font-medium text-gray-500">
                  <div />
                  <div className="flex justify-end gap-3">
                    <div className="w-45 text-left">Start</div>
                    <div className="w-45 text-left">End</div>
                    <div className="w-15 text-right">Day off</div>
                  </div>
                </div>
                {(pref.day_schedule && pref.day_schedule.length > 0
                  ? pref.day_schedule
                  : buildDefaultSchedule(
                    pref.day_start?.slice(0, 5) ?? "08:00",
                    pref.day_end?.slice(0, 5) ?? "22:00",
                  )
                ).map((entry) => {
                  const isDayOff = pref.days_off.includes(entry.day);
                  return (
                  <div
                    key={entry.day}
                    className="grid grid-cols-[80px_1fr] items-center gap-y-2"
                  >
                    <div className="text-sm font-medium text-gray-700">
                      {dayLabels.find(([day]) => day === entry.day)?.[1] ?? `Day ${entry.day}`}
                    </div>
                    <div className="flex justify-end gap-3">
                      <input
                        type="time"
                        value={entry.start}
                        disabled={isDayOff}
                        onChange={(event) => {
                          const nextSchedule = (pref.day_schedule && pref.day_schedule.length > 0
                            ? pref.day_schedule
                            : buildDefaultSchedule(
                              pref.day_start?.slice(0, 5) ?? "08:00",
                              pref.day_end?.slice(0, 5) ?? "22:00",
                            )
                          ).map((item) =>
                            item.day === entry.day ? { ...item, start: event.target.value } : item
                          );
                          onPrefChange({
                            ...pref,
                            day_schedule: nextSchedule,
                            day_start: nextSchedule[0]?.start ?? pref.day_start,
                            day_end: nextSchedule[0]?.end ?? pref.day_end,
                          });
                        }}
                        className={`bg-white px-3 py-2 block outline w-45 rounded-md text-right ${
                          displayFieldErrors.day_schedule ? "outline-red-300" : "outline-gray-300"
                        } focus:outline-2 focus:outline-turquoise-600 ${isDayOff ? "opacity-60" : ""}`}
                      />
                      <input
                        type="time"
                        value={entry.end}
                        disabled={isDayOff}
                        onChange={(event) => {
                          const nextSchedule = (pref.day_schedule && pref.day_schedule.length > 0
                            ? pref.day_schedule
                            : buildDefaultSchedule(
                              pref.day_start?.slice(0, 5) ?? "08:00",
                              pref.day_end?.slice(0, 5) ?? "22:00",
                            )
                          ).map((item) =>
                            item.day === entry.day ? { ...item, end: event.target.value } : item
                          );
                          onPrefChange({
                            ...pref,
                            day_schedule: nextSchedule,
                            day_start: nextSchedule[0]?.start ?? pref.day_start,
                            day_end: nextSchedule[0]?.end ?? pref.day_end,
                          });
                        }}
                        className={`bg-white px-3 py-2 block outline w-45 rounded-md text-right ${
                          displayFieldErrors.day_schedule ? "outline-red-300" : "outline-gray-300"
                        } focus:outline-2 focus:outline-turquoise-600 ${isDayOff ? "opacity-60" : ""}`}
                      />
                      <div className="flex w-15 items-center justify-end">
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
              ) : null}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSave}
              disabled={prefSaving || hasBlockingErrors || !prefDirty}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                prefSaving || hasBlockingErrors || !prefDirty
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-blue-300"
              }`}
            >
              {prefSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default PreferencesSection;
