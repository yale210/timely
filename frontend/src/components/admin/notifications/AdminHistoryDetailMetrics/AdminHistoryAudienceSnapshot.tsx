import { type BroadcastJobDetail } from "@/types";

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
export const AdminHistoryAudienceSnapshot = (props: AdminHistoryAudienceSnapshotProps) => {
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
};
