import { type BroadcastRecipientDetail } from "@/types";

const STATUS_BADGE_CLASSES: Record<BroadcastRecipientDetail["status"], string> = {
  PENDING: "bg-gray-100 text-gray-700",
  SENT: "bg-green-100 text-green-700",
  SENT_NO_PUSH: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<BroadcastRecipientDetail["status"], string> = {
  PENDING: "Pending",
  SENT: "Sent",
  SENT_NO_PUSH: "No push devices",
  FAILED: "Failed",
};

const STATUS_TOOLTIPS: Record<BroadcastRecipientDetail["status"], string> = {
  PENDING: "In-app notification created. Push delivery is still queued.",
  SENT: "In-app notification created. Push delivered to at least one device.",
  SENT_NO_PUSH: "In-app notification created, but the user has no push-enabled devices.",
  FAILED: "In-app notification created, but push delivery failed for all devices.",
};

interface AdminHistoryRecipientRowProps {
  /**
   * Recipient delivery detail object.
   */
  recipient: BroadcastRecipientDetail;
}

/**
 * Renders a single row in the recipient delivery table.
 * @param props - Recipient detail data.
 * @returns A table row component.
 */
export function AdminHistoryRecipientRow(props: AdminHistoryRecipientRowProps) {
  const { recipient } = props;

  return (
    <tr key={recipient.id}>
      <td className="px-3 py-2">
        <p className="font-medium text-gray-800">{recipient.username}</p>
        <p className="text-xs text-gray-500">{recipient.email}</p>
      </td>
      <td className="px-3 py-2">
        <span
          title={STATUS_TOOLTIPS[recipient.status]}
          className={`cursor-help rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE_CLASSES[recipient.status]}`}
        >
          {STATUS_LABELS[recipient.status]}
        </span>
      </td>
      <td className="px-3 py-2 text-xs text-gray-500">{recipient.error_message || "-"}</td>
    </tr>
  );
}

interface AdminHistoryDetailRecipientsTableProps {
  recipients: BroadcastRecipientDetail[];
  page: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}

/**
 * Renders per-recipient delivery status for a broadcast with pagination.
 * @param props - Recipient table data and pagination controls.
 * @returns A table of recipient delivery outcomes.
 */
export const AdminHistoryDetailRecipientsTable = (props: AdminHistoryDetailRecipientsTableProps) => {
  const { recipients, page, totalPages, loading, onPageChange } = props;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Recipient delivery</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-gray-500">Loading...</td>
              </tr>
            ) : recipients.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-8 text-center text-gray-500">No recipients found.</td>
              </tr>
            ) : (
              recipients.map((recipient) => (
                <AdminHistoryRecipientRow key={recipient.id} recipient={recipient} />
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
          <p className="text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1 || loading}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
