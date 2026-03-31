import { type BroadcastJobDetail, type BroadcastJobStatusResponse } from "@/types";

interface AdminHistoryDeliveryMetricsProps {
  /**
   * Current status and delivery stats for the broadcast job.
   */
  status: BroadcastJobStatusResponse;
}

/**
 * Renders delivery status metrics for an admin broadcast.
 * @param props - Current status data.
 * @returns A delivery metrics component.
 */
export function AdminHistoryDeliveryMetrics(props: AdminHistoryDeliveryMetricsProps) {
  const { status } = props;

  return (
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
  );
}

interface AdminHistoryAudienceSnapshotProps {
  /**
   * Detailed broadcast job data including audience snapshot.
   */
  detail: BroadcastJobDetail;
}

/**
 * Renders audience snapshot information for a broadcast job.
 * @param props - Broadcast detail data.
 * @returns An audience snapshot component.
 */
export function AdminHistoryAudienceSnapshot(props: AdminHistoryAudienceSnapshotProps) {
  const { detail } = props;

  const count = detail.audience_snapshot.recipient_count ?? detail.recipient_count;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Audience snapshot</h2>
      <p className="mt-3 text-sm text-gray-600">
        Target: <span className="font-medium capitalize text-gray-800">{detail.target}</span>
      </p>
      <p className="mt-1 text-sm text-gray-600">
        Snapshot count: <span className="font-medium text-gray-800">{count}</span>
      </p>
    </div>
  );
}

interface AdminHistoryDetailPayloadProps {
  message: string;
}

/**
 * Displays the message payload for a broadcast entry.
 * @param props - Payload display props.
 * @returns A card containing the broadcast message text.
 */
export const AdminHistoryDetailPayload = (props: AdminHistoryDetailPayloadProps) => {
  const { message } = props;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Payload</h2>
      <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{message}</p>
    </div>
  );
};

interface AdminHistoryDetailMetricsProps {
  detail: BroadcastJobDetail;
  status: BroadcastJobStatusResponse;
}

/**
 * Renders delivery and audience metrics for an admin broadcast.
 * @param props - Broadcast detail and current status data.
 * @returns A metrics panel for delivery status and audience snapshot.
 */
export const AdminHistoryDetailMetrics = (props: AdminHistoryDetailMetricsProps) => {
  return (
    <>
      <AdminHistoryDeliveryMetrics status={props.status} />
      <AdminHistoryAudienceSnapshot detail={props.detail} />
    </>
  );
};
