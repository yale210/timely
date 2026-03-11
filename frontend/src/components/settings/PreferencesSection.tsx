import type { Preference } from "@/types";

interface PreferencesSectionProps {
  pref: Preference | null;
  prefLoading: boolean;
  prefSaving: boolean;
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

const PreferencesSection = ({
  pref,
  prefLoading,
  prefSaving,
  prefError,
  fieldErrors,
  onPrefChange,
  onSave,
}: PreferencesSectionProps) => {
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
      <h2 className="text-lg font-semibold">Scheduling</h2>
      <p className="mt-2 text-sm text-gray-600">
        Set your day&apos;s start and end, and max hours of study time per day.
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
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="pref-day-start" className="block text-sm font-medium text-gray-900">
                Day start
              </label>
              <input
                id="pref-day-start"
                type="time"
                value={pref.day_start?.slice(0, 5) ?? "08:00"}
                onChange={(event) =>
                  onPrefChange({ ...pref, day_start: event.target.value })
                }
                className={`mt-2 bg-white px-3 py-2 block outline w-full rounded-md ${
                  fieldErrors.day_start ? "outline-red-300" : "outline-gray-300"
                } focus: outline-2 focus:outline-turquoise-600`}
              />
              {fieldErrors.day_start?.length ? (
                <div className="mt-1 text-xs text-red-700">
                  {fieldErrors.day_start.join(" ")}
                </div>
              ) : null}
            </div>

            <div>
              <label htmlFor="pref-day-end" className="block text-sm font-medium text-gray-900">
                Day end
              </label>
              <input
                id="pref-day-end"
                type="time"
                value={pref.day_end?.slice(0, 5) ?? "22:00"}
                onChange={(event) =>
                  onPrefChange({ ...pref, day_end: event.target.value })
                }
                className={`mt-2 bg-white px-3 py-2 block outline w-full rounded-md ${
                  fieldErrors.day_end ? "outline-red-300" : "outline-gray-300"
                } focus: outline-2 focus:outline-turquoise-600`}
              />
              {fieldErrors.day_end?.length ? (
                <div className="mt-1 text-xs text-red-700">
                  {fieldErrors.day_end.join(" ")}
                </div>
              ) : null}
            </div>

            <div>
              <label htmlFor="pref-max-hours" className="block text-sm font-medium text-gray-900">
                Max study hours per day
              </label>
              <input
                id="pref-max-hours"
                type="number"
                min={0}
                max={24}
                value={pref.max_hours_study_per_day ?? 6}
                onChange={(event) =>
                  onPrefChange({
                    ...pref,
                    max_hours_study_per_day: Number(event.target.value),
                  })
                }
                className={`mt-2 bg-white px-3 py-2 block outline w-full rounded-md ${
                  fieldErrors.max_hours_study_per_day ? "outline-red-300" : "outline-gray-300"
                } focus: outline-2 focus:outline-turquoise-600`}
              />
              {fieldErrors.max_hours_study_per_day?.length ? (
                <div className="mt-1 text-xs text-red-700">
                  {fieldErrors.max_hours_study_per_day.join(" ")}
                </div>
              ) : null}
            </div>

            <div className="sm:col-span-3">
              <div className="text-sm font-medium text-gray-900">Days off</div>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {dayLabels.map(([id, label]) => {
                  const selected = pref.days_off.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleDayOnOff(id)}
                      className={`rounded-md px-3 py-2 text-sm font-semibold ring-1 transition ${
                        selected
                          ? "bg-cyan-50 text-cyan-700 ring-cyan-200"
                          : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50"
                      }`}
                      aria-pressed={selected}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {fieldErrors.days_off?.length ? (
                <div className="mt-1 text-xs text-red-700">
                  {fieldErrors.days_off.join(" ")}
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSave}
              disabled={prefSaving}
              className="text-sm font-semibold text-red-600 rounded-md bg-turquoise-600 px-4 py-2
              hover:bg-turquoise-500 disabled:opacity-60"
            >
              {prefSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PreferencesSection;
