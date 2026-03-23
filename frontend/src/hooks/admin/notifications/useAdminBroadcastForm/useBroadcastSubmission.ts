import { useCallback, useState } from "react";
import { sendAdminNotification, getBroadcastStatus } from "@/api/notifications";
import {
  type AdminNotificationPayload,
  type AdminNotificationTarget,
  type BroadcastJobStatusResponse,
  type ApiErrorResponse,
} from "@/types";

const parseApiError = (error: unknown): string => {
  const maybeError = error as { response?: { data?: ApiErrorResponse } };
  return (
    maybeError.response?.data?.error?.message ?? "Failed to send admin notification."
  );
};

/**
 * Hook to manage the submission process of a broadcast.
 * @param deliveryHook - The delivery hook containing status setters.
 * @param deliveryHook.setCurrentBroadcastId - Setter for current broadcast ID.
 * @param deliveryHook.setDeliveryStatus - Setter for delivery status.
 * @returns Submission state and actions.
 */
export const useBroadcastSubmission = (deliveryHook: {
  setCurrentBroadcastId: (id: number) => void;
  setDeliveryStatus: (status: BroadcastJobStatusResponse) => void;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmSend = useCallback(
    async (
      validation: { trimmedTitle: string; trimmedMessage: string },
      target: AdminNotificationTarget,
      selectedIds: number[]
    ) => {
      const payload: AdminNotificationPayload = {
        title: validation.trimmedTitle,
        message: validation.trimmedMessage,
        target,
        user_ids: target === "users" ? selectedIds : undefined,
      };

      try {
        setIsSubmitting(true);
        setError(null);
        const res = await sendAdminNotification(payload);
        deliveryHook.setCurrentBroadcastId(res.broadcast_id);
        const queued: BroadcastJobStatusResponse = {
          id: res.broadcast_id,
          status: res.status,
          recipient_count: res.recipient_count,
          delivered_count: 0,
          failed_count: 0,
          queued_at: res.queued_at,
          started_at: null,
          completed_at: null,
          task_id: res.task_id,
          updated_at: res.queued_at,
        };
        deliveryHook.setDeliveryStatus(queued);
        const status = await getBroadcastStatus(res.broadcast_id);
        deliveryHook.setDeliveryStatus(status);
      } catch (err) {
        console.error("Failed to send admin notification", err);
        setError(parseApiError(err));
      } finally {
        setIsSubmitting(false);
      }
    },
    [deliveryHook]
  );

  return { isSubmitting, error, setError, handleConfirmSend };
};
