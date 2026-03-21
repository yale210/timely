import { useEffect } from "react";
import { getBroadcastStatus } from "@/api/notifications";
import { type BroadcastJobStatusResponse } from "@/types";

const POLL_INTERVAL_MS = 3000;

const isTerminal = (status: string) =>
  status === "COMPLETED" || status === "PARTIAL" || status === "FAILED";

/**
 * Hook to poll for broadcast status updates.
 * @param broadcastId - The ID of the broadcast job.
 * @param status - Current status object.
 * @param setStatus - Setter for status.
 */
export const useAdminHistoryDetailPolling = (
  broadcastId: number,
  status: BroadcastJobStatusResponse | null,
  setStatus: (s: BroadcastJobStatusResponse) => void
) => {
  useEffect(() => {
    if (!broadcastId || !status || isTerminal(status.status)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void getBroadcastStatus(broadcastId)
        .then((response) => {
          setStatus(response);
        })
        .catch((err) => {
          console.error("Failed to poll broadcast status", err);
        });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [broadcastId, status, setStatus]);
};
