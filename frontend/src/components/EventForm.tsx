import { useState, useEffect, type FormEvent } from "react";
import { type Category, type Event, type EventSubmission } from "../types";
import { usePushSubscription } from "../hooks/usePushSubscription";

type TimeUnit = "minutes" | "hours" | "days" | "weeks" | "months" | "years";

interface ReminderFormState {
  send_email: boolean;
  send_push: boolean;
  value: number;
  unit: TimeUnit;
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

const toMinutesBefore = (val: number, unit: TimeUnit): number =>
  val * UNIT_TO_MINUTES[unit];

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
  onSubmit: (data: EventSubmission) => void;
  onCancel: () => void;
  onDataChange?: (data: Partial<Event>) => void;
}

/**
 * A functional component that renders a form for creating or editing an event.
 * @param props - The properties for the EventForm component.
 * @param props.initialData - The initial data to populate the form with.
 * @param props.categories - The list of available categories.
 * @param props.onSubmit - The callback function to handle form submission.
 * @param props.onCancel - The callback function to handle form cancellation.
 * @param props.onDataChange - An optional callback function to handle data changes.
 * @returns The rendered event form component.
 */
const EventForm = ({
  initialData,
  categories,
  onSubmit,
  onCancel,
  onDataChange,
}: EventFormProps) => {
  const { isSubscribed, permission, subscribe, loading: pushLoading } = usePushSubscription();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [location, setLocation] = useState(initialData?.location ?? "");
  
  const [startDate, setStartDate] = useState(
    initialData?.start_time
      ? new Date(initialData.start_time).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [startTime, setStartTime] = useState(
    initialData?.start_time
      ? new Date(initialData.start_time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "10:00"
  );

  useEffect(() => {
    if (onDataChange) {
      const startDateTime = new Date(`${startDate}T${startTime}`);
      onDataChange({
        title,
        description,
        start_time: startDateTime.toISOString(),
      });
    }
  }, [title, description, startDate, startTime, onDataChange]);
  
  const [endDate, setEndDate] = useState(
    initialData?.end_time
      ? new Date(initialData.end_time).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [endTime, setEndTime] = useState(
    initialData?.end_time
      ? new Date(initialData.end_time).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "11:00"
  );

  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    initialData?.categories?.map((c) => (typeof c === "object" ? c.id : c)) ?? []
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

  // Derived Validation
  const startDateTime = new Date(`${startDate}T${startTime}`);
  const endDateTime = new Date(`${endDate}T${endTime}`);
  const isTimeInvalid = startDateTime >= endDateTime;
  // Recurrence end date is optional now ("never" is valid)
  
  const MAX_REMINDERS = 5;
  const canAddReminder = reminders.length < MAX_REMINDERS;

  const pastReminderIndices = new Set<number>();
  const now = new Date();
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (hasErrors) return;

    const data: EventSubmission = {
      title,
      description,
      location,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      categories: selectedCategories,
      recurrence_interval: (recurrenceInterval as Event["recurrence_interval"]) ?? null,
      recurrence_end: recurrenceEnd || null,
      reminders: reminders.map((r) => ({
        send_email: r.send_email,
        send_push: r.send_push,
        minutes_before: toMinutesBefore(r.value, r.unit),
      })),
    };
    onSubmit(data);
  };

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const addReminder = () => {
    if (canAddReminder) {
      setReminders([...reminders, { send_email: false, send_push: true, value: 15, unit: "minutes" }]);
    }
  };

  const removeReminder = (index: number) => {
    setReminders(reminders.filter((_, i) => i !== index));
  };

  const updateReminder = <K extends keyof ReminderFormState>(
    index: number,
    field: K,
    value: ReminderFormState[K]
  ) => {
    const newReminders = [...reminders];
    newReminders[index] = { ...newReminders[index], [field]: value };
    setReminders(newReminders);
  };

  const toggleReminderChannel = (
    index: number,
    field: "send_email" | "send_push",
    value: boolean
  ) => {
    const newReminders = [...reminders];
    newReminders[index] = { ...newReminders[index], [field]: value };

    setReminders(newReminders);
  };

  const baseInputClass = "w-full rounded-lg border border-gray-300 bg-white text-black focus:ring-orange-500 focus:border-orange-500 shadow-sm p-2.5";
  const errorClass = "ring-2 ring-red-500 border-red-500";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white text-black">
      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        <div>
          <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            id="event-title"
            className={baseInputClass}
            placeholder="e.g., Weekly Sync"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="event-location" className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            id="event-location"
            className={baseInputClass}
            placeholder="e.g., Room 404 or Zoom"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="event-start-date" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              id="event-start-date"
              className={`${baseInputClass} ${errors.time ? errorClass : ""}`}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="event-start-time" className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              id="event-start-time"
              className={`${baseInputClass} ${errors.time ? errorClass : ""}`}
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
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
              className={`${baseInputClass} ${errors.time ? errorClass : ""}`}
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
              className={`${baseInputClass} ${errors.time ? errorClass : ""}`}
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        {errors.time && (
          <p className="text-xs text-red-500 mt-[-1rem]">
            Start time must be before end time.
          </p>
        )}

        <div>
          <label htmlFor="event-description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="event-description"
            className={`${baseInputClass} resize-none`}
            placeholder="Add details..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <label key={category.id} className="cursor-pointer group">
                <input
                  type="checkbox"
                  className="hidden peer"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                />
                <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-transparent peer-checked:border-orange-500 peer-checked:ring-1 peer-checked:ring-orange-500 peer-checked:text-orange-600 peer-checked:bg-orange-50 transition-all hover:bg-orange-100">
                  {category.text}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recurrence</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="recurrence-interval" className="block text-sm font-medium text-gray-700 mb-2">
                Interval
              </label>
              <select
                id="recurrence-interval"
                className={baseInputClass}
                value={recurrenceInterval ?? ""}
                onChange={(e) => {
                  const value = e.target.value || null;
                  setRecurrenceInterval(value);
                  // Clear end date when switching to one-off
                  if (!value) {
                    setRecurrenceEnd("");
                  }
                }}
              >
                <option value="">One-off</option>
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
              {recurrenceInterval ? (
                <>
                  <select
                    id="recurrence-end-type"
                    className={`${baseInputClass} mb-2`}
                    value={recurrenceEnd ? "date" : "never"}
                    onChange={(e) => {
                      if (e.target.value === "never") {
                        setRecurrenceEnd("");
                      } else {
                        // Set a default date when switching to "On Date"
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
                </>
              ) : (
                <input
                  id="recurrence-end"
                  className={baseInputClass}
                  type="date"
                  value={recurrenceEnd}
                  onChange={(e) => setRecurrenceEnd(e.target.value)}
                  disabled
                />
              )}
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-semibold text-gray-900">Reminders ({reminders.length}/{MAX_REMINDERS})</h3>
            <button
              type="button"
              onClick={addReminder}
              disabled={!canAddReminder}
              className={`text-xs font-medium flex items-center gap-1 ${canAddReminder ? "text-orange-600 hover:text-orange-700" : "text-gray-400 cursor-not-allowed"}`}
            >
              <span className="material-icons text-sm">add</span> Add Reminder
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            In-app notifications are always sent. Select additional channels below:
          </p>
          <div className="space-y-3">
            {reminders.map((reminder, index) => (
              <div key={index} className={`flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border ${pastReminderIndices.has(index) ? "border-red-400 bg-red-50" : "border-gray-200"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-semibold text-gray-600">Reminder type</span>
                  <label className={`inline-flex items-center gap-2 text-xs ${isSubscribed ? "text-gray-600" : "text-gray-400"}`}>
                    <input
                      type="checkbox"
                      checked={reminder.send_push}
                      disabled={!isSubscribed}
                      onChange={(e) => {
                        if (isSubscribed) {
                          toggleReminderChannel(index, "send_push", e.target.checked);
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 disabled:opacity-50"
                    />
                    Popup
                    {!isSubscribed && (
                      <button
                        type="button"
                        disabled={pushLoading || permission === "denied"}
                        onClick={() => void subscribe()}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 underline disabled:opacity-50 disabled:no-underline"
                      >
                        {permission === "denied" ? "(blocked)" : pushLoading ? "..." : "(enable)"}
                      </button>
                    )}
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={reminder.send_email}
                      onChange={(e) => toggleReminderChannel(index, "send_email", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    Email
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="w-20 text-sm border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    value={reminder.value}
                    onChange={(e) => updateReminder(index, "value", parseInt(e.target.value) || 1)}
                    min="1"
                  />
                  <select
                    className="text-sm border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                    value={reminder.unit}
                    onChange={(e) => updateReminder(index, "unit", e.target.value as TimeUnit)}
                  >
                    {UNIT_LABELS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-500">before</span>
                  <button
                    type="button"
                    onClick={() => removeReminder(index)}
                    className="ml-auto text-gray-400 hover:text-red-500"
                  >
                    <span className="material-icons text-sm">delete</span>
                  </button>
                </div>
                {pastReminderIndices.has(index) && (
                  <p className="text-xs text-red-500">
                    This reminder would trigger in the past.
                  </p>
                )}
              </div>
            ))}
            {reminders.length === 0 && (
              <p className="text-xs text-gray-400 italic">No reminders set.</p>
            )}
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
          disabled={hasErrors}
          className={`flex-1 px-4 py-2 text-white font-medium rounded-lg shadow-md transition-all flex items-center justify-center gap-2 ${
            hasErrors
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-orange-500 hover:bg-orange-600 hover:shadow-lg"
          }`}
        >
          <span className="material-icons text-sm">check</span>
          Save Event
        </button>
      </div>
    </form>
  );
};

export default EventForm;
