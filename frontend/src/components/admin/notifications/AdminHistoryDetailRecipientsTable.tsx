import { type BroadcastRecipientDetail } from "@/types";
import { AdminHistoryRecipientRow } from "./AdminHistoryDetailRecipientsTable/AdminHistoryRecipientRow";

interface AdminHistoryDetailRecipientsTableProps {
  recipients: BroadcastRecipientDetail[];
}

/**
 * Renders per-recipient delivery status for a broadcast.
 * @param props - Recipient table data.
 * @returns A table of recipient delivery outcomes.
 */
export const AdminHistoryDetailRecipientsTable = (props: AdminHistoryDetailRecipientsTableProps) => {
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
            {props.recipients.map((recipient) => (
              <AdminHistoryRecipientRow key={recipient.id} recipient={recipient} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
