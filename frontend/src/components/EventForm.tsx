import { useState, useEffect, type FormEvent } from "react";
import { type Category, type Event, type EventSubmission, type EventReminder } from "../types";

interface EventFormProps {
  initialData?: Event;
  categories: Category[];
  onSubmit: (data: EventSubmission) => void;
  onCancel: () => void;
  onDataChange?: (data: Partial<Event>) => void;
}

const EventForm = ({
  initialData,
  categories,
  onSubmit,
  onCancel,
  onDataChange,
}: EventFormProps) => {
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
  }, [title, description, startDate, startTime]);
  
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

  const [eventCategory, setEventCategory] = useState<number | null>(
    initialData?.event_category ?? null
  );
  const [importance, setImportance] = useState(initialData?.importance ?? 5);
  
  const [recurrenceInterval, setRecurrenceInterval] = useState<string | null>(
    initialData?.recurrence_interval ?? null
  );
  const [recurrenceEnd, setRecurrenceEnd] = useState<string>(
    initialData?.recurrence_end ?? ""
  );

  const [reminders, setReminders] = useState<Omit<EventReminder, "id">[]>(
    initialData?.reminders?.map(({ type, minutes_before }) => ({ type, minutes_before })) ?? []
  );

  // Derived Validation
  const startDateTime = new Date(`${startDate}T${startTime}`);
  const endDateTime = new Date(`${endDate}T${endTime}`);
  const isTimeInvalid = startDateTime >= endDateTime;
  const isImportanceInvalid = importance < 1 || importance > 10 || isNaN(importance);
  const isRecurrenceInvalid = recurrenceInterval && !recurrenceEnd;
  
  const errors: Record<string, boolean> = {};
  if (isTimeInvalid) {
    errors.time = true;
  }
  if (isImportanceInvalid) {
    errors.importance = true;
  }
  if (isRecurrenceInvalid) {
    errors.recurrence = true;
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
      event_category: eventCategory,
      importance,
      recurrence_interval: (recurrenceInterval as any) || null,
      recurrence_end: recurrenceEnd || null,
      reminders,
    };
    onSubmit(data);
  };

  const addReminder = () => {
    setReminders([...reminders, { type: "popup", minutes_before: 15 }]);
  };

  const removeReminder = (index: number) => {
    setReminders(reminders.filter((_, i) => i !== index));
  };

  const updateReminder = (index: number, field: keyof EventReminder, value: any) => {
    const newReminders = [...reminders];
    (newReminders[index] as any)[field] = value;
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="event-category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="event-category"
              className={baseInputClass}
              value={eventCategory ?? ""}
              onChange={(e) => setEventCategory(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">None</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.text}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="event-importance" className="block text-sm font-medium text-gray-700 mb-2">
              Importance (1-10)
            </label>
            <input
              id="event-importance"
              className={`${baseInputClass} ${errors.importance ? errorClass : ""}`}
              type="number"
              min="1"
              max="10"
              value={importance}
              onChange={(e) => setImportance(parseInt(e.target.value))}
            />
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
                onChange={(e) => setRecurrenceInterval(e.target.value || null)}
              >
                <option value="">One-off</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label htmlFor="recurrence-end" className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                id="recurrence-end"
                className={`${baseInputClass} ${errors.recurrence ? errorClass : ""}`}
                type="date"
                value={recurrenceEnd}
                onChange={(e) => setRecurrenceEnd(e.target.value)}
                disabled={!recurrenceInterval}
                required={!!recurrenceInterval}
              />
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Reminders</h3>
            <button
              type="button"
              onClick={addReminder}
              className="text-xs font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span className="material-icons text-sm">add</span> Add Reminder
            </button>
          </div>
          <div className="space-y-3">
            {reminders.map((reminder, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                <select
                  className="text-sm border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  value={reminder.type}
                  onChange={(e) => updateReminder(index, "type", e.target.value)}
                >
                  <option value="popup">Popup</option>
                  <option value="email">Email</option>
                </select>
                <input
                  type="number"
                  className="w-20 text-sm border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  value={reminder.minutes_before}
                  onChange={(e) => updateReminder(index, "minutes_before", parseInt(e.target.value))}
                  min="1"
                />
                <span className="text-xs text-gray-500">mins before</span>
                <button
                  type="button"
                  onClick={() => removeReminder(index)}
                  className="ml-auto text-gray-400 hover:text-red-500"
                >
                  <span className="material-icons text-sm">delete</span>
                </button>
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
