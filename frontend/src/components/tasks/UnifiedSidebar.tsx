import { useState, useCallback } from "react";
import {
  type Category,
  type Event,
  type EventMutationContext,
  type EventSubmission,
  type Task,
  type TaskSubmission,
} from "@/types";
import { useRecurrenceScopeActions } from "@/hooks/tasks/useRecurrenceScopeActions";
import TaskForm from "@/components/tasks/TaskForm";
import EventForm from "@/components/events/EventForm";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import RecurrenceScopeModal from "@/components/modals/RecurrenceScopeModal";
import ScopeActionModal from "@/components/modals/ScopeActionModal";

interface UnifiedSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "task" | "event";
  categories: Category[];
  onCreateCategory: (text: string) => Promise<Category>;
  onUpdateCategory: (id: number, patch: { colour?: string | null }) => Promise<Category>;
  onDeleteCategory: (id: number) => Promise<void>;
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
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  initialData,
  onSubmitTask,
  onSubmitEvent,
  onDelete,
  onRevertToSeries,
}: UnifiedSidebarProps) => {
  const [mode, setMode] = useState<"task" | "event">(initialMode);
  
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
  const {
    isEditingRecurringEvent,
    openSaveScope,
    openDeleteScope,
    openRevertModal,
    recurrenceScopeModalProps,
    scopeActionModalProps,
    revertModalProps,
  } = useRecurrenceScopeActions({
    selectedEvent,
    onSubmitEvent,
    onDelete,
    onRevertToSeries,
    onClose,
  });

  const eventFormInstanceKey =
    selectedEvent?.instance_id ??
    selectedEvent?.original_start_time ??
    selectedEvent?.start_time ??
    "new";
  const eventFormKey = `event-${selectedEvent?.id ?? "new"}-${eventFormInstanceKey}`;


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
              onClick={openRevertModal}
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

      <div className="grow overflow-hidden">
        {mode === "task" ? (
          <TaskForm
            key={`task-${initialData?.id ?? 'new'}`}
            initialData={mergedData as Task}
            categories={categories}
            onCreateCategory={onCreateCategory}
            onUpdateCategory={onUpdateCategory}
            onDeleteCategory={onDeleteCategory}
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
            onCreateCategory={onCreateCategory}
            onUpdateCategory={onUpdateCategory}
            onDeleteCategory={onDeleteCategory}
            onSubmit={(data) => {
              if (isEditingRecurringEvent) {
                openSaveScope(data);
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
                openDeleteScope();
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

      <RecurrenceScopeModal {...recurrenceScopeModalProps} />

      <ScopeActionModal {...scopeActionModalProps} />

      <ConfirmationModal {...revertModalProps} />
    </div>
  );
};

export default UnifiedSidebar;
