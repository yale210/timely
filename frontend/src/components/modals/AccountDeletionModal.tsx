import { Fragment, useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";

interface AccountDeletionModalProps {
  isOpen: boolean;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void> | void;
}

/**
 * Password-confirmed modal for destructive account deletion.
 * @param props - Modal props.
 * @param props.isOpen - Indicates whether the modal is open.
 * @param props.isDeleting - Indicates whether deletion is currently in progress.
 * @param props.onClose - Closes the modal.
 * @param props.onConfirm - Submits the password-confirmed deletion request.
 * @returns Account deletion dialog.
 */
const AccountDeletionModal = ({
  isOpen,
  isDeleting = false,
  onClose,
  onConfirm,
}: AccountDeletionModalProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const resetAndClose = () => {
    setPassword("");
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setError(null);

    try {
      await onConfirm(password);
      resetAndClose();
    } catch {}
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-60"
        onClose={isDeleting ? () => undefined : resetAndClose}
      >
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
                  <div className="mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <span className="material-icons text-red-600">warning</span>
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <DialogTitle
                      as="h3"
                      className="text-lg font-semibold leading-6 text-black"
                    >
                      Delete account
                    </DialogTitle>
                    <p className="mt-2 text-sm text-gray-500">
                      Enter your password to permanently delete your account and
                      all associated data.
                    </p>
                    <div className="mt-4">
                      <label
                        htmlFor="delete-account-password"
                        className="block text-sm font-medium text-gray-900"
                      >
                        Password
                      </label>
                      <input
                        id="delete-account-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        disabled={isDeleting}
                        autoComplete="current-password"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                      />
                    </div>
                    {error ? (
                      <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-3 sm:mt-4 sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-300 sm:w-auto"
                    onClick={() => {
                      void handleConfirm();
                    }}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete account"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-black shadow-sm ring-1 ring-inset ring-gray-300 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100 sm:w-auto"
                    onClick={resetAndClose}
                    disabled={isDeleting}
                  >
                    Cancel
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

export default AccountDeletionModal;
