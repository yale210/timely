import { type BroadcastRecipientDetail } from "@/types";

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
export const AdminHistoryRecipientRow = (props: AdminHistoryRecipientRowProps) => {
  const { recipient } = props;

  return (
    <tr key={recipient.id}>
      <td className="px-3 py-2">
        <p className="font-medium text-gray-800">{recipient.username}</p>
        <p className="text-xs text-gray-500">{recipient.email}</p>
      </td>
      <td className="px-3 py-2">
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
          {recipient.status}
        </span>
      </td>
      <td className="px-3 py-2 text-xs text-gray-500">
        {recipient.error_message || "-"}
      </td>
    </tr>
  );
};
