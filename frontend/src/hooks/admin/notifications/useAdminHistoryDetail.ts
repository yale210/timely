import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getBroadcastDetail,
  getBroadcastStatus,
  retryFailedBroadcast,
} from "@/api/notifications";
import { type BroadcastJobDetail, type BroadcastJobStatusResponse } from "@/types";

const POLL_INTERVAL_MS = 3000;

const isTerminal = (status: string) =>
  status === "COMPLETED" || status === "PARTIAL" || status === "FAILED";

interface AdminHistoryDetailState {
  detail: BroadcastJobDetail | null;
  status: BroadcastJobStatusResponse | null;
  isRetryConfirmOpen: boolean;
  failedRecipientsCount: number;
}

interface AdminHistoryDetailActions {
  setRetryConfirmOpen: (isOpen: boolean) => void;
  handleRetry: () => Promise<void>;
}

interface UseAdminHistoryDetailReturn {
  state: AdminHistoryDetailState;
  loading: boolean;
  error: string | null;
  retryError: string | null;
  broadcastId: number;
  actions: AdminHistoryDetailActions;
}

/**
 * Provides state and actions for the admin broadcast detail page.
 */
export const useAdminHistoryDetail = (): UseAdminHistoryDetailReturn => {
  const { id } = useParams<{ id: string }>();
  const broadcastId = Number(id);

  const [detail, setDetail] = useState<BroadcastJobDetail | null>(null);
  const [status, setStatus] = useState<BroadcastJobStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRetryConfirmOpen, setIsRetryConfirmOpen] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const failedRecipientsCount = useMemo(
    () => detail?.recipients.filter((item) => item.status === "FAILED").length ?? 0,
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

  const handleRetry = useCallback(async () => {
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
  }, [broadcastId]);

  return {
    state: {
      detail,
      status,
      isRetryConfirmOpen,
      failedRecipientsCount,
    },
    loading,
    error,
    retryError,
    broadcastId,
    actions: {
      setRetryConfirmOpen: setIsRetryConfirmOpen,
      handleRetry,
    },
  };
};

