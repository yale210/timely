import { type BroadcastJobSummary } from "@/types";

interface AdminHistoryHistoryTableRowProps {
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
export const AdminHistoryHistoryTableRow = (
  props: AdminHistoryHistoryTableRowProps
) => {
  const { item, onSelectItem } = props;

  return (
    <tr
      key={item.id}
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => onSelectItem(item.id)}
    >
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900">{item.title}</p>
        <p className="text-xs text-gray-500">
          Delivered {item.delivered_count}/{item.recipient_count}
        </p>
      </td>
      <td className="px-4 py-3 capitalize text-gray-600">{item.target}</td>
      <td className="px-4 py-3 text-gray-600">{item.sender_username ?? "System"}</td>
      <td className="px-4 py-3">
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
          {item.status}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-500">
        {new Date(item.queued_at).toLocaleString()}
      </td>
    </tr>
  );
};
