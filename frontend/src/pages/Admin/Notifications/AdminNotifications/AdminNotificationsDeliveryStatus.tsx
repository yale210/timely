import { Link } from "react-router-dom";
import { ClockIcon } from "@heroicons/react/24/outline";
import { type BroadcastJobStatusResponse } from "@/types";

interface AdminNotificationsDeliveryStatusProps {
  /**
   * Delivery state and status from the broadcast form hook.
   */
  delivery: {
    deliveryStatus: BroadcastJobStatusResponse | null;
    statusLabel: string;
    statusTone: string;
  };
}

/**
 * Renders the current broadcast delivery status panel.
 * @param props - Delivery state data.
 * @returns Delivery status UI component.
 */
export const AdminNotificationsDeliveryStatus = (props: AdminNotificationsDeliveryStatusProps) => {
  const { deliveryStatus, statusLabel, statusTone } = props.delivery;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Delivery status</h2>
        <Link
          to="/admin/notifications/history"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
          title="Notification history"
        >
          <ClockIcon className="h-5 w-5" />
        </Link>
      </div>
      {deliveryStatus ? (
        <div className="mt-4 space-y-2 text-sm">
          <p className="text-gray-600">
            Broadcast ID:{" "}
            <span className="font-medium text-gray-800">{deliveryStatus.id}</span>
          </p>
          <p className={statusTone}>
            Status: <span className="font-semibold">{statusLabel}</span>
          </p>
          <p className="text-gray-600">
            Delivered: {deliveryStatus.delivered_count}/{deliveryStatus.recipient_count}
          </p>
          <p className="text-gray-600">Failed: {deliveryStatus.failed_count}</p>
          <p className="text-xs text-gray-500">Task ID: {deliveryStatus.task_id}</p>
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500">No broadcasts queued yet.</p>
      )}
    </div>
  );
};
