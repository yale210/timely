import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment, forwardRef } from "react";
import { type RecurrenceScope } from "@/types";

interface RecurrenceScopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (scope: RecurrenceScope) => void;
  action: "save" | "delete";
  disableThisOption?: boolean;
  disableThisReason?: string;
}

interface RecurrenceScopeOption {
  value: RecurrenceScope;
  label: string;
  description: string;
}

interface RecurrenceScopeOptionButtonProps extends RecurrenceScopeOption {
  isDisabled: boolean;
  disableThisReason: string;
  onSelect: (scope: RecurrenceScope) => void;
}

const OPTIONS: RecurrenceScopeOption[] = [
  { value: "this", label: "This event", description: "Apply detail/time changes only to this occurrence." },
  { value: "following", label: "This and following", description: "Apply from this occurrence onward." },
  { value: "all", label: "All events", description: "Apply to the whole recurring series." },
];

const getOptionClassName = (isDisabled: boolean) =>
  `w-full rounded-lg border px-3 py-3 text-left transition-colors ${isDisabled
    ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-70"
    : "border-gray-200 hover:border-orange-300 hover:bg-orange-50"}`;

/**
 * Renders a selectable recurrence scope option.
 * @param props - The option presentation and action handlers.
 * @param props.value - The scope value to submit.
 * @param props.label - The visible option label.
 * @param props.description - The base option description.
 * @param props.isDisabled - Whether the option is disabled.
 * @param props.disableThisReason - The disabled-state explanation.
 * @param props.onSelect - Handles scope selection.
 * @returns A recurrence scope button.
 */
export const RecurrenceScopeOptionButton = ({
  value,
  label,
  description,
  isDisabled,
  disableThisReason,
  onSelect,
}: RecurrenceScopeOptionButtonProps) => (
  <button
    type="button"
    aria-label={label}
    disabled={isDisabled}
    onClick={() => onSelect(value)}
    className={getOptionClassName(isDisabled)}
  >
    <p className="text-sm font-medium text-gray-900">{label}</p>
    <p className="text-xs text-gray-500">{description}{isDisabled ? ` ${disableThisReason}` : ""}</p>
  </button>
);

/**
 * Renders the recurrence scope chooser body.
 * @param props - The dialog panel props.
 * @param props.action - The save or delete action label.
 * @param props.onClose - Closes the modal.
 * @param props.onSelect - Handles scope selection.
 * @param props.disableThisOption - Whether the single-event option is disabled.
 * @param props.disableThisReason - The disabled-state explanation.
 * @returns The dialog panel content.
 */
export const RecurrenceScopeDialogPanel = forwardRef<HTMLDivElement, Omit<RecurrenceScopeModalProps, "isOpen">>(function RecurrenceScopeDialogPanel(
  { action, disableThisOption = false, disableThisReason = "Pattern changes require This and following or All events.", onClose, onSelect },
  ref,
) {
  return (
    <DialogPanel ref={ref} className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
      <DialogTitle className="text-lg font-semibold text-gray-900">Choose scope</DialogTitle>
      <p className="mt-1 text-sm text-gray-500">Do you want to {action} this occurrence, this and future occurrences, or the entire series?</p>
      <div className="mt-4 space-y-2">
        {OPTIONS.map((option) => (
          <RecurrenceScopeOptionButton key={option.value} {...option} isDisabled={option.value === "this" && action === "save" && disableThisOption} disableThisReason={disableThisReason} onSelect={onSelect} />
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
      </div>
    </DialogPanel>
  );
});

/**
 * Displays recurrence scope choices for recurring event changes.
 * @param props - The modal props.
 * @param props.isOpen - Whether the modal is visible.
 * @param props.onClose - Closes the modal.
 * @param props.onSelect - Handles scope selection.
 * @param props.action - The save or delete action label.
 * @param props.disableThisOption - Whether the single-event option is disabled.
 * @param props.disableThisReason - The disabled-state explanation.
 * @returns A recurrence scope modal.
 */
const RecurrenceScopeModal = ({ isOpen, onClose, onSelect, action, disableThisOption, disableThisReason }: RecurrenceScopeModalProps) => (
  <Transition show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-[60]" onClose={onClose}>
      <TransitionChild as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
        <div className="fixed inset-0 bg-slate-900/40" />
      </TransitionChild>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <TransitionChild as={Fragment} enter="ease-out duration-150" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-100" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
          <RecurrenceScopeDialogPanel action={action} disableThisOption={disableThisOption} disableThisReason={disableThisReason} onClose={onClose} onSelect={onSelect} />
        </TransitionChild>
      </div>
    </Dialog>
  </Transition>
);

export default RecurrenceScopeModal;
