import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment } from "react";
import { type RecurrenceScope } from "../types";

interface RecurrenceScopeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (scope: RecurrenceScope) => void;
  action: "save" | "delete";
  disableThisOption?: boolean;
  disableThisReason?: string;
}

const OPTIONS: { value: RecurrenceScope; label: string; description: string }[] = [
  {
    value: "this",
    label: "This event",
    description: "Apply detail/time changes only to this occurrence.",
  },
  {
    value: "following",
    label: "This and following",
    description: "Apply from this occurrence onward.",
  },
  {
    value: "all",
    label: "All events",
    description: "Apply to the whole recurring series.",
  },
];

const RecurrenceScopeModal = ({
  isOpen,
  onClose,
  onSelect,
  action,
  disableThisOption = false,
  disableThisReason = "Pattern changes require This and following or All events.",
}: RecurrenceScopeModalProps) => (
  <Transition show={isOpen} as={Fragment}>
    <Dialog as="div" className="relative z-[60]" onClose={onClose}>
      <TransitionChild
        as={Fragment}
        enter="ease-out duration-150"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-slate-900/40" />
      </TransitionChild>

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <DialogPanel className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Choose scope
            </DialogTitle>
            <p className="mt-1 text-sm text-gray-500">
              Do you want to {action} this occurrence, this and future occurrences, or the entire series?
            </p>

            <div className="mt-4 space-y-2">
              {OPTIONS.map((option) => {
                const isDisabled =
                  option.value === "this" && action === "save" && disableThisOption;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-label={option.label}
                    disabled={isDisabled}
                    onClick={() => onSelect(option.value)}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                      isDisabled
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-70"
                        : "border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900">{option.label}</p>
                    <p className="text-xs text-gray-500">
                      {option.description}
                      {isDisabled ? ` ${disableThisReason}` : ""}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </Transition>
);

export default RecurrenceScopeModal;
