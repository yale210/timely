import { type BroadcastJobSummary } from "@/types";
import { AdminHistoryHistoryTableRow } from "./AdminHistoryHistoryTableRow";

interface AdminHistoryTableBodyProps {
  /**
   * List of broadcast job summaries to display.
   */
  items: BroadcastJobSummary[];
  /**
   * Whether history is currently being loaded.
   */
  loading: boolean;
  /**
   * Callback when a job item is selected.
   * @param itemId - The ID of the selected job.
   */
  onSelectItem: (itemId: number) => void;
}

/**
 * Renders the body of the broadcast history table, including empty/loading states.
 * @param props - Table data and selection callbacks.
 * @returns A tbody component.
 */
export const AdminHistoryTableBody = (props: AdminHistoryTableBodyProps) => {
  const { items, loading, onSelectItem } = props;

  if (loading) {
    return (
      <tbody className="divide-y divide-gray-100">
        <tr>
          <td colSpan={5} className="px-4 py-6 text-center text-gray-500">Loading...</td>
        </tr>
      </tbody>
    );
  }

  if (items.length === 0) {
    return (
      <tbody className="divide-y divide-gray-100">
        <tr>
          <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No broadcast history found.</td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="divide-y divide-gray-100">
      {items.map((item) => (
        <AdminHistoryHistoryTableRow key={item.id} item={item} onSelectItem={onSelectItem} />
      ))}
    </tbody>
  );
};
