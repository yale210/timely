import { useState } from "react";
import type { Event, EventMutationContext, EventSubmission, RecurrenceScope } from "@/types";

interface UseRecurrenceScopeActionsParams {
  selectedEvent: Event | undefined;
  onSubmitEvent: (data: EventSubmission, context?: EventMutationContext) => Promise<void> | void;
  onDelete?: (context?: EventMutationContext) => Promise<void> | void;
  onRevertToSeries?: (context: EventMutationContext) => Promise<void> | void;
  onClose: () => void;
}

interface RecurrenceScopeState {
  isScopeModalOpen: boolean;
  isAdvancedScopeModalOpen: boolean;
  scopeModalAction: "save" | "delete" | null;
  pendingSubmission: EventSubmission | null;
  pendingAdvancedScope: Exclude<RecurrenceScope, "this"> | null;
  isRevertModalOpen: boolean;
}

const initialState: RecurrenceScopeState = {
  isScopeModalOpen: false,
  isAdvancedScopeModalOpen: false,
  scopeModalAction: null,
  pendingSubmission: null,
  pendingAdvancedScope: null,
  isRevertModalOpen: false,
};

const useRecurrenceScopeState = () => {
  const [state, setState] = useState(initialState);
  const mergeState = (patch: Partial<RecurrenceScopeState>) => setState((current) => ({ ...current, ...patch }));
  const closeScopeModal = () => mergeState({ isScopeModalOpen: false, scopeModalAction: null, pendingSubmission: null });
  const closeAdvancedScopeModal = (reopenScopeSelection = false) => mergeState({ isAdvancedScopeModalOpen: false, pendingAdvancedScope: null, isScopeModalOpen: reopenScopeSelection });
  return { ...state, mergeState, closeScopeModal, closeAdvancedScopeModal, openRevertModal: () => mergeState({ isRevertModalOpen: true }), closeRevertModal: () => mergeState({ isRevertModalOpen: false }) };
};

/**
 * Compares a submission against the selected recurring event.
 * @param selectedEvent - The currently selected event.
 * @param submission - The pending submission payload.
 * @returns Whether the recurrence pattern changed.
 */
export const hasRecurrencePatternChangedForEvent = (selectedEvent: Event | undefined, submission: EventSubmission | null): boolean => {
  if (!submission || !selectedEvent?.recurrence_interval) return false;
  const currentInterval = selectedEvent.recurrence_interval ?? null;
  const currentEnd = selectedEvent.recurrence_end ?? null;
  return (submission.recurrence_interval ?? currentInterval) !== currentInterval || (submission.recurrence_end ?? currentEnd) !== currentEnd;
};

/**
 * Builds the scoped mutation context for a recurring event action.
 * @param selectedEvent - The currently selected event.
 * @param scope - The requested recurrence scope.
 * @returns A recurrence mutation context.
 */
export const buildRecurrenceContext = (selectedEvent: Event | undefined, scope: RecurrenceScope): EventMutationContext => {
  const anchor = selectedEvent?.original_start_time ?? selectedEvent?.start_time;
  return anchor ? { scope, original_start_time: anchor } : { scope };
};

/**
 * Builds the revert context for an overridden instance.
 * @param selectedEvent - The currently selected event.
 * @returns A revert context when an anchor exists.
 */
export const buildRevertContext = (selectedEvent: Event | undefined): EventMutationContext | undefined => {
  const originalAnchor = selectedEvent?.original_start_time ?? selectedEvent?.start_time;
  return originalAnchor ? { scope: "this", original_start_time: originalAnchor } : undefined;
};

const applyScopedMutation = async ({
  scope,
  selectedEvent,
  scopeModalAction,
  pendingSubmission,
  onSubmitEvent,
  onDelete,
  onClose,
  closeScopeModal,
  closeAdvancedScopeModal,
}: UseRecurrenceScopeActionsParams & Pick<ReturnType<typeof useRecurrenceScopeState>, "scopeModalAction" | "pendingSubmission" | "closeScopeModal" | "closeAdvancedScopeModal"> & { scope: RecurrenceScope }) => {
  const context = buildRecurrenceContext(selectedEvent, scope);
  if (scopeModalAction === "save" && pendingSubmission) {
    await onSubmitEvent(pendingSubmission, context);
    closeScopeModal();
    closeAdvancedScopeModal();
    onClose();
    return;
  }
  if (scopeModalAction === "delete" && onDelete) {
    await onDelete(context);
    closeScopeModal();
    closeAdvancedScopeModal();
    onClose();
  }
};

const getRevertModalProps = (
  state: ReturnType<typeof useRecurrenceScopeState>,
  performRevert: () => Promise<void> | void,
) => ({
  isOpen: state.isRevertModalOpen,
  onClose: state.closeRevertModal,
  onConfirm: () => {
    void performRevert();
  },
  title: "Revert To Series",
  message: "This will remove this instance override and restore it to follow the recurring series.",
  confirmText: "Revert",
});

/**
 * Manages scope selection state for recurring event save, delete, and revert flows.
 * @param params - The scope action callbacks and selected event.
 * @param params.selectedEvent - The currently selected event.
 * @param params.onSubmitEvent - Submits a scoped event change.
 * @param params.onDelete - Deletes an event with optional scope.
 * @param params.onRevertToSeries - Reverts an override to the series value.
 * @param params.onClose - Closes the surrounding sidebar.
 * @returns State, handlers, and modal props for recurrence scope actions.
 */
export const useRecurrenceScopeActions = ({ selectedEvent, onSubmitEvent, onDelete, onRevertToSeries, onClose }: UseRecurrenceScopeActionsParams) => {
  const state = useRecurrenceScopeState();
  const hasRecurrencePatternChanged = (submission: EventSubmission | null) => hasRecurrencePatternChangedForEvent(selectedEvent, submission);
  const buildContext = (scope: RecurrenceScope) => buildRecurrenceContext(selectedEvent, scope);
  const applyScopedAction = (scope: RecurrenceScope) => applyScopedMutation({ scope, selectedEvent, scopeModalAction: state.scopeModalAction, pendingSubmission: state.pendingSubmission, onSubmitEvent, onDelete, onRevertToSeries, onClose, closeScopeModal: state.closeScopeModal, closeAdvancedScopeModal: state.closeAdvancedScopeModal });
  const handleScopeSelect = (scope: RecurrenceScope) => {
    if (scope === "this" && state.scopeModalAction === "save" && hasRecurrencePatternChanged(state.pendingSubmission)) { if (typeof window.alert === "function") window.alert("Recurrence pattern changes require This and following or All events."); return; }
    if (scope === "this") { void applyScopedAction(scope); return; }
    state.mergeState({ pendingAdvancedScope: scope, isScopeModalOpen: false, isAdvancedScopeModalOpen: true });
  };
  const performRevert = async () => {
    const context = buildRevertContext(selectedEvent);
    if (!onRevertToSeries || !context) return;
    await onRevertToSeries(context);
    onClose();
  };
  const recurrenceScopeModalProps = { isOpen: state.isScopeModalOpen, action: state.scopeModalAction ?? "save", disableThisOption: state.scopeModalAction === "save" && hasRecurrencePatternChanged(state.pendingSubmission), onClose: state.closeScopeModal, onSelect: handleScopeSelect };
  const scopeActionModalProps = { isOpen: state.isAdvancedScopeModalOpen, action: state.scopeModalAction ?? "save", scope: state.pendingAdvancedScope, onClose: () => state.closeAdvancedScopeModal(true), onConfirm: () => state.pendingAdvancedScope && void applyScopedAction(state.pendingAdvancedScope) };
  return { ...state, isEditingRecurringEvent: Boolean(selectedEvent?.id && selectedEvent.recurrence_interval), hasRecurrencePatternChanged, buildContext, applyScopedAction, handleScopeSelect, openSaveScope: (submission: EventSubmission) => state.mergeState({ pendingSubmission: submission, scopeModalAction: "save", isScopeModalOpen: true }), openDeleteScope: () => state.mergeState({ scopeModalAction: "delete", isScopeModalOpen: true }), openRevertModal: state.openRevertModal, closeRevertModal: state.closeRevertModal, performRevert, recurrenceScopeModalProps, scopeActionModalProps, revertModalProps: getRevertModalProps(state, performRevert) };
};
