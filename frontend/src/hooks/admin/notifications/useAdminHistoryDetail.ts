import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
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
  const { id } = useParams<{ id: string }>();
  const broadcastId = Number(id);
  const [isRetryConfirmOpen, setIsRetryConfirmOpen] = useState(false);

  const f = useAdminHistoryDetailFetch(broadcastId);
  useAdminHistoryDetailPolling(broadcastId, f.status, f.setStatus);
  const r = useAdminHistoryDetailRetry(broadcastId, f.setDetail, f.setStatus);

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
