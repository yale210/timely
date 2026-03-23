import { useState, useEffect, useRef, type FormEvent, type MouseEvent as ReactMouseEvent } from "react";
import { CategoryColourPicker, CategoryMultiSelect, Tooltip } from "@/components";
import { getOverrideColour } from "@/utils/colorUtils";
import { type Category, type Task, type TaskSubmission } from "@/types";
import { formatDjangoFormError } from "@/utils/apiErrors";

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
  completed_minutes: number;
  completed: boolean;
  locked: boolean;
  allow_split: boolean;
  min_split_minutes: number;
  max_split_minutes: number | null;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
}

const DEFAULT_MIN_SPLIT_MINUTES = 30;

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
  completed_minutes: Number(submission.completed_minutes ?? 0),
  completed: Boolean(submission.completed),
  locked: Boolean(submission.locked),
  allow_split: Boolean(submission.allow_split),
  min_split_minutes: Number(submission.min_split_minutes ?? DEFAULT_MIN_SPLIT_MINUTES),
  max_split_minutes:
    submission.max_split_minutes == null ? null : Number(submission.max_split_minutes),
  buffer_before_minutes: Number(submission.buffer_before_minutes ?? 0),
  buffer_after_minutes: Number(submission.buffer_after_minutes ?? 0),
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
  onSubmit: (data: TaskSubmission) => Promise<void> | void;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string[]>>({});
  const [hasTouchedTime, setHasTouchedTime] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    initialData?.categories?.map((c) => (typeof c === "object" ? c.id : c)) ?? []
  );
  const [importance, setImportance] = useState(initialData?.importance ?? 5);
  const [completedMinutes, setCompletedMinutes] = useState<number | "">(
    initialData?.completed_minutes ?? 0
  );
  const [allowSplit, setAllowSplit] = useState(initialData?.allow_split ?? false);
  const [bufferEnabled, setBufferEnabled] = useState(
    (initialData?.buffer_before_minutes ?? 0) > 0 || (initialData?.buffer_after_minutes ?? 0) > 0,
  );
  const [minSplitMinutes, setMinSplitMinutes] = useState<string>(
    String(initialData?.min_split_minutes ?? DEFAULT_MIN_SPLIT_MINUTES),
  );
  const [maxSplitMinutes, setMaxSplitMinutes] = useState<string>(
    initialData?.max_split_minutes == null ? "" : String(initialData.max_split_minutes),
  );
  const [bufferBeforeMinutes, setBufferBeforeMinutes] = useState<string>(
    String(initialData?.buffer_before_minutes ?? 0),
  );
  const [bufferAfterMinutes, setBufferAfterMinutes] = useState<string>(
    String(initialData?.buffer_after_minutes ?? 0),
  );
  const [autoSchedule, setAutoSchedule] = useState(!(initialData?.locked ?? false));
  const [isTaskLocked, setIsTaskLocked] = useState(initialData?.locked ?? false);
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
  const normalizedEstimatedMinutes = Number(estimatedMinutes || 0);
  const parsedCompletedMinutes = Number(completedMinutes || 0);
  const isCompletedMinutesInvalid =
    completedMinutes === ""
    || Number.isNaN(parsedCompletedMinutes)
    || parsedCompletedMinutes < 0
    || parsedCompletedMinutes > normalizedEstimatedMinutes;
  const parsedMinSplitMinutes = Number.parseInt(minSplitMinutes, 10);
  const parsedMaxSplitMinutes = Number.parseInt(maxSplitMinutes, 10);
  const isMinSplitMinutesInvalid = allowSplit && (
    minSplitMinutes.trim() === ""
    || Number.isNaN(parsedMinSplitMinutes)
    || parsedMinSplitMinutes < 15
    || parsedMinSplitMinutes > 240
  );
  const isMaxSplitMinutesInvalid = allowSplit && maxSplitMinutes.trim() !== "" && (
    Number.isNaN(parsedMaxSplitMinutes)
    || parsedMaxSplitMinutes < 15
    || parsedMaxSplitMinutes > 1440
    || parsedMaxSplitMinutes < parsedMinSplitMinutes
  );
  const parsedBufferBeforeMinutes = Number.parseInt(bufferBeforeMinutes, 10);
  const parsedBufferAfterMinutes = Number.parseInt(bufferAfterMinutes, 10);
  const isBufferBeforeMinutesInvalid = bufferEnabled && (
    bufferBeforeMinutes.trim() === ""
    || Number.isNaN(parsedBufferBeforeMinutes)
    || parsedBufferBeforeMinutes < 0
    || parsedBufferBeforeMinutes > 240
  );
  const isBufferAfterMinutesInvalid = bufferEnabled && (
    bufferAfterMinutes.trim() === ""
    || Number.isNaN(parsedBufferAfterMinutes)
    || parsedBufferAfterMinutes < 0
    || parsedBufferAfterMinutes > 240
  );
  const shouldValidateTime = hasSubmitted || hasTouchedTime;
  const progressPercent = normalizedEstimatedMinutes > 0
    ? Math.min(100, Math.max(0, (parsedCompletedMinutes / normalizedEstimatedMinutes) * 100))
    : 0;
  
  const errors: Record<string, boolean> = {};
  if (shouldValidateTime && isTimeInvalid) {
    errors.start = true;
    errors.deadline = true;
  }
  if (isImportanceInvalid) {
    errors.importance = true;
  }
  if (hasSubmitted && isCompletedMinutesInvalid) {
    errors.completed_minutes = true;
  }
  if (hasSubmitted && isMinSplitMinutesInvalid) {
    errors.min_split_minutes = true;
  }
  if (hasSubmitted && isMaxSplitMinutesInvalid) {
    errors.max_split_minutes = true;
  }
  if (hasSubmitted && isBufferBeforeMinutesInvalid) {
    errors.buffer_before_minutes = true;
  }
  if (hasSubmitted && isBufferAfterMinutesInvalid) {
    errors.buffer_after_minutes = true;
  }
  
  const hasBlockingErrors =
    isTimeInvalid
    || isImportanceInvalid
    || isCompletedMinutesInvalid
    || isMinSplitMinutesInvalid
    || isMaxSplitMinutesInvalid
    || isBufferBeforeMinutesInvalid
    || isBufferAfterMinutesInvalid;

  const buildSubmission = (): TaskSubmission => ({
    title,
    description,
    start_time: toIsoOrEmpty(startDateTime),
    deadline: toIsoOrEmpty(endDateTime),
    categories: selectedCategories,
    importance,
    estimated_minutes: normalizedEstimatedMinutes,
    completed_minutes: parsedCompletedMinutes,
    colour,
    locked: isTaskLocked,
    allow_split: allowSplit,
    min_split_minutes: parsedMinSplitMinutes,
    max_split_minutes: maxSplitMinutes.trim() === "" ? null : parsedMaxSplitMinutes,
    buffer_before_minutes: bufferEnabled ? parsedBufferBeforeMinutes : 0,
    buffer_after_minutes: bufferEnabled ? parsedBufferAfterMinutes : 0,
    completed: normalizedEstimatedMinutes > 0 && parsedCompletedMinutes >= normalizedEstimatedMinutes,
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
  const lastSubmissionRef = useRef<NormalisedTaskSubmission>(normalisedCurrentSubmission);

  useEffect(() => {
    if (isTaskSubmissionEqual(normalisedCurrentSubmission, lastSubmissionRef.current)) {
      return;
    }

    lastSubmissionRef.current = normalisedCurrentSubmission;
    if (submitError) {
      setSubmitError(null);
    }
    if (Object.keys(serverFieldErrors).length > 0) {
      setServerFieldErrors({});
    }
  }, [normalisedCurrentSubmission, serverFieldErrors, submitError]);

  const handleFormSubmit = async () => {
    const data = buildSubmission();
    try {
      setIsSubmitting(true);
      setServerFieldErrors({});
      await onSubmit(data);
    } catch (error) {
      const parsed = formatDjangoFormError(error);
      setSubmitError(parsed.message);
      setServerFieldErrors(parsed.fieldErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    if (hasBlockingErrors || !hasChanges) return;
    void handleFormSubmit();
  };

  const errorClass = "ring-2 ring-red-500 border-red-500 focus:ring-red-500 focus:border-red-500";
  const baseInputClass = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-black shadow-sm focus:border-primary focus:ring-primary";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white text-black">
      <div className="grow overflow-y-auto space-y-4 p-5">
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

        <div className="grid grid-cols-[72px_minmax(0,1fr)_104px] items-center gap-2">
          <label htmlFor="task-start-date" className="min-w-0 text-sm font-medium text-gray-700">
            Start date
          </label>
          <input
            id="task-start-date"
            aria-label="Start date"
            className={`${baseInputClass} min-w-0 text-[17px] ${errors.start ? errorClass : ""}`}
            type="date"
            value={date}
            onChange={(e) => {
              setHasTouchedTime(true);
              setDate(e.target.value);
            }}
            required
          />
          <input
            id="task-start-time"
            aria-label="Start time"
            className={`${baseInputClass} w-full text-[17px] ${errors.start ? errorClass : ""}`}
            type="time"
            value={startTime}
            onChange={(e) => {
              setHasTouchedTime(true);
              setStartTime(e.target.value);
            }}
            required
          />
        </div>

        <div className="grid grid-cols-[72px_minmax(0,1fr)_104px] items-center gap-2">
          <label htmlFor="task-deadline-date" className="min-w-0 text-sm font-medium text-gray-700">
            Deadline
          </label>
          <input
            id="task-deadline-date"
            aria-label="Deadline date"
            className={`${baseInputClass} min-w-0 text-[17px] ${errors.deadline ? errorClass : ""}`}
            type="date"
            value={deadline}
            onChange={(e) => {
              setHasTouchedTime(true);
              setDeadline(e.target.value);
            }}
          />
          <input
            id="task-deadline-time"
            aria-label="Deadline time"
            className={`${baseInputClass} w-full text-[17px] ${errors.deadline ? errorClass : ""}`}
            type="time"
            value={deadlineTime}
            onChange={(e) => {
              setHasTouchedTime(true);
              setDeadlineTime(e.target.value);
            }}
          />
        </div>

        {errors.deadline && (
          <p className="text-xs text-red-500 -mt-4">
            {deadline ? "Start time must be before the deadline." : "Please set a deadline."}
          </p>
        )}

        <div className="space-y-3">
          <div className="grid grid-cols-[minmax(0,1fr)_92px] items-center gap-3">
            <label htmlFor="task-importance" className="min-w-0 text-sm font-medium text-gray-700">
              Importance (1-10)
            </label>
            <input
              id="task-importance"
              className={`${baseInputClass} ${errors.importance ? errorClass : ""}`}
              type="number"
              min="1"
              max="10"
              value={importance}
              onChange={(e) => {
                const nextValue = Number.parseInt(e.target.value, 10);
                setImportance(Number.isNaN(nextValue) ? 0 : nextValue);
              }}
            />
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_92px] items-center gap-3">
            <label htmlFor="task-minutes" className="min-w-0 text-sm font-medium text-gray-700">
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

        <div className="rounded-xl border border-gray-200 bg-transparent p-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="task-auto-schedule" className="text-sm font-medium text-gray-700">
                Auto-schedule
              </label>
              <Tooltip content="Automatically includes this task in scheduling and rescheduling. Turn this off to keep it out of auto-allocation.">
                <button
                  type="button"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500 hover:bg-gray-100"
                  aria-label="Explain auto-schedule"
                >
                  ?
                </button>
              </Tooltip>
            </div>
            <button
              id="task-auto-schedule"
              type="button"
              onClick={() => {
                setAutoSchedule((prev) => {
                  const nextValue = !prev;
                  setIsTaskLocked(!nextValue);
                  return nextValue;
                });
              }}
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
        </div>

        <div className="rounded-xl border border-gray-200 bg-transparent p-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="task-allow-split" className="text-sm font-medium text-gray-700">
                Splittable
              </label>
              <Tooltip content="Allows the scheduler to break this task into multiple smaller sessions instead of scheduling it as one continuous block.">
                <button
                  type="button"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500 hover:bg-gray-100"
                  aria-label="Explain splittable"
                >
                  ?
                </button>
              </Tooltip>
            </div>
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
          {allowSplit ? (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-[minmax(0,1fr)_92px] items-center gap-3">
                <label htmlFor="task-min-split-minutes" className="min-w-0 text-sm font-medium text-gray-700">
                  Minimum split block minutes
                </label>
                <input
                  id="task-min-split-minutes"
                  className={`${baseInputClass} ${errors.min_split_minutes ? errorClass : ""}`}
                  type="number"
                  min="15"
                  max="240"
                  step="5"
                  value={minSplitMinutes}
                  onChange={(e) => {
                    setMinSplitMinutes(e.target.value);
                  }}
                />
                {errors.min_split_minutes ? (
                  <p className="col-span-2 text-xs text-red-500">
                    Minimum split block minutes must be between 15 and 240.
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_92px] items-center gap-3">
                <label htmlFor="task-max-split-minutes" className="min-w-0 text-sm font-medium text-gray-700">
                  Maximum split block minutes <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="task-max-split-minutes"
                  className={`${baseInputClass} ${errors.max_split_minutes ? errorClass : ""}`}
                  type="number"
                  min="15"
                  max="1440"
                  step="5"
                  value={maxSplitMinutes}
                  onChange={(e) => {
                    setMaxSplitMinutes(e.target.value);
                  }}
                />
                {errors.max_split_minutes ? (
                  <p className="col-span-2 text-xs text-red-500">
                    Maximum split block minutes must be between 15 and 1440, and at least the minimum split block minutes.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-gray-200 bg-transparent p-3">
          <div className={`${bufferEnabled ? "mb-2" : ""} flex items-center justify-between gap-4`}>
            <div className="flex items-center gap-2">
              <label htmlFor="task-buffer-enabled" className="block text-sm font-medium text-gray-700">
                Scheduling Buffer
              </label>
              <Tooltip content="Reserves extra time before and after this task so the scheduler leaves a gap around it.">
                <button
                  type="button"
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500 hover:bg-gray-100"
                  aria-label="Explain scheduling buffer"
                >
                  ?
                </button>
              </Tooltip>
            </div>
            <button
              id="task-buffer-enabled"
              type="button"
              onClick={() => setBufferEnabled((prev) => !prev)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                bufferEnabled ? "bg-primary" : "bg-gray-300"
              }`}
              aria-pressed={bufferEnabled}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  bufferEnabled ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          {bufferEnabled ? (
            <div className="space-y-3">
              <div className="grid grid-cols-[minmax(0,1fr)_92px] items-center gap-3">
                <label htmlFor="task-buffer-before-minutes" className="min-w-0 text-sm font-medium text-gray-700">
                  Buffer before (mins)
                </label>
                <input
                  id="task-buffer-before-minutes"
                  className={`${baseInputClass} ${errors.buffer_before_minutes ? errorClass : ""}`}
                  type="number"
                  min="0"
                  max="240"
                  step="5"
                  value={bufferBeforeMinutes}
                  onChange={(e) => {
                    setBufferBeforeMinutes(e.target.value);
                  }}
                />
                {errors.buffer_before_minutes ? (
                  <p className="col-span-2 text-xs text-red-500">
                    Buffer before must be between 0 and 240 minutes.
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_92px] items-center gap-3">
                <label htmlFor="task-buffer-after-minutes" className="min-w-0 text-sm font-medium text-gray-700">
                  Buffer after (mins)
                </label>
                <input
                  id="task-buffer-after-minutes"
                  className={`${baseInputClass} ${errors.buffer_after_minutes ? errorClass : ""}`}
                  type="number"
                  min="0"
                  max="240"
                  step="5"
                  value={bufferAfterMinutes}
                  onChange={(e) => {
                    setBufferAfterMinutes(e.target.value);
                  }}
                />
                {errors.buffer_after_minutes ? (
                  <p className="col-span-2 text-xs text-red-500">
                    Buffer after must be between 0 and 240 minutes.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
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

        <div>
          <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="task-description"
            className={`${baseInputClass} resize-none`}
            placeholder=""
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <div className="mb-2">
            <label htmlFor="task-completed-minutes" className="block text-sm font-medium text-gray-700">
              Progress
            </label>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <input
              id="task-completed-minutes"
              className={`w-11 appearance-none rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-black shadow-sm focus:border-primary focus:ring-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${errors.completed_minutes ? errorClass : ""}`}
              type="number"
              min="0"
              max={Math.max(0, normalizedEstimatedMinutes)}
              value={completedMinutes}
              onChange={(e) => {
                const nextValue = e.target.value;
                setCompletedMinutes(nextValue === "" ? "" : parseInt(nextValue));
              }}
            />
            <span className="text-sm font-medium text-gray-700">
              / {normalizedEstimatedMinutes} mins
            </span>
          </div>
          {errors.completed_minutes ? (
            <p className="mt-2 text-xs text-red-500">
              Completed minutes must be between 0 and the estimated minutes.
            </p>
          ) : null}
        </div>

        {submitError ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}

      </div>

      <div className="flex gap-3 border-t border-gray-200 bg-gray-50 p-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-white border border-gray-300 text-black font-medium rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!hasChanges || isSubmitting}
          className={`flex-1 px-4 py-2 text-white font-medium rounded-lg shadow-md transition-all flex items-center justify-center gap-2 ${
            !hasChanges || isSubmitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-blue-300 hover:shadow-lg"
          }`}
        >
          <span className="material-icons text-sm">check</span>
          {isSubmitting ? "Saving..." : "Save Task"}
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
