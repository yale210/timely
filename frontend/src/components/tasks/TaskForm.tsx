import {
  useEffect,
  useMemo,
  useRef,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { CategoryColourPicker } from "@/components";
import type { Category, Task, TaskSubmission } from "@/types";
import { formatDjangoFormError } from "@/utils/apiErrors";
import useTaskFormState from "@/hooks/taskForm/useTaskFormState";
import useTaskFormDataChange from "@/hooks/taskForm/useTaskFormDataChange";
import useTaskColourPickerEffect from "@/hooks/taskForm/useTaskFormColourPickerEffects";
import { parseColourInput } from "@/hooks/parseColourInput";
import { buildPickerPosition } from "@/hooks/taskForm/taskFormColour";
import TaskFormHeader from "@/components/tasks/TaskFormHeader";
import TaskFormStartTime from "@/components/tasks/TaskFormStartTime";
import TaskFormDeadline from "@/components/tasks/TaskFormDeadline";
import TaskFormMinutes from "@/components/tasks/TaskFormMinutes";
import TaskFormScheduler from "@/components/tasks/TaskFormScheduler";
import TaskFormSplitter from "@/components/tasks/TaskFormSplitter";
import TaskFormErrorBuffers from "@/components/tasks/TaskFormErrorBuffers";
import TaskFormSave from "@/components/tasks/TaskFormSave";
import {
  useTaskFormDerivedState,
  useTaskSubmissionChanges,
} from "@/hooks/taskForm/useTaskFormDerivedState";
import CategoryMultiSelect from "@/components/categories/CategoryMultiSelect";
import TaskFormProgress from "@/components/tasks/TaskFormProgress";

interface TaskFormProps {
  initialData?: Task;
  categories: Category[];
  onCreateCategory: (text: string) => Promise<Category>;
  onUpdateCategory: (
    id: number,
    patch: { colour?: string | null; colour_override?: boolean },
  ) => Promise<Category>;
  onDeleteCategory: (id: number) => Promise<void>;
  onCategoryChange?: (categories: number[]) => void;
  onSubmit: (data: TaskSubmission) => Promise<void> | void;
  onCancel: () => void;
  onDataChange?: (data: Partial<Task>) => void;
}

const DEFAULT_MIN_SPLIT_MINUTES = 30;

type TaskFormState = ReturnType<typeof useTaskFormState>;

function buildTaskFormArgs(
  categories: Category[],
  taskState: TaskFormState,
  initialData?: Task,
) {
  return {
    categories,
    selectedCategories: taskState.selectedCategories,
    colour: taskState.colour,
    title: taskState.title,
    description: taskState.description,
    date: taskState.date,
    startTime: taskState.startTime,
    deadline: taskState.deadline,
    deadlineTime: taskState.deadlineTime,
    importance: taskState.importance,
    estimatedMinutes: taskState.estimatedMinutes,
    autoSchedule: taskState.autoSchedule,
    allowSplit: taskState.allowSplit,
    initialData,
    hasSubmitted: taskState.hasSubmitted,
    hasTouchedTime: taskState.hasTouchedTime,
    completedMinutes: taskState.completedMinutes,
    minSplitMinutes: taskState.minSplitMinutes,
    maxSplitMinutes: taskState.maxSplitMinutes,
    bufferEnabled: taskState.bufferEnabled,
    bufferBeforeMinutes: taskState.bufferBeforeMinutes,
    bufferAfterMinutes: taskState.bufferAfterMinutes,
  };
}

function renderDeadlineError(deadline: string) {
  return deadline
    ? "Start time must be before the deadline."
    : "Please set a deadline.";
}

const TASK_SERVER_ERROR_LABELS: Record<string, string> = {
  allocation: "Allocation",
  buffer_after_minutes: "Buffer after",
  buffer_before_minutes: "Buffer before",
  categories: "Categories",
  completed_minutes: "Completed minutes",
  deadline: "Deadline",
  description: "Description",
  importance: "Importance",
  max_split_minutes: "Maximum split block minutes",
  min_split_minutes: "Minimum split block minutes",
  start_time: "Start time",
  title: "Title",
};

function getTaskServerFieldLabel(field: string): string {
  return TASK_SERVER_ERROR_LABELS[field] ?? field.replaceAll("_", " ");
}

/**
 * A functional component that renders a form for creating or editing a task.
 * @param props - The properties for the TaskForm component.
 * @param props.initialData - The initial data used to populate the form when editing.
 * @param props.categories - The list of available categories that can be assigned to the task.
 * @param props.onCreateCategory - Creates a new category from the task form.
 * @param props.onUpdateCategory - Updates an existing category from the task form.
 * @param props.onDeleteCategory - Deletes an existing category from the task form.
 * @param props.onCategoryChange - Optional callback fired when category selections change for an existing task.
 * @param props.onSubmit - Handles submission of the completed task form data.
 * @param props.onCancel - Closes the form without saving changes.
 * @param props.onDataChange - Optional callback fired when key task fields change.
 * @returns The rendered task form component.
 */
export default function TaskForm({
  initialData,
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onCategoryChange,
  onSubmit,
  onCancel,
  onDataChange,
}: TaskFormProps) {
  const defaultColour = "#3b82f6";
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const taskState = useTaskFormState(
    defaultColour,
    initialData,
    DEFAULT_MIN_SPLIT_MINUTES,
  );
  const {
    serverFieldErrors,
    setServerFieldErrors,
    setSubmitError,
    submitError,
  } = taskState;

  useTaskFormDataChange({
    onDataChange,
    title: taskState.title,
    description: taskState.description,
    date: taskState.date,
    startTime: taskState.startTime,
  });

  useTaskColourPickerEffect({
    showPickerMenu: taskState.showPickerMenu,
    pickerPosition: taskState.pickerPosition,
    pickerRef,
    setShowPickerMenu: taskState.setShowPickerMenu,
    setPickerPosition: taskState.setPickerPosition,
  });

  const derivedValues = useTaskFormDerivedState(
    buildTaskFormArgs(categories, taskState, initialData),
  );

  const submissionData = useTaskSubmissionChanges(derivedValues.submission);
  const submissionSnapshot = JSON.stringify(
    submissionData.normalisedCurrentSubmission,
  );
  const previousSubmissionSnapshotRef = useRef(submissionSnapshot);

  useEffect(() => {
    if (previousSubmissionSnapshotRef.current === submissionSnapshot) {
      return;
    }
    previousSubmissionSnapshotRef.current = submissionSnapshot;
    if (submitError) {
      setSubmitError(null);
    }
    if (Object.keys(serverFieldErrors).length > 0) {
      setServerFieldErrors({});
    }
    // Only clear backend errors after a real edit to the submission payload.
  }, [
    serverFieldErrors,
    setServerFieldErrors,
    setSubmitError,
    submissionSnapshot,
    submitError,
  ]);

  const formErrors = useMemo(
    () => ({
      ...derivedValues.errors,
      deadline:
        derivedValues.errors.deadline
        || Boolean(serverFieldErrors.deadline?.length)
        || Boolean(serverFieldErrors.allocation?.length),
      start:
        derivedValues.errors.start
        || Boolean(serverFieldErrors.start_time?.length),
      importance:
        derivedValues.errors.importance
        || Boolean(serverFieldErrors.importance?.length),
      completed_minutes:
        derivedValues.errors.completed_minutes
        || Boolean(serverFieldErrors.completed_minutes?.length),
      min_split_minutes:
        derivedValues.errors.min_split_minutes
        || Boolean(serverFieldErrors.min_split_minutes?.length),
      max_split_minutes:
        derivedValues.errors.max_split_minutes
        || Boolean(serverFieldErrors.max_split_minutes?.length),
      buffer_before_minutes:
        derivedValues.errors.buffer_before_minutes
        || Boolean(serverFieldErrors.buffer_before_minutes?.length),
      buffer_after_minutes:
        derivedValues.errors.buffer_after_minutes
        || Boolean(serverFieldErrors.buffer_after_minutes?.length),
    }),
    [derivedValues.errors, serverFieldErrors],
  );

  const serverFieldErrorEntries = Object.entries(serverFieldErrors)
    .filter(([, messages]) => messages.length > 0);

  const handleColourPickerToggle = (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => {
    if (derivedValues.isColourLocked) return;

    taskState.setPickerPosition(
      buildPickerPosition(event.currentTarget.getBoundingClientRect()),
    );
    taskState.setColourInput(derivedValues.displayColour);
    taskState.setColourError(null);
    taskState.setShowPickerMenu((prev) => !prev);
  };

  const handleFormSubmit = async () => {
    try {
      taskState.setIsSubmitting(true);
      taskState.setSubmitError(null);
      taskState.setServerFieldErrors({});

      await onSubmit(derivedValues.submission);
    } catch (error) {
      const parsed = formatDjangoFormError(error);
      taskState.setSubmitError(parsed.message);
      taskState.setServerFieldErrors(parsed.fieldErrors);
      console.error(error);
    } finally {
      taskState.setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    taskState.setHasSubmitted(true);

    if (derivedValues.hasBlockingErrors || !submissionData.hasChanges) return;

    void handleFormSubmit();
  };

  const errorClass =
    "ring-2 ring-red-500 border-red-500 focus:ring-red-500 focus:border-red-500";

  const baseInputClass =
    "w-full rounded-lg border border-gray-300 bg-white text-black focus:ring-primary focus:border-primary shadow-sm p-2.5";

  return (
    <form
      onSubmit={handleSubmit}
        className="flex flex-col h-full bg-white text-black"
      >
        <div className="grow overflow-y-auto p-6 space-y-6">
          {taskState.submitError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <p>{taskState.submitError}</p>
              {serverFieldErrorEntries.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  {serverFieldErrorEntries.map(([field, messages]) => (
                    <li key={field}>
                      <span className="font-medium">
                        {getTaskServerFieldLabel(field)}:
                      </span>{" "}
                      {messages.join(" ")}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          <TaskFormHeader
            isColourLocked={derivedValues.isColourLocked}
            displayColour={derivedValues.displayColour}
            handleColourPickerToggle={handleColourPickerToggle}
            title={taskState.title}
            setTitle={taskState.setTitle}
            baseInputClass={baseInputClass}
            errorClass={errorClass}
            hasTitleError={Boolean(taskState.serverFieldErrors.title?.length)}
          />

          <TaskFormStartTime
            baseInputClass={baseInputClass}
            errorClass={errorClass}
            errors={formErrors}
            date={taskState.date}
            setDate={taskState.setDate}
            startTime={taskState.startTime}
          setStartTime={taskState.setStartTime}
          setHasTouchedTime={taskState.setHasTouchedTime}
        />

          <TaskFormDeadline
            baseInputClass={baseInputClass}
            errorClass={errorClass}
            errors={formErrors}
            deadline={taskState.deadline}
            setDeadline={taskState.setDeadline}
            deadlineTime={taskState.deadlineTime}
          setDeadlineTime={taskState.setDeadlineTime}
          setHasTouchedTime={taskState.setHasTouchedTime}
        />

        {formErrors.deadline ? (
          <p className="text-xs text-red-500 -mt-4">
            {renderDeadlineError(taskState.deadline)}
          </p>
        ) : null}

        <TaskFormMinutes
          baseInputClass={baseInputClass}
          errorClass={errorClass}
          errors={formErrors}
          importance={taskState.importance}
          setImportance={taskState.setImportance}
          estimatedMinutes={taskState.estimatedMinutes}
          setEstimatedMinutes={taskState.setEstimatedMinutes}
        />

        <TaskFormScheduler
          autoSchedule={taskState.autoSchedule}
          setAutoSchedule={taskState.setAutoSchedule}
          setIsTaskLocked={taskState.setIsTaskLocked}
        />

        <TaskFormSplitter
          allowSplit={taskState.allowSplit}
          setAllowSplit={taskState.setAllowSplit}
          baseInputClass={baseInputClass}
          errorClass={errorClass}
          minSplitMinutes={taskState.minSplitMinutes}
          setMinSplitMinutes={taskState.setMinSplitMinutes}
          maxSplitMinutes={taskState.maxSplitMinutes}
          setMaxSplitMinutes={taskState.setMaxSplitMinutes}
          errors={formErrors}
        />

        <TaskFormErrorBuffers
          bufferEnabled={taskState.bufferEnabled}
          setBufferEnabled={taskState.setBufferEnabled}
          baseInputClass={baseInputClass}
          errorClass={errorClass}
          errors={formErrors}
          bufferBeforeMinutes={taskState.bufferBeforeMinutes}
          setBufferBeforeMinutes={taskState.setBufferBeforeMinutes}
          bufferAfterMinutes={taskState.bufferAfterMinutes}
          setBufferAfterMinutes={taskState.setBufferAfterMinutes}
        />

                <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Category <span className="text-gray-400">(optional)</span>
          </label>
          <CategoryMultiSelect
            categories={categories}
            selectedIds={taskState.selectedCategories}
            onChange={(nextCategories) => {
              taskState.setSelectedCategories(nextCategories);

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
          <label
            htmlFor="task-description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            id="task-description"
            className={`${baseInputClass} resize-none ${taskState.serverFieldErrors.description?.length ? errorClass : ""}`}
            rows={4}
            value={taskState.description}
            onChange={(e) => taskState.setDescription(e.target.value)}
          />
        </div>

        <TaskFormProgress
          completedMinutes={taskState.completedMinutes}
          setCompletedMinutes={taskState.setCompletedMinutes}
          normalizedEstimatedMinutes={derivedValues.normalizedEstimatedMinutes}
          progressPercent={derivedValues.progressPercent}
          errors={formErrors}
          errorClass={errorClass}
        />
      </div>
      <TaskFormSave
        onCancel={onCancel}
        hasChanges={submissionData.hasChanges}
        isSubmitting={taskState.isSubmitting}
      />

      <CategoryColourPicker
        isOpen={taskState.showPickerMenu}
        position={taskState.pickerPosition}
        pickerRef={pickerRef}
        colourInput={taskState.colourInput}
        colourError={taskState.colourError}
        currentColour={derivedValues.displayColour}
        onColourInputChange={taskState.setColourInput}
        onColourErrorChange={taskState.setColourError}
        onCommitInput={() => {
          const parsed = parseColourInput(taskState.colourInput);

          if (!parsed) {
            taskState.setColourError("Enter a valid hex or rgb colour.");
            return;
          }

          taskState.setColourInput(parsed);
        }}
        onSelect={() => {
          const parsed = parseColourInput(taskState.colourInput);

          if (!parsed) {
            taskState.setColourError("Enter a valid hex or rgb colour.");
            return;
          }

          taskState.setColour(parsed);
          taskState.setShowPickerMenu(false);
        }}
      />
    </form>
  );
}
