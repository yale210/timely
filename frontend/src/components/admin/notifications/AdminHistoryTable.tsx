import { type BroadcastJobSummary } from "@/types/notification";

interface AdminHistoryTableProps {
  items: BroadcastJobSummary[];
  loading: boolean;
  page: number;
  totalPages: number;
  onSelectItem: (itemId: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

/**
 * Displays paginated admin broadcast history in a table.
 * @param props - Table data and pagination callbacks.
 * @returns A history table with previous and next controls.
 */
export const AdminHistoryTable = (props: AdminHistoryTableProps) => {
  const { items, loading, page, totalPages, onSelectItem, onPreviousPage, onNextPage } = props;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Audience</th>
            <th className="px-4 py-3">Sender</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Queued</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                Loading...
              </td>
            </tr>
          )}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                No broadcast history found.
              </td>
            </tr>
          )}
          {!loading &&
            items.map((item) => (
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
                <td className="px-4 py-3 text-gray-500">{new Date(item.queued_at).toLocaleString()}</td>
              </tr>
            ))}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
        <p className="text-gray-500">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPreviousPage}
            disabled={page === 1 || loading}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={page >= totalPages || loading}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
