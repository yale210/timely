import { useCallback, useState } from "react";
import {
  getBroadcastDetail,
  getBroadcastStatus,
  retryFailedBroadcast,
} from "@/api/notifications";
import { type BroadcastJobDetail, type BroadcastJobStatusResponse } from "@/types";

/**
 * Hook to manage retry logic for a failed broadcast job.
 * @param broadcastId - The current broadcast ID.
 * @param setDetail - Setter for detail state.
 * @param setStatus - Setter for status state.
 * @returns Error and retry handler.
 */
export const useAdminHistoryDetailRetry = (
  broadcastId: number,
  setDetail: (d: BroadcastJobDetail) => void,
  setStatus: (s: BroadcastJobStatusResponse) => void,
  onRetrySuccess: (broadcastId: number) => void
) => {
  const [retryError, setRetryError] = useState<string | null>(null);

  const handleRetry = useCallback(async () => {
    try {
      setRetryError(null);
      const response = await retryFailedBroadcast(broadcastId);
      onRetrySuccess(response.broadcast_id);
      const [detailResponse, statusResponse] = await Promise.all([
        getBroadcastDetail(response.broadcast_id),
        getBroadcastStatus(response.broadcast_id),
      ]);
      setDetail(detailResponse);
      setStatus(statusResponse);
    } catch (err) {
      console.error("Retry failed", err);
      setRetryError("Retry failed. Please try again.");
    }
  }, [broadcastId, onRetrySuccess, setDetail, setStatus]);

  return { retryError, handleRetry };
};
