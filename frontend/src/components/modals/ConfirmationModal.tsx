import { Fragment } from "react";
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle } from "@headlessui/react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: "danger" | "success" | "neutral";
}

/**
 * A functional component that renders a confirmation modal for destructive actions.
 * @param props - The properties for the ConfirmationModal component.
 * @param props.isOpen - Indicates whether the modal is open.
 * @param props.onClose - The callback function to close the modal.
 * @param props.onConfirm - The callback function to handle confirmation.
 * @param props.title - The title of the modal.
 * @param props.message - The message to display in the modal.
 * @param props.confirmText - The text for the confirmation button.
 * @param props.cancelText - The text for the cancellation button.
 * @returns The rendered confirmation modal component.
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  tone = "danger",
}: ConfirmationModalProps) => {
  const toneStyles = {
    danger: {
      iconWrapperClass: "bg-red-100",
      iconClass: "text-red-600",
      iconName: "warning",
      confirmButtonClass: "bg-red-600 hover:bg-red-500",
    },
    success: {
      iconWrapperClass: "bg-emerald-100",
      iconClass: "text-emerald-600",
      iconName: "check_circle",
      confirmButtonClass: "bg-emerald-600 hover:bg-emerald-500",
    },
    neutral: {
      iconWrapperClass: "bg-slate-100",
      iconClass: "text-slate-600",
      iconName: "info",
      confirmButtonClass: "bg-slate-900 hover:bg-slate-700",
    },
  } as const;

  const activeTone = toneStyles[tone];

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-60" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10 ${activeTone.iconWrapperClass}`}>
                    <span className={`material-icons ${activeTone.iconClass}`}>{activeTone.iconName}</span>
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <DialogTitle as="h3" className="text-lg font-semibold leading-6 text-black">
                      {title}
                    </DialogTitle>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {message}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    type="button"
                    className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:w-auto transition-colors ${activeTone.confirmButtonClass}`}
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                  >
                    {confirmText}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-black shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-colors"
                    onClick={onClose}
                  >
                    {cancelText}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ConfirmationModal;
