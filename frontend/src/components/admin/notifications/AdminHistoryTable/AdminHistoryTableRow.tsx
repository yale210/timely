import { Link } from "react-router-dom";
import { type BroadcastJobSummary } from "@/types";
import { formatDateTimeInTimezone } from "@/utils/userTimezone";

interface AdminHistoryTableRowProps {
  /**
   * Broadcast job summary object to display.
   */
  item: BroadcastJobSummary;
  /**
   * Callback when the row is selected.
   * @param itemId - The ID of the job.
   */
  onSelectItem: (itemId: number) => void;
}

/**
 * Renders a single row in the admin broadcast history table.
 * @param props - Job item and selection callback.
 * @returns A table row component.
 */
export const AdminHistoryTableRow = (
  props: AdminHistoryTableRowProps
) => {
  const { item, onSelectItem } = props;
  const sender = item.sender_username ?? "System";
  const deliverySummary = `Delivered ${item.delivered_count}/${item.recipient_count}`;
  const queuedAt = formatDateTimeInTimezone(item.queued_at);

  return (
    <tr key={item.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onSelectItem(item.id)}>
      <td className="px-4 py-3">
        <Link to={`/admin/notifications/history/${item.id}`} className="block" onClick={(e) => e.stopPropagation()}>
          <p className="font-medium text-gray-900">{item.title}</p>
          <p className="text-xs text-gray-500">{deliverySummary}</p>
        </Link>
      </td>
      <td className="px-4 py-3 capitalize text-gray-600">{item.target}</td>
      <td className="px-4 py-3 text-gray-600">{sender}</td>
      <td className="px-4 py-3"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">{item.status}</span></td>
      <td className="px-4 py-3 text-gray-500">{queuedAt}</td>
    </tr>
  );
};
