import { useState } from "react"
import ConfirmationModal from "@/components/modals/ConfirmationModal"

interface PrivacySectionProps {
  deleting: boolean
  onDeleteTasks: () => Promise<string>
  onDeleteEvents: () => Promise<string>
}

interface PrivacyActionCardProps {
  description: string
  deleting: boolean
  icon: string
  onClick: () => void
  title: string
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
        className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          deleting
            ? "cursor-not-allowed bg-gray-200 text-gray-500"
            : "bg-red-50 text-red-700 hover:bg-red-100"
        }`}
      >
        <span className="material-icons text-lg">{icon}</span>
        {deleting ? "Deleting..." : title}
      </button>
    </div>
  </div>
)

const PrivacySection = ({
  deleting,
  onDeleteTasks,
  onDeleteEvents,
}: PrivacySectionProps) => {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<"events" | "tasks" | null>(null)

  const handleDeleteEvents = () => {
    setMessage(null)
    setError(null)
    onDeleteEvents()
      .then((result) => {
        setMessage(result)
      })
      .catch(() => {
        setError("Failed to delete events.")
      })
  }

  const handleDeleteTasks = () => {
    setMessage(null)
    setError(null)
    onDeleteTasks()
      .then((result) => {
        setMessage(result)
      })
      .catch(() => {
        setError("Failed to delete tasks.")
      })
  }

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
          icon="event_busy"
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
      </div>

      <ConfirmationModal
        isOpen={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction === "events") {
            handleDeleteEvents()
            return
          }
          if (pendingAction === "tasks") {
            handleDeleteTasks()
          }
        }}
        title={pendingAction === "events" ? "Delete all events" : "Delete all tasks"}
        message={
          pendingAction === "events"
            ? "This will permanently remove all calendar events from your account."
            : "This will permanently remove all tasks from your account."
        }
        confirmText={pendingAction === "events" ? "Delete events" : "Delete tasks"}
      />
    </div>
  )
}

export default PrivacySection
