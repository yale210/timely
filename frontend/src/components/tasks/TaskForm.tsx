import { useState, useEffect, useRef, type FormEvent, type MouseEvent as ReactMouseEvent } from "react";
import { CategoryColourPicker, CategoryMultiSelect, Tooltip } from "@/components";
import { getOverrideColour } from "@/utils/colorUtils";
import { type Category, type Task, type TaskSubmission } from "@/types";

/**
 * Safely convert a Date to ISO string, returning "" for invalid dates.
 * @param d - The date object to convert.
 */

interface NormalisedTaskSubmission {
  title: string;
  description: string;
  start_time: string;
  deadline: string;
  colour: string;
  categories: number[];
  importance: number;
  estimated_minutes: number;
  completed: boolean;
  allow_split: boolean;
}

const normaliseTaskSubmission = (
  submission: TaskSubmission,
): NormalisedTaskSubmission => ({
  title: submission.title ?? "",
  description: submission.description ?? "",
  start_time: submission.start_time ?? "",
  deadline: submission.deadline ?? "",
  colour: submission.colour ?? "",
  categories: [...(submission.categories ?? [])].sort((a, b) => a - b),
  importance: Number(submission.importance ?? 5),
  estimated_minutes: Number(submission.estimated_minutes ?? 60),
  completed: Boolean(submission.completed),
  allow_split: Boolean(submission.allow_split),
});

const isTaskSubmissionEqual = (
  left: NormalisedTaskSubmission,
  right: NormalisedTaskSubmission,
): boolean => JSON.stringify(left) === JSON.stringify(right);

interface TaskFormProps {
  initialData?: Task;
  categories: Category[];
  onCreateCategory: (text: string) => Promise<Category>;
  onUpdateCategory: (id: number, patch: { colour?: string | null; colour_override?: boolean }) => Promise<Category>;
  onDeleteCategory: (id: number) => Promise<void>;
  onCategoryChange?: (categories: number[]) => void;
  onSubmit: (data: TaskSubmission) => void;
  onCancel: () => void;
  onDataChange?: (data: Partial<Task>) => void;
}

/**
 * A functional component that renders a form for creating or editing a task.
 * @param props - The properties for the TaskForm component.
 * @param props.initialData - The initial data to populate the form with.
 * @param props.categories - The list of available categories.
 * @param props.onCreateCategory - Callback to create a new category.
 * @param props.onUpdateCategory - Callback to update an existing category.
 * @param props.onDeleteCategory - Callback to delete a category.
 * @param props.onCategoryChange - Optional callback fired on category changes.
 * @param props.onSubmit - The callback function to handle form submission.
 * @param props.onCancel - The callback function to handle form cancellation.
 * @param props.onDataChange - An optional callback function to handle data changes.
 * @returns The rendered task form component.
 */
const TaskForm = ({
  initialData,
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onCategoryChange,
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
  const toIsoOrEmpty = (value: Date): string =>
    Number.isNaN(value.getTime()) ? "" : value.toISOString();

  useEffect(() => {
    if (onDataChange) {
      const startDateTime = new Date(`${date}T${startTime}`);
      onDataChange({
        title,
        description,
        start_time: toIsoOrEmpty(startDateTime),
      });
    }
  }, [title, description, date, startTime, onDataChange]);
  const [deadline, setDeadline] = useState(
    initialData?.deadline
      ? new Date(initialData.deadline).toISOString().split("T")[0]
      : ""
  );
  const [deadlineTime, setDeadlineTime] = useState(
    initialData?.deadline
      ? new Date(initialData.deadline).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : ""
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasTouchedTime, setHasTouchedTime] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    initialData?.categories?.map((c) => (typeof c === "object" ? c.id : c)) ?? []
  );
  const [importance, setImportance] = useState(initialData?.importance ?? 5);
  const [allowSplit, setAllowSplit] = useState(initialData?.allow_split ?? false);
  const [autoSchedule, setAutoSchedule] = useState(
    initialData?.locked ? false : true,
  );
  const defaultColour = "#3b82f6";
  const [colour, setColour] = useState(initialData?.colour ?? defaultColour);
  const [showPickerMenu, setShowPickerMenu] = useState(false);
  const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number } | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const [colourInput, setColourInput] = useState(colour);
  const [colourError, setColourError] = useState<string | null>(null);
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | "">(
    initialData?.estimated_minutes ?? ""
  );
  const selectedCategoryObjects = categories.filter((category) =>
    selectedCategories.includes(category.id),
  );
  const overrideColour = getOverrideColour(selectedCategoryObjects);
  const isColourLocked = Boolean(overrideColour);
  const displayColour = overrideColour ?? colour;
  const handleColourPickerToggle = (event: ReactMouseEvent<HTMLButtonElement>) => {
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

  // Derived Validation
  const startDateTime = new Date(`${date}T${startTime}`);
  const endDateTime = new Date(`${deadline}T${deadlineTime}`);
  const isStartInvalid = Number.isNaN(startDateTime.getTime());
  const isEndInvalid = Number.isNaN(endDateTime.getTime());
  const isTimeInvalid = isStartInvalid || isEndInvalid || startDateTime >= endDateTime;
  const isImportanceInvalid = importance < 1 || importance > 10 || isNaN(importance);
  const shouldValidateTime = hasSubmitted || hasTouchedTime;
  
  const errors: Record<string, boolean> = {};
  if (shouldValidateTime && isTimeInvalid) {
    errors.start = true;
    errors.deadline = true;
  }
  if (isImportanceInvalid) {
    errors.importance = true;
  }
  
  const hasBlockingErrors = isTimeInvalid || isImportanceInvalid;

  const buildSubmission = (): TaskSubmission => ({
    title,
    description,
    start_time: toIsoOrEmpty(startDateTime),
    deadline: toIsoOrEmpty(endDateTime),
    categories: selectedCategories,
    importance,
    estimated_minutes: Number(estimatedMinutes || 0),
    colour,
    locked: !autoSchedule,
    allow_split: allowSplit,
    completed: initialData?.completed ?? false,
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

  const normalisedCurrentSubmission = normaliseTaskSubmission(buildSubmission());
  const [initialSubmission] = useState<NormalisedTaskSubmission>(
    () => normalisedCurrentSubmission,
  );
  const hasChanges = !isTaskSubmissionEqual(
    normalisedCurrentSubmission,
    initialSubmission,
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    if (hasBlockingErrors || !hasChanges) return;

    const data = buildSubmission();
    onSubmit(data);
  };

  const errorClass = "ring-2 ring-red-500 border-red-500 focus:ring-red-500 focus:border-red-500";
  const baseInputClass = "w-full rounded-lg border border-gray-300 bg-white text-black focus:ring-primary focus:border-primary shadow-sm p-2.5";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white text-black">
      <div className="grow overflow-y-auto p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between gap-4 mb-2">
            <label htmlFor="task-title" className="block text-sm font-medium text-gray-700">
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
                aria-label="Task colour"
                  />
                </Tooltip>
              ) : (
                <button
                  type="button"
                  disabled={isColourLocked}
                  onClick={handleColourPickerToggle}
                  className="h-7 w-7 rounded-md border border-gray-300 p-0.5 disabled:cursor-not-allowed"
                  style={{ backgroundColor: isColourLocked ? "#e2e8f0" : displayColour }}
                  aria-label="Task colour"
                />
              )}
            </div>
          </div>
          <input
            id="task-title"
            className={baseInputClass}
            placeholder="Task title"
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
            <input
              id="task-start-date"
              className={`${baseInputClass} text-[17px] ${errors.start ? errorClass : ""}`}
              type="date"
              value={date}
              onChange={(e) => {
                setHasTouchedTime(true);
                setDate(e.target.value);
              }}
              required
            />
          </div>
          <div>
            <label htmlFor="task-start-time" className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              id="task-start-time"
              className={`${baseInputClass} text-[17px] ${errors.start ? errorClass : ""}`}
              type="time"
              value={startTime}
              onChange={(e) => {
                setHasTouchedTime(true);
                setStartTime(e.target.value);
              }}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-deadline-date" className="block text-sm font-medium text-gray-700 mb-2">
              Deadline Date
            </label>
            <input
              id="task-deadline-date"
              className={`${baseInputClass} text-[17px] ${errors.deadline ? errorClass : ""}`}
              type="date"
              value={deadline}
              onChange={(e) => {
                setHasTouchedTime(true);
                setDeadline(e.target.value);
              }}
            />
          </div>
          <div>
            <label htmlFor="task-deadline-time" className="block text-sm font-medium text-gray-700 mb-2">
              Deadline Time
            </label>
            <input
              id="task-deadline-time"
              className={`${baseInputClass} text-[17px] ${errors.deadline ? errorClass : ""}`}
              type="time"
              value={deadlineTime}
              onChange={(e) => {
                setHasTouchedTime(true);
                setDeadlineTime(e.target.value);
              }}
            />
          </div>
        </div>

        {errors.deadline && (
          <p className="text-xs text-red-500 -mt-4">
            {deadline ? "Start time must be before the deadline." : "Please set a deadline."}
          </p>
        )}

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
              onChange={(e) => {
                const nextValue = e.target.value;
                setEstimatedMinutes(nextValue ? parseInt(nextValue) : "");
              }}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <label htmlFor="task-auto-schedule" className="text-sm font-medium text-gray-700">
              Auto-schedule
            </label>
            <button
              id="task-auto-schedule"
              type="button"
              onClick={() => setAutoSchedule((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoSchedule ? "bg-primary" : "bg-gray-300"
              }`}
              aria-pressed={autoSchedule}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  autoSchedule ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <label htmlFor="task-allow-split" className="text-sm font-medium text-gray-700">
              Splittable
            </label>
            <button
              id="task-allow-split"
              type="button"
              onClick={() => setAllowSplit((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                allowSplit ? "bg-primary" : "bg-gray-300"
              }`}
              aria-pressed={allowSplit}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  allowSplit ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="task-description"
            className={`${baseInputClass} resize-none`}
            placeholder=""
            rows={4}
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
            onChange={(nextCategories) => {
              setSelectedCategories(nextCategories);
              if (initialData?.id && onCategoryChange) {
                onCategoryChange(nextCategories);
              }
            }}
            onCreateCategory={onCreateCategory}
            onUpdateCategory={onUpdateCategory}
            onDeleteCategory={onDeleteCategory}
            variant="task"
          />
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
          disabled={!hasChanges}
          className={`flex-1 px-4 py-2 text-white font-medium rounded-lg shadow-md transition-all flex items-center justify-center gap-2 ${
            !hasChanges
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-blue-300 hover:shadow-lg"
          }`}
        >
          <span className="material-icons text-sm">check</span>
          Save Task
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

export default TaskForm;
