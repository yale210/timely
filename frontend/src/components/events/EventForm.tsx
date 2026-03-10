import { useState, useEffect, useRef, type FormEvent, type MouseEvent } from "react";
import { CategoryColourPicker, CategoryMultiSelect, Tooltip } from "@/components";
import { getOverrideColour } from "@/utils/colorUtils";
import { type Category, type Event, type EventSubmission } from "@/types";
import { usePushSubscription } from "@/hooks/notifications/usePushSubscription";
import { getServerTime } from "@/services/eventService";
/**
 * Safely convert a Date to ISO string, returning "" for invalid dates.
 * @param d - The date object to convert.
 */
const safeToISOString = (d: Date): string =>
  Number.isNaN(d.getTime()) ? "" : d.toISOString();

type TimeUnit = "minutes" | "hours" | "days" | "weeks" | "months" | "years";

interface ReminderFormState {
  send_email: boolean;
  send_push: boolean;
  value: number;
  unit: TimeUnit;
}

interface NormalisedEventReminder {
  send_email: boolean;
  send_push: boolean;
  minutes_before: number;
}

interface NormalisedEventSubmission {
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  colour: string;
  categories: number[];
  recurrence_interval: Event["recurrence_interval"];
  recurrence_end: string | null;
  reminders: NormalisedEventReminder[];
}

const UNIT_TO_MINUTES: Record<TimeUnit, number> = {
  minutes: 1,
  hours: 60,
  days: 1_440,
  weeks: 10_080,
  months: 43_200,
  years: 525_600,
};

const UNIT_LABELS: { value: TimeUnit; label: string }[] = [
  { value: "minutes", label: "minutes" },
  { value: "hours", label: "hours" },
  { value: "days", label: "days" },
  { value: "weeks", label: "weeks" },
  { value: "months", label: "months" },
  { value: "years", label: "years" },
];
const CLOCK_SKEW_WARNING_THRESHOLD_MS = 5 * 60 * 1_000;
const INITIAL_VALIDATION_NOW_MS = Date.now();
const getCurrentTimestamp = (): number => Date.now();
const ONE_HOUR_MS = 60 * 60 * 1_000;

const withTime = (base: Date, hour: number, minute: number): Date => {
  const value = new Date(base);
  value.setHours(hour, minute, 0, 0);
  return value;
};

const toLocalDateInputValue = (value: Date): string => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toMinutesBefore = (val: number, unit: TimeUnit): number =>
  val * UNIT_TO_MINUTES[unit];

const normaliseEventSubmission = (
  submission: EventSubmission,
): NormalisedEventSubmission => ({
  title: submission.title ?? "",
  description: submission.description ?? "",
  location: submission.location ?? "",
  start_time: submission.start_time ?? "",
  end_time: submission.end_time ?? "",
  colour: submission.colour ?? "",
  categories: [...(submission.categories ?? [])].sort((a, b) => a - b),
  recurrence_interval: submission.recurrence_interval ?? null,
  recurrence_end: submission.recurrence_end ?? null,
  reminders: [...(submission.reminders ?? [])]
    .map((reminder) => ({
      send_email: Boolean(reminder.send_email),
      send_push: Boolean(reminder.send_push),
      minutes_before: Number(reminder.minutes_before),
    }))
    .sort((left, right) => {
      if (left.minutes_before !== right.minutes_before) {
        return left.minutes_before - right.minutes_before;
      }
      if (left.send_email !== right.send_email) {
        return Number(left.send_email) - Number(right.send_email);
      }
      return Number(left.send_push) - Number(right.send_push);
    }),
});

const isEventSubmissionEqual = (
  left: NormalisedEventSubmission,
  right: NormalisedEventSubmission,
): boolean => JSON.stringify(left) === JSON.stringify(right);

const fromMinutesBefore = (minutes: number): { value: number; unit: TimeUnit } => {
  const units: TimeUnit[] = ["years", "months", "weeks", "days", "hours", "minutes"];
  for (const unit of units) {
    const factor = UNIT_TO_MINUTES[unit];
    if (minutes >= factor && minutes % factor === 0) {
      return { value: minutes / factor, unit };
    }
  }
  return { value: minutes, unit: "minutes" };
};

interface EventFormProps {
  initialData?: Event;
  categories: Category[];
  onCreateCategory: (text: string) => Promise<Category>;
  onUpdateCategory: (id: number, patch: { colour?: string | null; colour_override?: boolean }) => Promise<Category>;
  onDeleteCategory: (id: number) => Promise<void>;
  onSubmit: (data: EventSubmission) => void;
  onCancel: () => void;
  onDataChange?: (data: Partial<Event>) => void;
}

/**
 * A functional component that renders a form for creating or editing an event.
 * @param props - The properties for the EventForm component.
 * @param props.initialData - The initial data to populate the form with.
 * @param props.categories - The list of available categories.
 * @param props.onCreateCategory - Callback to create a new category.
 * @param props.onUpdateCategory - Callback to update an existing category.
 * @param props.onDeleteCategory - Callback to delete a category.
 * @param props.onSubmit - The callback function to handle form submission.
 * @param props.onCancel - The callback function to handle form cancellation.
 * @param props.onDataChange - An optional callback function to handle data changes.
 * @returns The rendered event form component.
 */
const EventForm = ({
  initialData,
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onSubmit,
  onCancel,
  onDataChange,
}: EventFormProps) => {
  const { isSubscribed, permission, subscribe, loading: pushLoading } = usePushSubscription();

  const fallbackStartDateTime = withTime(new Date(), 10, 0);
  const initialStartDateTime = initialData?.start_time
    ? new Date(initialData.start_time)
    : fallbackStartDateTime;
  const initialEndDateTime = initialData?.end_time
    ? new Date(initialData.end_time)
    : initialData?.start_time
      ? new Date(initialStartDateTime.getTime() + ONE_HOUR_MS)
      : withTime(initialStartDateTime, 11, 0);
  const hasInitialStart = Boolean(initialData?.start_time);
  const hasInitialEnd = Boolean(initialData?.end_time);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");
  
  const [startDate, setStartDate] = useState(
    hasInitialStart ? toLocalDateInputValue(initialStartDateTime) : ""
  );
  const [startTime, setStartTime] = useState(
    initialStartDateTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  );

  useEffect(() => {
    if (onDataChange) {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      onDataChange({
        title,
        description,
        start_time: safeToISOString(startDateTime),
      });
    }
  }, [title, description, startDate, startTime, onDataChange]);
  
  const [endDate, setEndDate] = useState(
    hasInitialEnd ? toLocalDateInputValue(initialEndDateTime) : ""
  );
  const [endTime, setEndTime] = useState(
    initialEndDateTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  );

  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    initialData?.categories?.map((c) => (typeof c === "object" ? c.id : c)) ?? []
  );
  const defaultColour = "#f97316";
  const [colour, setColour] = useState(initialData?.colour ?? defaultColour);
  const [showPickerMenu, setShowPickerMenu] = useState(false);
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number } | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [colourInput, setColourInput] = useState(colour);
  const [colourError, setColourError] = useState<string | null>(null);
  const selectedCategoryObjects = categories.filter((category) =>
    selectedCategories.includes(category.id),
  );
  const overrideColour = getOverrideColour(selectedCategoryObjects);
  const isColourLocked = Boolean(overrideColour);
  const displayColour = overrideColour ?? colour;
  const handleColourPickerToggle = (event: MouseEvent<HTMLButtonElement>) => {
    if (isColourLocked) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPickerPosition({ top: rect.bottom + 8, left: rect.right - 272 });
    setColourInput(displayColour);
    setColourError(null);
    setShowPickerMenu((prev) => !prev);
  };
  const parseColourInput = (value: string): string | null => {
    const trimmed = value.trim().toLowerCase();
    if (trimmed.startsWith("#") && trimmed.length === 7) {
      return trimmed;
    }
    const match = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/
      .exec(trimmed);
    if (!match) return null;
    const [r, g, b] = match.slice(1).map((v) => Math.min(255, Math.max(0, Number(v))));
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };
  
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(
    Boolean(initialData?.recurrence_interval)
  );
  const [recurrenceInterval, setRecurrenceInterval] = useState<string | null>(
    initialData?.recurrence_interval ?? null
  );
  const [recurrenceEnd, setRecurrenceEnd] = useState<string>(
    initialData?.recurrence_end ?? ""
  );

  const [reminders, setReminders] = useState<ReminderFormState[]>(
    initialData?.reminders?.map(({ send_email, send_push, minutes_before }) => {
      const { value, unit } = fromMinutesBefore(minutes_before);
      return { send_email, send_push, value, unit };
    }) ?? []
  );
  const [pushDeniedNotice, setPushDeniedNotice] = useState<Record<number, boolean>>({});
  const [validationNowMs, setValidationNowMs] = useState<number>(
    INITIAL_VALIDATION_NOW_MS,
  );
  const [serverTimeOffsetMs, setServerTimeOffsetMs] = useState<number | null>(null);
  const [clockSkewWarning, setClockSkewWarning] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const syncServerTime = async () => {
      try {
        const { server_time: serverTime } = await getServerTime();
        const offsetMs = new Date(serverTime).getTime() - getCurrentTimestamp();
        if (!isMounted) {
          return;
        }
        setServerTimeOffsetMs(offsetMs);
        setValidationNowMs(getCurrentTimestamp());
        if (Math.abs(offsetMs) >= CLOCK_SKEW_WARNING_THRESHOLD_MS) {
          setClockSkewWarning(
            "Your device clock appears out of sync with the server. Reminder validation uses server time.",
          );
          return;
        }
        setClockSkewWarning(null);
      } catch (err) {
        console.error("Failed to sync server time for reminder validation", err);
        if (isMounted) {
          setValidationNowMs(getCurrentTimestamp());
        }
      }
    };

    void syncServerTime();

    return () => {
      isMounted = false;
    };
  }, []);

  // Derived Validation
  const startDateTime = new Date(`${startDate}T${startTime}`);
  const endDateTime = new Date(`${endDate}T${endTime}`);
  const isStartInvalid = Number.isNaN(startDateTime.getTime());
  const isEndInvalid = Number.isNaN(endDateTime.getTime());
  const isTimeInvalid = isStartInvalid || isEndInvalid || startDateTime >= endDateTime;
  // Recurrence end date is optional now ("never" is valid)
  
  const MAX_REMINDERS = 5;
  const canAddReminder = reminders.length < MAX_REMINDERS;

  const pastReminderIndices = new Set<number>();
  const now = new Date(validationNowMs + (serverTimeOffsetMs ?? 0));
  reminders.forEach((reminder, index) => {
    const minutesBefore = toMinutesBefore(reminder.value, reminder.unit);
    const triggerAt = new Date(startDateTime.getTime() - minutesBefore * 60_000);
    if (triggerAt <= now) {
      pastReminderIndices.add(index);
    }
  });

  const errors: Record<string, boolean> = {};
  if (isTimeInvalid) {
    errors.time = true;
  }
  if (pastReminderIndices.size > 0) {
    errors.reminders = true;
  }
  
  const hasErrors = Object.keys(errors).length > 0;
  const refreshValidationNow = () => {
    setValidationNowMs(getCurrentTimestamp());
  };

  const buildSubmission = (): EventSubmission => ({
    title,
    description,
    location,
    start_time: safeToISOString(startDateTime),
    end_time: safeToISOString(endDateTime),
    colour,
    categories: selectedCategories,
    recurrence_interval: (recurrenceInterval as Event["recurrence_interval"]) ?? null,
    recurrence_end: recurrenceEnd || null,
    reminders: reminders.map((r) => ({
      send_email: r.send_email,
      send_push: r.send_push,
      minutes_before: toMinutesBefore(r.value, r.unit),
    })),
  });

  useEffect(() => {
    if (!showPickerMenu) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (pickerRef.current?.contains(event.target as Node)) return;
      setShowPickerMenu(false);
    };
    const raf = window.requestAnimationFrame(() => {
      if (!pickerRef.current || !pickerPosition) return;
      const rect = pickerRef.current.getBoundingClientRect();
      const padding = 8;
      let nextLeft = pickerPosition.left;
      let nextTop = pickerPosition.top;

      if (rect.right > window.innerWidth - padding) {
        nextLeft = Math.max(padding, window.innerWidth - rect.width - padding);
      }
      if (rect.left < padding) {
        nextLeft = padding;
      }
      if (rect.bottom > window.innerHeight - padding) {
        nextTop = Math.max(padding, window.innerHeight - rect.height - padding);
      }
      if (rect.top < padding) {
        nextTop = padding;
      }

      if (nextLeft !== pickerPosition.left || nextTop !== pickerPosition.top) {
        setPickerPosition({ left: nextLeft, top: nextTop });
      }
    });
    window.addEventListener("mousedown", handleOutsideClick);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [pickerPosition, showPickerMenu]);

  const normalisedCurrentSubmission = normaliseEventSubmission(buildSubmission());
  const [initialSubmission] = useState<NormalisedEventSubmission>(
    () => normalisedCurrentSubmission,
  );
  const hasChanges = !isEventSubmissionEqual(
    normalisedCurrentSubmission,
    initialSubmission,
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (hasErrors || !hasChanges) return;

    const data = buildSubmission();
    onSubmit(data);
  };

  const addReminder = () => {
    if (canAddReminder) {
      refreshValidationNow();
      setReminders([...reminders, { send_email: false, send_push: false, value: 15, unit: "minutes" }]);
    }
  };

  const removeReminder = (index: number) => {
    refreshValidationNow();
    setReminders(reminders.filter((_, i) => i !== index));
  };

  const updateReminder = <K extends keyof ReminderFormState>(
    index: number,
    field: K,
    value: ReminderFormState[K]
  ) => {
    const newReminders = [...reminders];
    newReminders[index] = { ...newReminders[index], [field]: value };
    refreshValidationNow();
    setReminders(newReminders);
  };

  const toggleReminderChannel = (
    index: number,
    field: "send_email" | "send_push",
    value: boolean
  ) => {
    const newReminders = [...reminders];
    newReminders[index] = { ...newReminders[index], [field]: value };

    refreshValidationNow();
    setReminders(newReminders);
  };
  const handleTogglePush = async (index: number, nextValue: boolean) => {
    setPushDeniedNotice((prev) => ({ ...prev, [index]: false }));
    if (!nextValue) {
      toggleReminderChannel(index, "send_push", false);
      return;
    }
    if (permission === "denied") {
      setPushDeniedNotice((prev) => ({ ...prev, [index]: true }));
      toggleReminderChannel(index, "send_push", false);
      return;
    }
    if (!isSubscribed) {
      await subscribe();
      if (Notification.permission !== "granted") {
        setPushDeniedNotice((prev) => ({ ...prev, [index]: true }));
        toggleReminderChannel(index, "send_push", false);
        return;
      }
    }
    toggleReminderChannel(index, "send_push", true);
  };

  const baseInputClass = "w-full rounded-lg border border-gray-300 bg-white text-black focus:ring-orange-500 focus:border-orange-500 shadow-sm p-2.5";
  const errorClass = "ring-2 ring-red-500 border-red-500";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white text-black">
      <div className="grow overflow-y-auto p-6 space-y-6">
        {clockSkewWarning && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {clockSkewWarning}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between gap-4 mb-2">
            <label htmlFor="event-title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <div className="flex items-center">
              {isColourLocked ? (
                <Tooltip content="Category colour override set. To set a custom colour, uncheck category colour override.">
                  <button
                  type="button"
                  disabled={isColourLocked}
                onClick={handleColourPickerToggle}
                className="h-7 w-7 rounded-md border border-gray-300 p-0.5 disabled:cursor-not-allowed"
                style={{ backgroundColor: isColourLocked ? "#e2e8f0" : displayColour }}
                aria-label="Event colour"
                  />
                </Tooltip>
              ) : (
                <button
                  type="button"
                  disabled={isColourLocked}
                  onClick={handleColourPickerToggle}
                  className="h-7 w-7 rounded-md border border-gray-300 p-0.5 disabled:cursor-not-allowed"
                  style={{ backgroundColor: isColourLocked ? "#e2e8f0" : displayColour }}
                  aria-label="Event colour"
                />
              )}
            </div>
          </div>
          <input
            id="event-title"
            className={baseInputClass}
            placeholder="Event title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="event-start-date" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              id="event-start-date"
              className={`${baseInputClass} text-[17px] ${errors.time ? errorClass : ""}`}
              type="date"
              value={startDate}
              onChange={(e) => {
                refreshValidationNow();
                setStartDate(e.target.value);
              }}
              required
            />
          </div>
          <div>
            <label htmlFor="event-start-time" className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              id="event-start-time"
              className={`${baseInputClass} text-[17px] ${errors.time ? errorClass : ""}`}
              type="time"
              value={startTime}
              onChange={(e) => {
                refreshValidationNow();
                setStartTime(e.target.value);
              }}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="event-end-date" className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              id="event-end-date"
              className={`${baseInputClass} text-[17px] ${errors.time ? errorClass : ""}`}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="event-end-time" className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <input
              id="event-end-time"
              className={`${baseInputClass} text-[17px] ${errors.time ? errorClass : ""}`}
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        {errors.time && (
          <p className="text-xs text-red-500 -mt-4">
            Start time must be before end time.
          </p>
        )}

        <div>
          <label htmlFor="event-location" className="block text-sm font-medium text-gray-700 mb-2">
            Location <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="event-location"
            className={baseInputClass}
            placeholder="Location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="event-description"
            className={`${baseInputClass} resize-none`}
            placeholder=""
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Category <span className="text-gray-400">(optional)</span>
          </label>
          <CategoryMultiSelect
            categories={categories}
            selectedIds={selectedCategories}
            onChange={setSelectedCategories}
            onCreateCategory={onCreateCategory}
            onUpdateCategory={onUpdateCategory}
            onDeleteCategory={onDeleteCategory}
            variant="event"
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="event-recurring" className="text-sm font-medium text-gray-700">
              Recurring
            </label>
            <button
              id="event-recurring"
              type="button"
              onClick={() => {
                const nextValue = !recurrenceEnabled;
                setRecurrenceEnabled(nextValue);
                if (!nextValue) {
                  setRecurrenceInterval(null);
                  setRecurrenceEnd("");
                } else if (!recurrenceInterval) {
                  setRecurrenceInterval("weekly");
                }
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                recurrenceEnabled ? "bg-primary" : "bg-gray-300"
              }`}
              aria-pressed={recurrenceEnabled}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  recurrenceEnabled ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {recurrenceEnabled && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="recurrence-interval" className="block text-sm font-medium text-gray-700 mb-2">
                  Interval
                </label>
                <select
                  id="recurrence-interval"
                  className={baseInputClass}
                  value={recurrenceInterval ?? "weekly"}
                  onChange={(e) => {
                    const value = e.target.value || null;
                    setRecurrenceInterval(value);
                    if (!value) {
                      setRecurrenceEnd("");
                    }
                  }}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label htmlFor="recurrence-end-type" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <select
                  id="recurrence-end-type"
                  className={`${baseInputClass} mb-2`}
                  value={recurrenceEnd ? "date" : "never"}
                  onChange={(e) => {
                    if (e.target.value === "never") {
                      setRecurrenceEnd("");
                    } else {
                      const defaultDate = new Date();
                      defaultDate.setMonth(defaultDate.getMonth() + 1);
                      setRecurrenceEnd(defaultDate.toISOString().split("T")[0]);
                    }
                  }}
                >
                  <option value="never">Never</option>
                  <option value="date">On Date</option>
                </select>
                {recurrenceEnd && (
                  <input
                    id="recurrence-end"
                    className={baseInputClass}
                    type="date"
                    value={recurrenceEnd}
                    onChange={(e) => setRecurrenceEnd(e.target.value)}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="pt-2">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-900">Reminders ({reminders.length}/{MAX_REMINDERS})</h3>
              <Tooltip content="In-app notifications are always sent. Select additional channels below.">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-[10px] text-gray-500 cursor-help">
                  ?
                </span>
              </Tooltip>
            </div>
            <button
              type="button"
              onClick={addReminder}
              disabled={!canAddReminder}
              className={`text-sm font-medium flex items-center gap-1 ${canAddReminder ? "text-orange-600 hover:text-orange-700" : "text-gray-400 cursor-not-allowed"}`}
            >
              <span className="material-icons text-sm">add</span> Add Reminder
            </button>
          </div>
          <div className="space-y-2">
            {reminders.map((reminder, index) => (
              <div key={index} className={`flex flex-col gap-2 rounded-lg px-3 py-2 ${pastReminderIndices.has(index) ? "bg-red-50 text-red-700" : "bg-gray-50 text-gray-700"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium">Reminder</span>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={reminder.send_email}
                      onChange={(e) => toggleReminderChannel(index, "send_email", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    Email
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={reminder.send_push}
                      disabled={permission === "unsupported" || pushLoading}
                      onChange={(e) => {
                        void handleTogglePush(index, e.target.checked);
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 disabled:opacity-50"
                    />
                    Popup
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="w-20 text-sm border-gray-300 rounded-md bg-white px-3 focus:ring-orange-500 focus:border-orange-500"
                    value={reminder.value}
                    onChange={(e) => updateReminder(index, "value", parseInt(e.target.value) || 1)}
                    min="1"
                  />
                  <select
                    className="text-sm border-gray-300 rounded-md bg-white focus:ring-orange-500 focus:border-orange-500"
                    value={reminder.unit}
                    onChange={(e) => updateReminder(index, "unit", e.target.value as TimeUnit)}
                  >
                    {UNIT_LABELS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-500">before start</span>
                  <button
                    type="button"
                    onClick={() => removeReminder(index)}
                    className="ml-auto text-gray-400 hover:text-red-500"
                  >
                    <span className="material-icons text-sm">delete</span>
                  </button>
                </div>
                {pastReminderIndices.has(index) && (
                  <p className="text-sm text-red-600">
                    This reminder would trigger in the past.
                  </p>
                )}
                {pushDeniedNotice[index] && (
                  <p className="text-sm text-red-600">
                    Browser notifications are blocked. Enable them in your browser settings to use popups.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 flex gap-3 bg-gray-50">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-white border border-gray-300 text-black font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={hasErrors || !hasChanges}
          className={`flex-1 px-4 py-2 text-white font-medium rounded-lg shadow-md transition-all flex items-center justify-center gap-2 ${
            hasErrors || !hasChanges
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-orange-500 hover:bg-orange-600 hover:shadow-lg"
          }`}
        >
          <span className="material-icons text-sm">check</span>
          Save Event
        </button>
      </div>

      <CategoryColourPicker
        isOpen={showPickerMenu}
        position={pickerPosition}
        pickerRef={pickerRef}
        colourInput={colourInput}
        colourError={colourError}
        currentColour={displayColour}
        onColourInputChange={setColourInput}
        onColourErrorChange={setColourError}
        onCommitInput={() => {
          const parsed = parseColourInput(colourInput);
          if (!parsed) {
            setColourError("Enter a valid hex or rgb colour.");
            return;
          }
          setColourInput(parsed);
        }}
        onSelect={() => {
          const parsed = parseColourInput(colourInput);
          if (!parsed) {
            setColourError("Enter a valid hex or rgb colour.");
            return;
          }
          setColour(parsed);
          setShowPickerMenu(false);
        }}
      />
    </form>
  );
};

export default EventForm;
