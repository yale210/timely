import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { type BroadcastJobSummary } from "@/types";
import { formatDateTimeInTimezone } from "@/utils/userTimezone";

/**
 * Renders the table head for the admin broadcast history table.
 * @returns A table head component.
 */
export function AdminHistoryTableHead() {
  return (
    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
      <tr>
        <th className="px-4 py-3">Title</th>
        <th className="px-4 py-3">Audience</th>
        <th className="px-4 py-3">Sender</th>
        <th className="px-4 py-3">Status</th>
        <th className="px-4 py-3">Queued</th>
      </tr>
    </thead>
  );
}

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
export function AdminHistoryTableRow(props: AdminHistoryTableRowProps) {
  const { item, onSelectItem } = props;
  const sender = item.sender_username ?? "System";
  const deliverySummary = `Delivered ${item.delivered_count}/${item.recipient_count}`;
  const queuedAt = formatDateTimeInTimezone(item.queued_at);

  return (
    <tr key={item.id} className="cursor-pointer hover:bg-gray-50" onClick={() => onSelectItem(item.id)}>
      <td className="px-4 py-3">
        <Link
          to={`/admin/notifications/history/${item.id}`}
          className="block"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="font-medium text-gray-900">{item.title}</p>
          <p className="text-xs text-gray-500">{deliverySummary}</p>
        </Link>
      </td>
      <td className="px-4 py-3 capitalize text-gray-600">{item.target}</td>
      <td className="px-4 py-3 text-gray-600">{sender}</td>
      <td className="px-4 py-3">
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
          {item.status}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-500">{queuedAt}</td>
    </tr>
  );
}

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
export function AdminHistoryTableBody(props: AdminHistoryTableBodyProps) {
  const { items, loading, onSelectItem } = props;

  if (loading) {
    return (
      <tbody className="divide-y divide-gray-100">
        <tr>
          <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
            Loading...
          </td>
        </tr>
      </tbody>
    );
  }

  if (items.length === 0) {
    return (
      <tbody className="divide-y divide-gray-100">
        <tr>
          <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
            No broadcast history found.
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="divide-y divide-gray-100">
      {items.map((item) => (
        <AdminHistoryTableRow key={item.id} item={item} onSelectItem={onSelectItem} />
      ))}
    </tbody>
  );
}

interface AdminHistoryTablePaginationProps {
  /**
   * Current page number.
   */
  page: number;
  /**
   * Total number of pages available.
   */
  totalPages: number;
  /**
   * Whether history is currently being loaded.
   */
  loading: boolean;
  /**
   * Callback to go to the previous page.
   */
  onPreviousPage: () => void;
  /**
   * Callback to go to the next page.
   */
  onNextPage: () => void;
}

/**
 * Renders pagination controls for the broadcast history table.
 * @param props - Pagination state and change handlers.
 * @returns Pagination UI controls.
 */
export function AdminHistoryTablePagination(props: AdminHistoryTablePaginationProps) {
  const { page, totalPages, loading, onPreviousPage, onNextPage } = props;

  return (
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
  );
}

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
  const [isMobileLayout, setIsMobileLayout] = useState(() => typeof window !== "undefined" && window.innerWidth < 640);

  useEffect(() => {
    const syncViewport = () => {
      setIsMobileLayout(window.innerWidth < 640);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => {
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {isMobileLayout ? (
        <div className="divide-y divide-gray-200">
          {props.loading ? (
            <div className="px-4 py-8 text-center text-sm text-gray-500">Loading...</div>
          ) : props.items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-gray-500">No broadcast history found.</div>
          ) : (
            props.items.map((item) => {
              const sender = item.sender_username ?? "System";
              const deliverySummary = `Delivered ${item.delivered_count}/${item.recipient_count}`;
              const queuedAt = formatDateTimeInTimezone(item.queued_at);

              return (
                <article key={item.id} className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => props.onSelectItem(item.id)}
                    className="block w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-medium text-gray-900">{item.title}</p>
                        <p className="mt-1 text-xs text-gray-500">{deliverySummary}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                        {item.status}
                      </span>
                    </div>
                  </button>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Audience</dt>
                      <dd className="mt-1 capitalize text-gray-700">{item.target}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Sender</dt>
                      <dd className="mt-1 text-gray-700">{sender}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Queued</dt>
                      <dd className="mt-1 text-gray-500">{queuedAt}</dd>
                    </div>
                  </dl>

                  <Link
                    to={`/admin/notifications/history/${item.id}`}
                    className="mt-4 inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    View details
                  </Link>
                </article>
              );
            })
          )}
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <AdminHistoryTableHead />
          <AdminHistoryTableBody
            items={props.items}
            loading={props.loading}
            onSelectItem={props.onSelectItem}
          />
        </table>
      )}
      <AdminHistoryTablePagination
        page={props.page}
        totalPages={props.totalPages}
        loading={props.loading}
        onPreviousPage={props.onPreviousPage}
        onNextPage={props.onNextPage}
      />
    </div>
  );
};
