import { useState, useCallback } from "react";
import {
  type Category,
  type Event,
  type EventMutationContext,
  type EventSubmission,
  type RecurrenceScope,
  type Task,
  type TaskSubmission,
} from "../types";
import TaskForm from "./TaskForm";
import EventForm from "./EventForm";
import ConfirmationModal from "./ConfirmationModal";
import RecurrenceScopeModal from "./RecurrenceScopeModal";
import ScopeActionModal from "./ScopeActionModal";

interface UnifiedSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "task" | "event";
  categories: Category[];
  initialData?: Task | Event;
  onSubmitTask: (data: TaskSubmission) => void;
  onSubmitEvent: (data: EventSubmission, context?: EventMutationContext) => void;
  onDelete?: (context?: EventMutationContext) => void;
  onRevertToSeries?: (context: EventMutationContext) => void;
}

/**
 * A functional component that renders a unified sidebar for managing both tasks and events.
 * @param props - The properties for the UnifiedSidebar component.
 * @param props.isOpen - Indicates whether the sidebar is open.
 * @param props.onClose - The callback function to close the sidebar.
 * @param props.initialMode - The initial mode of the sidebar (task or event).
 * @param props.categories - The list of available categories.
 * @param props.initialData - The initial data for the task or event being edited.
 * @param props.onSubmitTask - The callback function to handle task submission.
 * @param props.onSubmitEvent - The callback function to handle event submission.
 * @param props.onDelete - An optional callback function to handle deletion.
 * @param props.onRevertToSeries - Optional callback to revert an overridden event instance.
 * @returns The rendered unified sidebar component.
 */
const UnifiedSidebar = ({
  isOpen,
  onClose,
  initialMode = "task",
  categories,
  initialData,
  onSubmitTask,
  onSubmitEvent,
  onDelete,
  onRevertToSeries,
}: UnifiedSidebarProps) => {
  const [mode, setMode] = useState<"task" | "event">(initialMode);
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [isAdvancedScopeModalOpen, setIsAdvancedScopeModalOpen] = useState(false);
  const [scopeModalAction, setScopeModalAction] = useState<"save" | "delete" | null>(null);
  const [pendingEventSubmission, setPendingEventSubmission] = useState<EventSubmission | null>(
    null,
  );
  const [pendingAdvancedScope, setPendingAdvancedScope] = useState<
    Exclude<RecurrenceScope, "this"> | null
  >(null);
  
  // Shared fields state for preservation
  const [sharedData, setSharedData] = useState<Partial<Task & Event>>({});
  const [lastInitialData, setLastInitialData] = useState<Task | Event | undefined>(initialData);
  const [lastIsOpen, setLastIsOpen] = useState(isOpen);

  if (isOpen !== lastIsOpen || initialData !== lastInitialData) {
    setLastIsOpen(isOpen);
    setLastInitialData(initialData);
    
    if (isOpen) {
      if (initialData) {
        setSharedData({
          title: initialData.title,
          description: initialData.description,
          start_time: initialData.start_time,
        });
        // Determine mode from initialData if possible
        if ("deadline" in initialData) {
          setMode("task");
        } else if ("end_time" in initialData) {
          setMode("event");
        }
      } else {
        setMode(initialMode);
        setSharedData({});
      }
    }
  }

  const handleModeChange = (newMode: "task" | "event") => {
    setMode(newMode);
  };

  const handleDataChange = useCallback((data: Partial<Task | Event>) => {
    setSharedData((prev) => ({ ...prev, ...data }));
  }, []);

  // Merge sharedData into initialData for the forms
  const mergedData = { ...initialData, ...sharedData };
  const selectedEvent =
    initialData && "end_time" in initialData ? initialData : undefined;
  const isEditingRecurringEvent = Boolean(
    selectedEvent?.id && selectedEvent.recurrence_interval,
  );
  const eventFormInstanceKey =
    selectedEvent?.instance_id ??
    selectedEvent?.original_start_time ??
    selectedEvent?.start_time ??
    "new";
  const eventFormKey = `event-${selectedEvent?.id ?? "new"}-${eventFormInstanceKey}`;

  const hasRecurrencePatternChanged = (
    submission: EventSubmission | null,
  ): boolean => {
    if (!submission || !selectedEvent?.recurrence_interval) {
      return false;
    }
    const currentInterval = selectedEvent.recurrence_interval ?? null;
    const currentEnd = selectedEvent.recurrence_end ?? null;
    const submittedInterval = submission.recurrence_interval ?? currentInterval;
    const submittedEnd = submission.recurrence_end ?? currentEnd;
    return submittedInterval !== currentInterval || submittedEnd !== currentEnd;
  };

  const buildContext = (scope: RecurrenceScope): EventMutationContext | undefined => {
    const anchor = selectedEvent?.original_start_time ?? selectedEvent?.start_time;
    if (!anchor) {
      return { scope };
    }
    return {
      scope,
      original_start_time: anchor,
    };
  };

  const closeScopeModal = () => {
    setIsScopeModalOpen(false);
    setScopeModalAction(null);
    setPendingEventSubmission(null);
  };

  const closeAdvancedScopeModal = (reopenScopeSelection = false) => {
    setIsAdvancedScopeModalOpen(false);
    setPendingAdvancedScope(null);
    if (reopenScopeSelection) {
      setIsScopeModalOpen(true);
    }
  };

  const applyScopedAction = (scope: RecurrenceScope) => {
    const context = buildContext(scope);
    if (scopeModalAction === "save" && pendingEventSubmission) {
      onSubmitEvent(pendingEventSubmission, context);
      closeScopeModal();
      closeAdvancedScopeModal();
      onClose();
      return;
    }
    if (scopeModalAction === "delete" && onDelete) {
      onDelete(context);
      closeScopeModal();
      closeAdvancedScopeModal();
      onClose();
    }
  };

  const handleScopeSelect = (scope: RecurrenceScope) => {
    if (
      scope === "this" &&
      scopeModalAction === "save" &&
      hasRecurrencePatternChanged(pendingEventSubmission)
    ) {
      try {
        window.alert(
          "Recurrence pattern changes require This and following or All events.",
        );
      } catch {
        // Ignore environments without alert (e.g. tests).
      }
      return;
    }

    if (scope === "this") {
      applyScopedAction(scope);
      return;
    }
    setPendingAdvancedScope(scope);
    setIsScopeModalOpen(false);
    setIsAdvancedScopeModalOpen(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 transition-transform duration-300 transform translate-x-0">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900">
            {initialData?.id ? `Edit ${mode === "task" ? "Task" : "Event"}` : `Create New`}
          </h2>
          {mode === "event" && selectedEvent?.is_override && (
            <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
              Modified Instance
            </span>
          )}
          {mode === "event" && selectedEvent?.is_split_series && (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
              Split Series
            </span>
          )}
          {mode === "event" && selectedEvent?.is_override && onRevertToSeries && (
            <button
              type="button"
              onClick={() => setIsRevertModalOpen(true)}
              className="rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-orange-700 hover:bg-orange-100"
            >
              Revert To Series
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
        >
          <span className="material-icons text-gray-500">close</span>
        </button>
      </div>

      {!initialData?.id && (
        <div className="p-4 bg-white border-b border-gray-100">
          <div className="flex p-1 bg-gray-100 rounded-lg">
            <button
              data-testid="mode-toggle-task"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "task"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => handleModeChange("task")}
            >
              Task
            </button>
            <button
              data-testid="mode-toggle-event"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === "event"
                  ? "bg-white text-orange-500 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => handleModeChange("event")}
            >
              Event
            </button>
          </div>
        </div>
      )}

      <div className="flex-grow overflow-hidden">
        {mode === "task" ? (
          <TaskForm
            key={`task-${initialData?.id ?? 'new'}`}
            initialData={mergedData as Task}
            categories={categories}
            onSubmit={(data) => {
              onSubmitTask(data);
              onClose();
            }}
            onCancel={onClose}
            onDataChange={handleDataChange}
          />
        ) : (
          <EventForm
            key={eventFormKey}
            initialData={mergedData as Event}
            categories={categories}
            onSubmit={(data) => {
              if (isEditingRecurringEvent) {
                setPendingEventSubmission(data);
                setScopeModalAction("save");
                setIsScopeModalOpen(true);
                return;
              }
              onSubmitEvent(data);
              onClose();
            }}
            onCancel={onClose}
            onDataChange={handleDataChange}
          />
        )}
      </div>

      {onDelete && initialData?.id && (
        <div className="p-4 bg-red-50 border-t border-red-100">
          <button
            onClick={() => {
              if (mode === "event" && isEditingRecurringEvent) {
                setScopeModalAction("delete");
                setIsScopeModalOpen(true);
                return;
              }
              onDelete();
              onClose();
            }}
            className="w-full py-2 text-red-600 font-medium hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-icons text-sm">delete</span>
            Delete {mode === "task" ? "Task" : "Event"}
          </button>
        </div>
      )}

      <RecurrenceScopeModal
        isOpen={isScopeModalOpen}
        action={scopeModalAction ?? "save"}
        disableThisOption={
          scopeModalAction === "save" &&
          hasRecurrencePatternChanged(pendingEventSubmission)
        }
        onClose={closeScopeModal}
        onSelect={handleScopeSelect}
      />

      <ScopeActionModal
        isOpen={isAdvancedScopeModalOpen}
        action={scopeModalAction ?? "save"}
        scope={pendingAdvancedScope}
        onClose={() => closeAdvancedScopeModal(true)}
        onConfirm={() => {
          if (!pendingAdvancedScope) {
            return;
          }
          applyScopedAction(pendingAdvancedScope);
        }}
      />

      <ConfirmationModal
        isOpen={isRevertModalOpen}
        onClose={() => setIsRevertModalOpen(false)}
        onConfirm={() => {
          if (!onRevertToSeries) {
            return;
          }
          const originalAnchor =
            selectedEvent?.original_start_time ?? selectedEvent?.start_time;
          if (!originalAnchor) {
            return;
          }
          onRevertToSeries({
            scope: "this",
            original_start_time: originalAnchor,
          });
          onClose();
        }}
        title="Revert To Series"
        message="This will remove this instance override and restore it to follow the recurring series."
        confirmText="Revert"
      />
    </div>
  );
};

export default UnifiedSidebar;
