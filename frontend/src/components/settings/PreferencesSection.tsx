import { useMemo, useState } from "react";
import PreferencesDailyHoursCard from "@/components/settings/PreferencesDailyHoursCard";
import SettingsInfoLabel from "@/components/settings/SettingsInfoLabel";
import type { Preference } from "@/types";
import { getAvailableSchedulingDayMaxMinutes, getSchedulingDayMaxMinutes } from "@/utils/schedulingLimits";
import { validatePreference } from "@/utils/preferenceValidation";
import { getTimezoneOptions } from "@/components/settings/preferencesSectionUtils";

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
  const [maxHoursInput, setMaxHoursInput] = useState(
    pref ? String(pref.max_hours_study_per_day ?? 0) : "",
  );
  const [maxDaysAheadInput, setMaxDaysAheadInput] = useState(
    pref ? String(pref.max_days_ahead >= 365 ? 30 : pref.max_days_ahead) : "",
  );
  const hasBlockingErrors = Object.keys(liveFieldErrors).length > 0;
  const maxTaskHoursLimit = Math.max(0, Math.floor(getAvailableSchedulingDayMaxMinutes(pref) / 60));

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
              <SettingsInfoLabel
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
              <SettingsInfoLabel
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
              <SettingsInfoLabel
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

          <PreferencesDailyHoursCard
            pref={pref}
            displayFieldErrors={displayFieldErrors}
            onPrefChange={onPrefChange}
          />
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
