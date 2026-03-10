import { Fragment, useCallback, useEffect, useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
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
  showModeToggle?: boolean;
  categories: Category[];
  onCreateCategory: (text: string) => Promise<Category>;
  onUpdateCategory: (id: number, patch: { colour?: string | null; colour_override?: boolean }) => Promise<Category>;
  onDeleteCategory: (id: number) => Promise<void>;
  onTaskCategoryChange?: (id: number, categories: number[]) => void;
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
 * @param props.onCreateCategory - Callback to create a new category.
 * @param props.onUpdateCategory - Callback to update an existing category.
 * @param props.onDeleteCategory - Callback to delete a category.
 * @param props.onTaskCategoryChange - Optional callback fired on task category changes.
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
  showModeToggle = true,
  categories,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onTaskCategoryChange,
  initialData,
  onSubmitTask,
  onSubmitEvent,
  onDelete,
  onRevertToSeries,
}: UnifiedSidebarProps) => {
  const [mode, setMode] = useState<"task" | "event">(initialMode);
  const [sharedData, setSharedData] = useState<Partial<Task & Event>>({});
  const [sharedDataKey, setSharedDataKey] = useState<string>("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const initialKey = initialData
    ? `${"deadline" in initialData ? "task" : "event"}-${initialData.id}-${initialData.start_time ?? ""}`
    : "new";

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setSharedData({
        title: initialData.title,
        description: initialData.description,
        start_time: initialData.start_time,
      });
      setSharedDataKey(initialKey);
      if ("deadline" in initialData) {
        setMode("task");
      } else if ("end_time" in initialData) {
        setMode("event");
      }
      return;
    }

    setSharedData({});
    setSharedDataKey("new");
    setMode(initialMode);
  }, [initialData, initialMode, isOpen, initialKey]);

  const handleModeChange = (newMode: "task" | "event") => {
    if (!showModeToggle) return;
    setMode(newMode);
  };

  const handleDataChange = useCallback((data: Partial<Task | Event>) => {
    setSharedData((prev) => ({ ...prev, ...data }));
    setSharedDataKey(initialKey);
  }, [initialKey]);

  // Merge sharedData into initialData for the forms
  const mergedData = sharedDataKey === initialKey
    ? { ...initialData, ...sharedData }
    : initialData;
  const isTaskData = Boolean(initialData && "deadline" in initialData);
  const isEventData = Boolean(initialData && "end_time" in initialData);
  const selectedEvent = isEventData ? (initialData as Event) : undefined;
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

  const titleLabel = initialData?.id
    ? mode === "task"
      ? "Edit Task"
      : "Edit Event"
    : mode === "task"
      ? "Add New Task"
      : "Add New Event";

  const canDelete = Boolean(
    onDelete &&
      initialData?.id &&
      initialData.id !== 0 &&
      ((mode === "task" && isTaskData) || (mode === "event" && isEventData))
  );

  return (
    <>
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <TransitionChild
            as={Fragment}
            enter="ease-in-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <TransitionChild
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300 sm:duration-500"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300 sm:duration-500"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <DialogPanel className="pointer-events-auto w-screen max-w-100">
                    <div className="flex h-full flex-col bg-white shadow-xl">
                      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-4">
                          <DialogTitle className="text-lg font-bold text-black">
                            {titleLabel}
                          </DialogTitle>
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
                          {canDelete && (
                            <button
                              onClick={() => {
                                if (mode === "event" && isEditingRecurringEvent) {
                                  openDeleteScope();
                                  return;
                                }
                                setIsDeleteModalOpen(true);
                              }}
                              className="h-8 w-8 flex items-center justify-center rounded-full text-red-500 hover:text-red-700 transition-colors hover:bg-red-50"
                              title={`Delete ${mode === "task" ? "Task" : "Event"}`}
                            >
                              <span className="material-icons text-xl">delete</span>
                            </button>
                          )}
                        </div>
                        <button
                          onClick={onClose}
                          className="h-8 w-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 transition-colors hover:bg-gray-100"
                        >
                          <span className="material-icons">close</span>
                        </button>
                      </div>

                      {!initialData?.id && showModeToggle && (
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

                      <div className="relative flex-1 overflow-y-auto bg-white">
                        {mode === "task" ? (
                          <TaskForm
                            key={`task-${initialData?.id ?? "new"}`}
                            initialData={mergedData as Task}
                            categories={categories}
                            onCreateCategory={onCreateCategory}
                            onUpdateCategory={onUpdateCategory}
                            onDeleteCategory={onDeleteCategory}
                            onCategoryChange={(nextCategories) => {
                              if (initialData?.id && onTaskCategoryChange) {
                                onTaskCategoryChange(initialData.id, nextCategories);
                              }
                            }}
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
                    </div>
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          onDelete?.();
          onClose();
        }}
        title={`Delete ${mode === "task" ? "Task" : "Event"}`}
        message={`Are you sure you want to delete this ${mode === "task" ? "task" : "event"}? This action cannot be undone.`}
        confirmText="Delete"
      />

      <RecurrenceScopeModal {...recurrenceScopeModalProps} />

      <ScopeActionModal {...scopeActionModalProps} />

      <ConfirmationModal {...revertModalProps} />
    </>
  );
};

export default UnifiedSidebar;
