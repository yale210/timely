import { useState, useCallback } from "react";
import { type Category, type Task, type Event, type TaskSubmission, type EventSubmission } from "@/types";
import TaskForm from "@/components/tasks/TaskForm";
import EventForm from "@/components/events/EventForm";

interface UnifiedSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "task" | "event";
  categories: Category[];
  initialData?: Task | Event;
  onSubmitTask: (data: TaskSubmission) => void;
  onSubmitEvent: (data: EventSubmission) => void;
  onDelete?: () => void;
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 transition-transform duration-300 transform translate-x-0">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h2 className="text-lg font-bold text-gray-900">
          {initialData?.id ? `Edit ${mode === "task" ? "Task" : "Event"}` : `Create New`}
        </h2>
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
            onSubmit={onSubmitTask}
            onCancel={onClose}
            onDataChange={handleDataChange}
          />
        ) : (
          <EventForm
            key={`event-${initialData?.id ?? 'new'}`}
            initialData={mergedData as Event}
            categories={categories}
            onSubmit={onSubmitEvent}
            onCancel={onClose}
            onDataChange={handleDataChange}
          />
        )}
      </div>

      {onDelete && initialData?.id && (
        <div className="p-4 bg-red-50 border-t border-red-100">
          <button
            onClick={onDelete}
            className="w-full py-2 text-red-600 font-medium hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-icons text-sm">delete</span>
            Delete {mode === "task" ? "Task" : "Event"}
          </button>
        </div>
      )}
    </div>
  );
};

export default UnifiedSidebar;
