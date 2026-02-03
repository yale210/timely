import { useState, useEffect, type FormEvent } from "react";
import { type Category, type Task, type TaskSubmission } from "../types";

interface TaskFormProps {
  initialData?: Task;
  categories: Category[];
  onSubmit: (data: TaskSubmission) => void;
  onCancel: () => void;
  onDataChange?: (data: Partial<Task>) => void;
}

/**
 * A functional component that renders a form for creating or editing a task.
 * @param props - The properties for the TaskForm component.
 * @param props.initialData - The initial data to populate the form with.
 * @param props.categories - The list of available categories.
 * @param props.onSubmit - The callback function to handle form submission.
 * @param props.onCancel - The callback function to handle form cancellation.
 * @param props.onDataChange - An optional callback function to handle data changes.
 * @returns The rendered task form component.
 */
const TaskForm = ({
  initialData,
  categories,
  onSubmit,
  onCancel,
  onDataChange,
}: TaskFormProps) => {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [date, setDate] = useState(
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
      const startDateTime = new Date(`${date}T${startTime}`);
      onDataChange({
        title,
        description,
        start_time: startDateTime.toISOString(),
      });
    }
  }, [title, description, date, startTime, onDataChange]);
  const [deadline, setDeadline] = useState(
    initialData?.deadline
      ? new Date(initialData.deadline).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [deadlineTime, setDeadlineTime] = useState(
    initialData?.deadline
      ? new Date(initialData.deadline).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "11:00"
  );
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    initialData?.categories?.map((c) => (typeof c === "object" ? c.id : c)) ?? []
  );
  const [importance, setImportance] = useState(initialData?.importance ?? 5);
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    initialData?.estimated_minutes ?? 30
  );

  // Derived Validation
  const startDateTime = new Date(`${date}T${startTime}`);
  const endDateTime = new Date(`${deadline}T${deadlineTime}`);
  const isTimeInvalid = startDateTime >= endDateTime;
  const isImportanceInvalid = importance < 1 || importance > 10 || isNaN(importance);
  
  const errors: Record<string, boolean> = {};
  if (isTimeInvalid) {
    errors.start = true;
    errors.deadline = true;
  }
  if (isImportanceInvalid) {
    errors.importance = true;
  }
  
  const hasErrors = Object.keys(errors).length > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (hasErrors) return;

    const data: TaskSubmission = {
      title,
      description,
      start_time: startDateTime.toISOString(),
      deadline: endDateTime.toISOString(),
      categories: selectedCategories,
      importance,
      estimated_minutes: estimatedMinutes,
      completed: initialData?.completed ?? false,
    };
    onSubmit(data);
  };

  const toggleCategory = (id: number) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const errorClass = "ring-2 ring-red-500 border-red-500 focus:ring-red-500 focus:border-red-500";
  const baseInputClass = "w-full rounded-lg border border-gray-300 bg-white text-black focus:ring-primary focus:border-primary shadow-sm p-2.5";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white text-black">
      <div className="flex-grow overflow-y-auto p-6 space-y-6">
        <div>
          <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            id="task-title"
            className={baseInputClass}
            placeholder="e.g., Marketing Sync"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-start-date" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <div className="relative">
              <span className="material-icons absolute left-3 top-2.5 text-gray-400 text-lg">
                calendar_today
              </span>
              <input
                id="task-start-date"
                className={`${baseInputClass} pl-10 ${errors.start ? errorClass : ""}`}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="task-start-time" className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <div className="relative">
              <span className="material-icons absolute left-3 top-2.5 text-gray-400 text-lg">
                schedule
              </span>
              <input
                id="task-start-time"
                className={`${baseInputClass} pl-10 ${errors.start ? errorClass : ""}`}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-deadline-date" className="block text-sm font-medium text-gray-700 mb-2">
              Deadline Date
            </label>
            <div className="relative">
              <span className="material-icons absolute left-3 top-2.5 text-gray-400 text-lg">
                event
              </span>
              <input
                id="task-deadline-date"
                className={`${baseInputClass} pl-10 ${errors.deadline ? errorClass : ""}`}
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label htmlFor="task-deadline-time" className="block text-sm font-medium text-gray-700 mb-2">
              Deadline Time
            </label>
            <div className="relative">
              <span className="material-icons absolute left-3 top-2.5 text-gray-400 text-lg">
                timer
              </span>
              <input
                id="task-deadline-time"
                className={`${baseInputClass} pl-10 ${errors.deadline ? errorClass : ""}`}
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {errors.deadline && (
          <p className="text-xs text-red-500 mt-[-1rem]">
            Start time must be before the deadline.
          </p>
        )}

        <div>
          <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="task-description"
            className={`${baseInputClass} resize-none`}
            placeholder="Add details..."
            rows={4}
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
                <div className="px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-transparent peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary peer-checked:text-primary peer-checked:bg-blue-50 transition-all hover:bg-blue-100">
                  {category.text}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-importance" className="block text-sm font-medium text-gray-700 mb-2">
              Importance (1-10)
            </label>
            <input
              id="task-importance"
              className={`${baseInputClass} ${errors.importance ? errorClass : ""}`}
              type="number"
              min="1"
              max="10"
              value={importance}
              onChange={(e) => setImportance(parseInt(e.target.value))}
            />
          </div>
          <div>
            <label htmlFor="task-minutes" className="block text-sm font-medium text-gray-700 mb-2">
              Est. Minutes
            </label>
            <input
              id="task-minutes"
              className={baseInputClass}
              type="number"
              min="1"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value))}
            />
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
          disabled={Object.keys(errors).length > 0}
          className={`flex-1 px-4 py-2 text-white font-medium rounded-lg shadow-md transition-all flex items-center justify-center gap-2 ${
            Object.keys(errors).length > 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-blue-300 hover:shadow-lg"
          }`}
        >
          <span className="material-icons text-sm">check</span>
          Save Task
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
