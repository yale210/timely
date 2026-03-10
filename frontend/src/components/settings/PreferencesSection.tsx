import { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import type { Preference, SpecialDate } from "@/types";
import * as specialDatesService from "@/services/specialDatesService";

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

const buildDefaultSchedule = (start: string, end: string) =>
  dayLabels.map(([day]) => ({ day, start, end }));

const PreferencesSection = ({
  pref,
  prefLoading,
  prefSaving,
  prefError,
  fieldErrors,
  onPrefChange,
  onSave,
}: PreferencesSectionProps) => {
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [specialDateLoading, setSpecialDateLoading] = useState(false);
  const [specialDateError, setSpecialDateError] = useState<string | null>(null);
  const [specialDateValue, setSpecialDateValue] = useState("");
  const [specialDateLabel, setSpecialDateLabel] = useState("");
  const [isAddingSpecialDate, setIsAddingSpecialDate] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadSpecialDates = async () => {
      setSpecialDateLoading(true);
      setSpecialDateError(null);
      try {
        const data = await specialDatesService.getSpecialDates();
        if (isMounted) {
          setSpecialDates(data);
        }
      } catch {
        if (isMounted) {
          setSpecialDateError("Unable to load date overrides.");
        }
      } finally {
        if (isMounted) {
          setSpecialDateLoading(false);
        }
      }
    };
    void loadSpecialDates();
    return () => {
      isMounted = false;
    };
  }, []);

  const sortedSpecialDates = useMemo(
    () => [...specialDates].sort((a, b) => a.date.localeCompare(b.date)),
    [specialDates],
  );

  const addSpecialDate = async () => {
    if (!specialDateValue) {
      setSpecialDateError("Please select a date.");
      return;
    }
    setSpecialDateError(null);
    try {
      const created = await specialDatesService.createSpecialDate({
        date: specialDateValue,
        text: specialDateLabel.trim(),
      });
      setSpecialDates((prev) => [...prev, created]);
      setSpecialDateValue("");
      setSpecialDateLabel("");
      setIsAddingSpecialDate(false);
    } catch {
      setSpecialDateError("Unable to save date override.");
    }
  };

  const removeSpecialDate = async (id: number) => {
    try {
      await specialDatesService.deleteSpecialDate(id);
      setSpecialDates((prev) => prev.filter((item) => item.id !== id));
    } catch {
      setSpecialDateError("Unable to remove date override.");
    }
  };
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
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="text-sm font-medium text-gray-900">Daily hours</div>
              <p className="mt-1 text-xs text-gray-500">
                Tasks will be auto-scheduled during these hours.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3">
                <div className="grid grid-cols-[80px_1fr] items-center gap-y-2 text-xs font-medium text-gray-500">
                  <div />
                  <div className="flex justify-end gap-3">
                    <div className="w-[180px] text-left">Start</div>
                    <div className="w-[180px] text-left">End</div>
                    <div className="w-[60px] text-right">Day off</div>
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
                        className={`bg-white px-3 py-2 block outline w-[180px] rounded-md text-right ${
                          fieldErrors.day_schedule ? "outline-red-300" : "outline-gray-300"
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
                        className={`bg-white px-3 py-2 block outline w-[180px] rounded-md text-right ${
                          fieldErrors.day_schedule ? "outline-red-300" : "outline-gray-300"
                        } focus:outline-2 focus:outline-turquoise-600 ${isDayOff ? "opacity-60" : ""}`}
                      />
                      <div className="flex w-[60px] items-center justify-end">
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
                {fieldErrors.day_schedule?.length ? (
                  <div className="text-xs text-red-700">
                    {fieldErrors.day_schedule.join(" ")}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="pref-max-hours" className="block text-sm font-medium text-gray-900">
                Max task time per day
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

            <div className="sm:col-span-2">
              <div className="text-sm font-medium text-gray-900">Date overrides</div>
              <p className="mt-1 text-xs text-gray-500">
                Block specific dates from scheduling when you need to be free.
              </p>
              <div className="mt-3 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddingSpecialDate(true)}
                  className="h-10 w-fit rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2"
                >
                  <span className="material-icons text-base">add</span>
                  Add date override
                </button>
                {specialDateError && (
                  <div className="text-xs text-red-700">{specialDateError}</div>
                )}
                {specialDateLoading ? (
                  <div className="text-xs text-gray-500">Loading overrides...</div>
                ) : (
                  <div className="space-y-2">
                    {sortedSpecialDates.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{item.date}</div>
                          {item.text ? (
                            <div className="text-xs text-gray-500">{item.text}</div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => void removeSpecialDate(item.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-red-600 hover:bg-red-50"
                          aria-label="Remove date override"
                        >
                          <span className="material-icons text-lg">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSave}
              disabled={prefSaving}
              className="text-sm font-semibold text-white rounded-md border border-blue-600 bg-blue-600 px-4 py-2 shadow-sm transition-colors hover:bg-blue-500 disabled:opacity-60"
            >
              {prefSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      )}
      </div>
      <Transition show={isAddingSpecialDate} as={Fragment}>
      <Dialog as="div" className="relative z-60" onClose={() => setIsAddingSpecialDate(false)}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative w-full max-w-lg transform overflow-hidden rounded-lg bg-white px-6 pb-5 pt-5 text-left shadow-xl transition-all">
                <DialogTitle className="text-lg font-semibold text-black">
                  Add date override
                </DialogTitle>
                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="special-date" className="block text-xs font-medium text-gray-600">
                      Date
                    </label>
                    <input
                      id="special-date"
                      type="date"
                      value={specialDateValue}
                      onChange={(event) => setSpecialDateValue(event.target.value)}
                      className="mt-1 bg-white px-3 py-2 block outline w-full rounded-md outline-gray-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="special-date-label" className="block text-xs font-medium text-gray-600">
                      Label (optional)
                    </label>
                    <input
                      id="special-date-label"
                      type="text"
                      value={specialDateLabel}
                      onChange={(event) => setSpecialDateLabel(event.target.value)}
                      placeholder="e.g., Holiday"
                      className="mt-1 bg-white px-3 py-2 block outline w-full rounded-md outline-gray-300"
                    />
                  </div>
                  {specialDateError && (
                    <div className="text-xs text-red-700">{specialDateError}</div>
                  )}
                </div>
                <div className="mt-5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingSpecialDate(false);
                      setSpecialDateValue("");
                      setSpecialDateLabel("");
                      setSpecialDateError(null);
                    }}
                    className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void addSpecialDate()}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Add
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
      </Transition>
    </>
  );
};

export default PreferencesSection;
