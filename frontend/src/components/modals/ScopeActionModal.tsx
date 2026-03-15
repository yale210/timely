import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Fragment } from "react";
import { type RecurrenceScope } from "@/types";

interface ScopeActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: "save" | "delete";
  scope: Exclude<RecurrenceScope, "this"> | null;
}

const ScopeActionModal = ({
  isOpen,
  onClose,
  onConfirm,
  action,
  scope,
}: ScopeActionModalProps) => {
  const isDelete = action === "delete";
  const isFollowing = scope === "following";
  const scopeLabel = isFollowing ? "this and following events" : "all events in this series";
  const title = isDelete
    ? `Delete ${scopeLabel}?`
    : `Apply changes to ${scopeLabel}?`;
  const message = isDelete
    ? "Only events in this scope will be removed. This action cannot be undone."
    : "Past events outside this scope stay unchanged. This keeps your series history intact.";
  const confirmLabel = isDelete
    ? isFollowing
      ? "Delete Following Events"
      : "Delete All Events"
    : isFollowing
      ? "Apply to Following Events"
      : "Apply to All Events";

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[70]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0 scale-95 translate-y-1"
            enterTo="opacity-100 scale-100 translate-y-0"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100 translate-y-0"
            leaveTo="opacity-0 scale-95 translate-y-1"
          >
            <DialogPanel className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
                Series Scope
              </div>
              <DialogTitle className="text-lg font-semibold text-gray-900">
                {title}
              </DialogTitle>
              <p className="mt-2 text-sm text-gray-600">{message}</p>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                    isDelete
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-orange-500 hover:bg-orange-600"
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ScopeActionModal;

