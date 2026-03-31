import { useState } from "react";
import ConfirmationModal from "@/components/modals/ConfirmationModal";
import AccountDeletionModal from "@/components/modals/AccountDeletionModal";

interface PrivacySectionProps {
  deleting: boolean;
  onDeleteTasks: () => Promise<string>;
  onDeleteEvents: () => Promise<string>;
  onDeleteAccount: (password: string) => Promise<string>;
}

interface PrivacyActionCardProps {
  description: string;
  deleting: boolean;
  icon: string;
  onClick: () => void;
  title: string;
}

const PrivacyActionCard = ({
  description,
  deleting,
  icon,
  onClick,
  title,
}: PrivacyActionCardProps) => (
  <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={deleting}
        aria-label={deleting ? `Deleting ${title}` : title}
        title={deleting ? `Deleting ${title}` : title}
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors ${
          deleting
            ? "cursor-not-allowed bg-gray-200 text-gray-500"
            : "bg-red-50 text-red-700 hover:bg-red-100"
        }`}
      >
        <span className="material-icons text-lg">{icon}</span>
      </button>
    </div>
  </div>
);

const PrivacySection = ({
  deleting,
  onDeleteTasks,
  onDeleteEvents,
  onDeleteAccount,
}: PrivacySectionProps) => {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "events" | "tasks" | "account" | null
  >(null);

  const executeAction = async (
    action: () => Promise<string>,
    fallbackError: string,
    rethrow = false,
  ) => {
    setMessage(null);
    setError(null);

    try {
      const result = await action();
      setMessage(result);
    } catch {
      setError(fallbackError);
      if (rethrow) {
        throw new Error(fallbackError);
      }
    }
  };

  const handleDeleteEvents = async () => {
    await executeAction(onDeleteEvents, "Failed to delete events.");
  };

  const handleDeleteTasks = async () => {
    await executeAction(onDeleteTasks, "Failed to delete tasks.");
  };

  const handleDeleteAccount = async (password: string) => {
    await executeAction(
      () => onDeleteAccount(password),
      "Failed to delete account.",
      true,
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Privacy</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your personal data in the app.
        </p>
      </div>

      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-3">
        <PrivacyActionCard
          title="Delete Events"
          description="Remove all calendar events from your account. This cannot be undone."
          icon="delete_forever"
          deleting={deleting}
          onClick={() => setPendingAction("events")}
        />
        <PrivacyActionCard
          title="Delete Tasks"
          description="Remove all tasks from your account. This cannot be undone."
          icon="delete_forever"
          deleting={deleting}
          onClick={() => setPendingAction("tasks")}
        />
        <PrivacyActionCard
          title="Delete Account"
          description="Permanently delete your account and all associated data. This cannot be undone."
          icon="delete_forever"
          deleting={deleting}
          onClick={() => setPendingAction("account")}
        />
      </div>

      <ConfirmationModal
        isOpen={pendingAction === "events" || pendingAction === "tasks"}
        onClose={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction === "events") {
            void handleDeleteEvents();
            return;
          }
          if (pendingAction === "tasks") {
            void handleDeleteTasks();
          }
        }}
        title={
          pendingAction === "events"
            ? "Delete all events"
            : pendingAction === "tasks"
              ? "Delete all tasks"
              : "Delete account"
        }
        message={
          pendingAction === "events"
            ? "This will permanently remove all calendar events from your account."
            : pendingAction === "tasks"
              ? "This will permanently remove all tasks from your account."
              : "This will permanently delete your account and all associated data."
        }
        confirmText={
          pendingAction === "events"
            ? "Delete events"
            : pendingAction === "tasks"
              ? "Delete tasks"
              : "Delete account"
        }
      />
      <AccountDeletionModal
        isOpen={pendingAction === "account"}
        isDeleting={deleting}
        onClose={() => setPendingAction(null)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
};

export default PrivacySection;
