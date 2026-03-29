import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { type BroadcastJobSummary } from "@/types";
import { AdminHistoryTableHead } from "./AdminHistoryTable/AdminHistoryTableHead";
import { AdminHistoryTableBody } from "./AdminHistoryTable/AdminHistoryTableBody";
import { AdminHistoryTablePagination } from "./AdminHistoryTable/AdminHistoryTablePagination";
import { formatDateTimeInTimezone } from "@/utils/userTimezone";

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
