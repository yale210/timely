import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { type BroadcastJobDetail, type BroadcastJobStatusResponse } from "@/types";
import {
  getBroadcastDetail,
  getBroadcastStatus,
  retryFailedBroadcast,
} from "@/api/notifications";

const isInvalidBroadcastId = (broadcastId: number) =>
  !Number.isFinite(broadcastId) || broadcastId <= 0;

const loadBroadcastHistoryDetailData = (broadcastId: number) =>
  Promise.all([getBroadcastDetail(broadcastId), getBroadcastStatus(broadcastId)]);

const POLL_INTERVAL_MS = 3000;

const isTerminal = (status: string) =>
  status === "COMPLETED" || status === "PARTIAL" || status === "FAILED";

interface UseAdminHistoryDetailReturn {
  state: { detail: BroadcastJobDetail | null; status: BroadcastJobStatusResponse | null; isRetryConfirmOpen: boolean; failedRecipientsCount: number; };
  loading: boolean; error: string | null; retryError: string | null; broadcastId: number;
  actions: { setRetryConfirmOpen: (isOpen: boolean) => void; handleRetry: () => Promise<void>; };
}

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

/**
 * Hook to poll for broadcast status updates.
 * @param broadcastId - The ID of the broadcast job.
 * @param status - Current status object.
 * @param setStatus - Setter for status.
 */
export const useAdminHistoryDetailPolling = (
  broadcastId: number,
  status: BroadcastJobStatusResponse | null,
  setStatus: (s: BroadcastJobStatusResponse) => void,
) => {
  const currentStatus = status?.status;

  useEffect(() => {
    if (!broadcastId || !currentStatus || isTerminal(currentStatus)) {
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
  }, [broadcastId, currentStatus, setStatus]);
};

/**
 * Hook to manage retry logic for a failed broadcast job.
 * @param broadcastId - The current broadcast ID.
 * @param setDetail - Setter for detail state.
 * @param setStatus - Setter for status state.
 * @param onRetrySuccess - Callback invoked with the new broadcast ID after a successful retry.
 * @returns Error and retry handler.
 */
export const useAdminHistoryDetailRetry = (
  broadcastId: number,
  setDetail: (d: BroadcastJobDetail) => void,
  setStatus: (s: BroadcastJobStatusResponse) => void,
  onRetrySuccess: (broadcastId: number) => void,
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

/**
 * Provides state and actions for the admin broadcast detail page.
 */
export const useAdminHistoryDetail = (): UseAdminHistoryDetailReturn => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const broadcastId = Number(id);
  const [activeBroadcastId, setActiveBroadcastId] = useState(broadcastId);
  const [isRetryConfirmOpen, setIsRetryConfirmOpen] = useState(false);

  useEffect(() => {
    setActiveBroadcastId(broadcastId);
  }, [broadcastId]);

  const f = useAdminHistoryDetailFetch(activeBroadcastId);
  useAdminHistoryDetailPolling(activeBroadcastId, f.status, f.setStatus);
  const r = useAdminHistoryDetailRetry(
    activeBroadcastId,
    f.setDetail,
    f.setStatus,
    (newBroadcastId) => {
      setActiveBroadcastId(newBroadcastId);
      void navigate(`/admin/notifications/history/${newBroadcastId}`);
    }
  );

  const failedRecipientsCount = useMemo(
    () => f.detail?.recipients.filter((item) => item.status === "FAILED").length ?? 0,
    [f.detail]
  );

  return {
    state: { detail: f.detail, status: f.status, isRetryConfirmOpen, failedRecipientsCount },
    loading: f.loading, error: f.error, retryError: r.retryError, broadcastId,
    actions: { setRetryConfirmOpen: setIsRetryConfirmOpen, handleRetry: r.handleRetry },
  };
};
