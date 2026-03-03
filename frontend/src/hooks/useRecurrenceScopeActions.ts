import { useState } from "react";
import type {
  Event,
  EventMutationContext,
  EventSubmission,
  RecurrenceScope,
} from "@/types";

interface UseRecurrenceScopeActionsParams {
  selectedEvent: Event | undefined;
  onSubmitEvent: (data: EventSubmission, context?: EventMutationContext) => void;
  onDelete?: (context?: EventMutationContext) => void;
  onRevertToSeries?: (context: EventMutationContext) => void;
  onClose: () => void;
}

/**
 * Hook to manage state and actions for recurring event scope modals.
 * @param params - The parameters for the hook.
 * @param params.selectedEvent - The selected event.
 * @param params.onSubmitEvent - The callback function to handle event submission.
 * @param params.onDelete - An optional callback function to handle event deletion.
 * @param params.onRevertToSeries - Optional callback to revert an overridden instance.
 * @param params.onClose - The callback function to close the sidebar.
 * @returns The state and actions for recurring event scope modals.
 */
export const useRecurrenceScopeActions = ({
  selectedEvent,
  onSubmitEvent,
  onDelete,
  onRevertToSeries,
  onClose,
}: UseRecurrenceScopeActionsParams) => {
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [isAdvancedScopeModalOpen, setIsAdvancedScopeModalOpen] = useState(false);
  const [scopeModalAction, setScopeModalAction] = useState<"save" | "delete" | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState<EventSubmission | null>(null);
  const [pendingAdvancedScope, setPendingAdvancedScope] = useState<
    Exclude<RecurrenceScope, "this"> | null
  >(null);
  const [isRevertModalOpen, setIsRevertModalOpen] = useState(false);

  const isEditingRecurringEvent = Boolean(
    selectedEvent?.id && selectedEvent.recurrence_interval,
  );

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
    setPendingSubmission(null);
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
    if (scopeModalAction === "save" && pendingSubmission) {
      onSubmitEvent(pendingSubmission, context);
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

  const openSaveScope = (submission: EventSubmission) => {
    setPendingSubmission(submission);
    setScopeModalAction("save");
    setIsScopeModalOpen(true);
  };

  const openDeleteScope = () => {
    setScopeModalAction("delete");
    setIsScopeModalOpen(true);
  };

  const openRevertModal = () => {
    setIsRevertModalOpen(true);
  };

  const closeRevertModal = () => {
    setIsRevertModalOpen(false);
  };

  const performRevert = () => {
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
  };

  const recurrenceScopeModalProps = {
    isOpen: isScopeModalOpen,
    action: scopeModalAction ?? "save",
    disableThisOption:
      scopeModalAction === "save" && hasRecurrencePatternChanged(pendingSubmission),
    onClose: closeScopeModal,
    onSelect: handleScopeSelect,
  };

  const scopeActionModalProps = {
    isOpen: isAdvancedScopeModalOpen,
    action: scopeModalAction ?? "save",
    scope: pendingAdvancedScope,
    onClose: () => closeAdvancedScopeModal(true),
    onConfirm: () => {
      if (!pendingAdvancedScope) {
        return;
      }
      applyScopedAction(pendingAdvancedScope);
    },
  };

  const revertModalProps = {
    isOpen: isRevertModalOpen,
    onClose: closeRevertModal,
    onConfirm: performRevert,
    title: "Revert To Series",
    message:
      "This will remove this instance override and restore it to follow the recurring series.",
    confirmText: "Revert",
  };

  return {
    isScopeModalOpen,
    isAdvancedScopeModalOpen,
    scopeModalAction,
    pendingSubmission,
    pendingAdvancedScope,
    isRevertModalOpen,
    isEditingRecurringEvent,
    hasRecurrencePatternChanged,
    buildContext,
    closeScopeModal,
    closeAdvancedScopeModal,
    applyScopedAction,
    handleScopeSelect,
    openSaveScope,
    openDeleteScope,
    openRevertModal,
    closeRevertModal,
    performRevert,
    recurrenceScopeModalProps,
    scopeActionModalProps,
    revertModalProps,
  };
};
