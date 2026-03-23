import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { type BroadcastJobDetail, type BroadcastJobStatusResponse } from "@/types";
import { useAdminHistoryDetailFetch } from "./useAdminHistoryDetail/useAdminHistoryDetailFetch";
import { useAdminHistoryDetailPolling } from "./useAdminHistoryDetail/useAdminHistoryDetailPolling";
import { useAdminHistoryDetailRetry } from "./useAdminHistoryDetail/useAdminHistoryDetailRetry";

interface UseAdminHistoryDetailReturn {
  state: { detail: BroadcastJobDetail | null; status: BroadcastJobStatusResponse | null; isRetryConfirmOpen: boolean; failedRecipientsCount: number; };
  loading: boolean; error: string | null; retryError: string | null; broadcastId: number;
  actions: { setRetryConfirmOpen: (isOpen: boolean) => void; handleRetry: () => Promise<void>; };
}

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
