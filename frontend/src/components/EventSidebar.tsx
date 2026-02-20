import { Fragment, useState } from "react";
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";
import EventForm from "./EventForm";
import ConfirmationModal from "./ConfirmationModal";
import RecurrenceScopeModal from "./RecurrenceScopeModal";
import ScopeActionModal from "./ScopeActionModal";
import {
  type Category,
  type Event,
  type EventMutationContext,
  type EventSubmission,
  type RecurrenceScope,
} from "../types";

interface EventSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSubmit: (data: EventSubmission, context?: EventMutationContext) => void;
  onDelete?: (context?: EventMutationContext) => void;
  onRevertToSeries?: (context: EventMutationContext) => void;
  initialData?: Event;
}

/**
 * A functional component that renders a sidebar for managing events.
 * @param props - The properties for the EventSidebar component.
 * @param props.isOpen - Indicates whether the sidebar is open.
 * @param props.onClose - The callback function to close the sidebar.
 * @param props.categories - The list of available categories.
 * @param props.onSubmit - The callback function to handle event submission.
 * @param props.onDelete - An optional callback function to handle event deletion.
 * @param props.onRevertToSeries - Optional callback to revert an overridden instance.
 * @param props.initialData - The initial data for the event being edited.
 * @returns The rendered event sidebar component.
 */
const EventSidebar = ({
  isOpen,
  onClose,
  categories,
  onSubmit,
  onDelete,
  onRevertToSeries,
  initialData,
}: EventSidebarProps) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);
  const [isAdvancedScopeModalOpen, setIsAdvancedScopeModalOpen] = useState(false);
  const [scopeModalAction, setScopeModalAction] = useState<"save" | "delete" | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState<EventSubmission | null>(null);
  const [pendingAdvancedScope, setPendingAdvancedScope] = useState<
    Exclude<RecurrenceScope, "this"> | null
  >(null);

  const isEditingRecurring = Boolean(initialData?.id && initialData.recurrence_interval);
  const originalAnchor = initialData?.original_start_time ?? initialData?.start_time;
  const eventInstanceKey =
    initialData?.instance_id ??
    initialData?.original_start_time ??
    initialData?.start_time ??
    "new";
  const eventFormKey = `event-${initialData?.id ?? "new"}-${eventInstanceKey}`;

  const hasRecurrencePatternChanged = (
    submission: EventSubmission | null,
  ): boolean => {
    if (!submission || !initialData?.recurrence_interval) {
      return false;
    }
    const currentInterval = initialData.recurrence_interval ?? null;
    const currentEnd = initialData.recurrence_end ?? null;
    const submittedInterval = submission.recurrence_interval ?? currentInterval;
    const submittedEnd = submission.recurrence_end ?? currentEnd;
    return submittedInterval !== currentInterval || submittedEnd !== currentEnd;
  };

  const closeScopeModal = () => {
    setIsScopeModalOpen(false);
    setScopeModalAction(null);
    setPendingSubmission(null);
  };

  const closeAdvancedScopeModal = (reopenScopeSelection = false) => {
    setIsAdvancedScopeModalOpen(false);
    setPendingAdvancedScope(null);
    if (reopenScopeSelection) {
      setIsScopeModalOpen(true);
    }
  };

  const buildContext = (scope: RecurrenceScope): EventMutationContext | undefined => {
    if (!originalAnchor) {
      return { scope };
    }
    return {
      scope,
      original_start_time: originalAnchor,
    };
  };

  const applyScopedAction = (scope: RecurrenceScope) => {
    const context = buildContext(scope);
    if (scopeModalAction === "save" && pendingSubmission) {
      onSubmit(pendingSubmission, context);
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

  const handleScopeSelection = (scope: RecurrenceScope) => {
    if (
      scope === "this" &&
      scopeModalAction === "save" &&
      hasRecurrencePatternChanged(pendingSubmission)
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

  return (
    <>
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          {/* Backdrop */}
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
                  <DialogPanel className="pointer-events-auto w-screen max-w-[400px]">
                    <div className="flex h-full flex-col bg-white shadow-xl">
                      <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-white">
                        <div className="flex items-center gap-4">
                          <DialogTitle className="text-lg font-bold text-black">
                            {initialData?.id ? "Edit Event" : "Add New Event"}
                          </DialogTitle>
                          {initialData?.is_override && (
                            <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
                              Modified Instance
                            </span>
                          )}
                          {initialData?.is_split_series && (
                            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                              Split Series
                            </span>
                          )}
                          {initialData?.is_override && onRevertToSeries && originalAnchor && (
                            <button
                              type="button"
                              onClick={() => setIsRevertModalOpen(true)}
                              className="rounded-md border border-orange-200 bg-orange-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-orange-700 hover:bg-orange-100"
                            >
                              Revert To Series
                            </button>
                          )}
                          {initialData?.id !== undefined && initialData.id !== 0 && onDelete && (
                            <button
                              onClick={() => {
                                if (isEditingRecurring) {
                                  setScopeModalAction("delete");
                                  setIsScopeModalOpen(true);
                                  return;
                                }
                                setIsDeleteModalOpen(true);
                              }}
                              className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-md hover:bg-red-50"
                              title="Delete Event"
                            >
                              <span className="material-icons text-xl">delete</span>
                            </button>
                          )}
                        </div>
                        <button
                          onClick={onClose}
                          className="text-gray-400 hover:text-red-500 transition-colors rounded-full p-1 hover:bg-gray-100"
                        >
                          <span className="material-icons">close</span>
                        </button>
                      </div>

                      <div className="relative flex-1 overflow-y-auto bg-white">
                        <EventForm
                          key={eventFormKey}
                          initialData={initialData}
                          categories={categories}
                          onSubmit={(data) => {
                            if (isEditingRecurring) {
                              setPendingSubmission(data);
                              setScopeModalAction("save");
                              setIsScopeModalOpen(true);
                              return;
                            }
                            onSubmit(data);
                            onClose();
                          }}
                          onCancel={onClose}
                        />
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
          if (initialData?.id && onDelete) {
            onDelete();
            onClose();
          }
        }}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
      />

      <RecurrenceScopeModal
        isOpen={isScopeModalOpen}
        onClose={closeScopeModal}
        action={scopeModalAction ?? "save"}
        disableThisOption={
          scopeModalAction === "save" && hasRecurrencePatternChanged(pendingSubmission)
        }
        onSelect={handleScopeSelection}
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
          if (!onRevertToSeries || !originalAnchor) {
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
    </>
  );
};

export default EventSidebar;
