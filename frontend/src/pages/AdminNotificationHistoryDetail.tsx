import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getBroadcastDetail,
  getBroadcastStatus,
  retryFailedBroadcast,
} from "../api/notifications";
import { type BroadcastJobDetail, type BroadcastJobStatusResponse } from "../types/notification";
import ConfirmationModal from "../components/modals/ConfirmationModal";

const POLL_INTERVAL_MS = 3000;

const isTerminal = (status: string) =>
  status === "COMPLETED" || status === "PARTIAL" || status === "FAILED";

/**
 * Detail view for a single broadcast job showing payload, recipient delivery, and metrics.
 */
export const AdminNotificationHistoryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const broadcastId = Number(id);
  const [detail, setDetail] = useState<BroadcastJobDetail | null>(null);
  const [status, setStatus] = useState<BroadcastJobStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetryConfirmOpen, setIsRetryConfirmOpen] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const failedRecipients = useMemo(
    () => detail?.recipients.filter((item) => item.status === "FAILED") ?? [],
    [detail],
  );

  useEffect(() => {
    if (!Number.isFinite(broadcastId) || broadcastId <= 0) {
      setError("Invalid broadcast ID.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [detailResponse, statusResponse] = await Promise.all([
          getBroadcastDetail(broadcastId),
          getBroadcastStatus(broadcastId),
        ]);
        setDetail(detailResponse);
        setStatus(statusResponse);
        setError(null);
      } catch (loadError) {
        console.error("Failed to load broadcast detail", loadError);
        setError("Failed to load broadcast detail.");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [broadcastId]);

  useEffect(() => {
    if (!broadcastId || !status || isTerminal(status.status)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void getBroadcastStatus(broadcastId)
        .then((response) => {
          setStatus(response);
        })
        .catch((statusError) => {
          console.error("Failed to poll broadcast status", statusError);
        });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [broadcastId, status]);

  const handleRetry = async () => {
    try {
      setRetryError(null);
      const response = await retryFailedBroadcast(broadcastId);
      const [detailResponse, statusResponse] = await Promise.all([
        getBroadcastDetail(response.broadcast_id),
        getBroadcastStatus(response.broadcast_id),
      ]);
      setDetail(detailResponse);
      setStatus(statusResponse);
    } catch (retryActionError) {
      console.error("Retry failed", retryActionError);
      setRetryError("Retry failed. Please try again.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }
  if (error || !detail || !status) {
    return <div className="p-8 text-center text-red-600">{error ?? "Broadcast not found"}</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            to="/admin/notifications/history"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Back to history
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900">{detail.title}</h1>
          <p className="mt-1 text-sm text-gray-500">Queued {new Date(detail.queued_at).toLocaleString()}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsRetryConfirmOpen(true)}
          disabled={failedRecipients.length === 0}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Retry failed recipients
        </button>
      </div>

      {retryError && <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{retryError}</div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Payload</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{detail.message}</p>
          </div>

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
                  {detail.recipients.map((recipient) => (
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
                        {recipient.error_message || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Delivery metrics</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd className="font-medium text-gray-800">{status.status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Recipients</dt>
                <dd className="font-medium text-gray-800">{status.recipient_count}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Delivered</dt>
                <dd className="font-medium text-emerald-600">{status.delivered_count}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Failed</dt>
                <dd className="font-medium text-red-600">{status.failed_count}</dd>
              </div>
              <div className="pt-2 text-xs text-gray-500">Task ID: {status.task_id}</div>
            </dl>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Audience snapshot</h2>
            <p className="mt-3 text-sm text-gray-600">
              Target: <span className="font-medium capitalize text-gray-800">{detail.target}</span>
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Snapshot count:{" "}
              <span className="font-medium text-gray-800">
                {detail.audience_snapshot.recipient_count ?? detail.recipient_count}
              </span>
            </p>
          </div>
        </aside>
      </div>

      <ConfirmationModal
        isOpen={isRetryConfirmOpen}
        onClose={() => setIsRetryConfirmOpen(false)}
        onConfirm={() => {
          void handleRetry();
        }}
        title="Retry failed recipients?"
        message={`This will re-send to ${failedRecipients.length} failed recipients only.`}
        confirmText="Retry failed"
      />
    </div>
  );
};
