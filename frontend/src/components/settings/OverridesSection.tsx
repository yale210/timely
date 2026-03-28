import { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Tooltip } from "@/components/ui";
import type { SpecialDate } from "@/types";
import * as specialDatesService from "@/services/specialDatesService";

const InfoLabel = ({
  label,
  tooltip,
}: {
  label: string;
  tooltip?: string;
}) => (
  <div className="flex items-center gap-2">
    <label className="block text-sm font-medium text-gray-900">
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

const OverridesSection = () => {
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

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Overrides</h2>
          <p className="mt-2 text-sm text-gray-600">
            Manage one-off dates that should be excluded from scheduling.
          </p>
        </div>

        <div className="sm:col-span-2">
          <InfoLabel
            label="Date overrides"
            tooltip="Block specific dates from scheduling when you need to be free."
          />
          <div className="mt-3 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setIsAddingSpecialDate(true)}
              className="inline-flex h-10 w-fit items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
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
                        className="mt-1 block w-full rounded-md bg-white px-3 py-2 outline outline-gray-300"
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
                        className="mt-1 block w-full rounded-md bg-white px-3 py-2 outline outline-gray-300"
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

export default OverridesSection;
