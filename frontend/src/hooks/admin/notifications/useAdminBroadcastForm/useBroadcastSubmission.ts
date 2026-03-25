import { useCallback, useState } from "react";
import { sendAdminNotification, getBroadcastStatus } from "@/api/notifications";
import {
  type AdminNotificationPayload,
  type AdminNotificationTarget,
  type BroadcastJobStatusResponse,
  type ApiErrorResponse,
} from "@/types";

interface BroadcastDeliveryHook {
  setCurrentBroadcastId: (id: number) => void;
  setDeliveryStatus: (status: BroadcastJobStatusResponse) => void;
}

const parseApiError = (error: unknown): string => {
  const maybeError = error as { response?: { data?: ApiErrorResponse } };
  return (
    maybeError.response?.data?.error?.message ?? "Failed to send admin notification."
  );
};

const createNotificationPayload = (
  validation: { trimmedTitle: string; trimmedMessage: string },
  target: AdminNotificationTarget,
  selectedIds: number[],
): AdminNotificationPayload => ({
  title: validation.trimmedTitle,
  message: validation.trimmedMessage,
  target,
  user_ids: target === "users" ? selectedIds : undefined,
});

const createQueuedStatus = (
  response: Awaited<ReturnType<typeof sendAdminNotification>>,
): BroadcastJobStatusResponse => ({
  id: response.broadcast_id,
  status: response.status,
  recipient_count: response.recipient_count,
  delivered_count: 0,
  failed_count: 0,
  queued_at: response.queued_at,
  started_at: null,
  completed_at: null,
  task_id: response.task_id,
  updated_at: response.queued_at,
});

const useConfirmSendHandler = (
  deliveryHook: BroadcastDeliveryHook,
  setError: (value: string | null) => void,
  setIsSubmitting: (value: boolean) => void,
) => useCallback(async (
  validation: { trimmedTitle: string; trimmedMessage: string },
  target: AdminNotificationTarget,
  selectedIds: number[],
) => {
  try {
    setIsSubmitting(true);
    setError(null);
    const response = await sendAdminNotification(createNotificationPayload(validation, target, selectedIds));
    deliveryHook.setCurrentBroadcastId(response.broadcast_id);
    deliveryHook.setDeliveryStatus(createQueuedStatus(response));
    deliveryHook.setDeliveryStatus(await getBroadcastStatus(response.broadcast_id));
  } catch (error) {
    console.error("Failed to send admin notification", error);
    setError(parseApiError(error));
  } finally {
    setIsSubmitting(false);
  }
}, [deliveryHook, setError, setIsSubmitting]);

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
  const handleConfirmSend = useConfirmSendHandler(deliveryHook, setError, setIsSubmitting);

  return { isSubmitting, error, setError, handleConfirmSend };
};
