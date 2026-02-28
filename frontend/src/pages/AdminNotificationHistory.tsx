import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBroadcastHistory } from "../api/notifications";
import { type BroadcastJobSummary } from "../types/notification";

/**
 * Admin page that displays a paginated, filterable table of past notification broadcasts.
 */
export const AdminNotificationHistory = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<BroadcastJobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const data = await getBroadcastHistory({
          page,
          q: search || undefined,
          status: statusFilter || undefined,
          target: targetFilter || undefined,
        });
        setItems(data.results);
        setCount(data.count);
        setError(null);
      } catch (historyError) {
        console.error("Failed to load broadcast history", historyError);
        setError("Failed to load broadcast history.");
      } finally {
        setLoading(false);
      }
    };

    void loadHistory();
  }, [page, search, statusFilter, targetFilter]);

  const totalPages = Math.max(1, Math.ceil(count / 50));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Admin tools</p>
          <h1 className="text-3xl font-semibold text-gray-900">Notification history</h1>
          <p className="mt-2 text-sm text-gray-600">Review all notification broadcasts.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            void navigate("/admin/notifications");
          }}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          New notification
        </button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search title..."
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
        <select
          value={targetFilter}
          onChange={(event) => {
            setTargetFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">All audiences</option>
          <option value="all">All users</option>
          <option value="staff">Staff</option>
          <option value="admin">Admins</option>
          <option value="users">Specific users</option>
          <option value="retry_failed">Retry failed</option>
        </select>
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        >
          <option value="">All statuses</option>
          <option value="QUEUED">Queued</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="PARTIAL">Partial</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

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
                  onClick={() => {
                    void navigate(`/admin/notifications/history/${item.id}`);
                  }}
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
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page === 1 || loading}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages || loading}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
