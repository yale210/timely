import { useEffect, useState } from "react";
import { getBroadcastDetail, getBroadcastStatus } from "@/api/notifications";
import { type BroadcastJobDetail, type BroadcastJobStatusResponse } from "@/types";

const isInvalidBroadcastId = (broadcastId: number) =>
  !Number.isFinite(broadcastId) || broadcastId <= 0;

const loadBroadcastHistoryDetailData = (broadcastId: number) =>
  Promise.all([getBroadcastDetail(broadcastId), getBroadcastStatus(broadcastId)]);

/**
 * Hook to fetch broadcast job detail and status.
 * @param broadcastId - The ID of the broadcast job.
 * @returns Detail, status, loading and error states.
 */
export const useAdminHistoryDetailFetch = (broadcastId: number) => {
  const [detail, setDetail] = useState<BroadcastJobDetail | null>(null);
  const [status, setStatus] = useState<BroadcastJobStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isInvalidBroadcastId(broadcastId)) {
      setError("Invalid broadcast ID.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [d, s] = await loadBroadcastHistoryDetailData(broadcastId);
        setDetail(d);
        setStatus(s);
        setError(null);
      } catch (err) {
        console.error("Failed to load broadcast detail", err);
        setError("Failed to load broadcast detail.");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [broadcastId]);

  return { detail, setDetail, status, setStatus, loading, error };
};
