import { type BroadcastJobDetail, type BroadcastJobStatusResponse } from "@/types";
import { AdminHistoryDeliveryMetrics } from "./AdminHistoryDetailMetrics/AdminHistoryDeliveryMetrics";
import { AdminHistoryAudienceSnapshot } from "./AdminHistoryDetailMetrics/AdminHistoryAudienceSnapshot";

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
