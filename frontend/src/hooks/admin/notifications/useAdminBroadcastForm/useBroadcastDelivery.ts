import { useEffect, useState } from "react";
import { getBroadcastStatus } from "@/api/notifications";
import {
  type BroadcastDeliveryStatus,
  type BroadcastJobStatusResponse,
} from "@/types";

const POLL_INTERVAL_MS = 3000;

const isTerminalStatus = (status: BroadcastDeliveryStatus) =>
  status === "COMPLETED" || status === "PARTIAL" || status === "FAILED";

const getStatusTone = (status: BroadcastDeliveryStatus | undefined) =>
  status === "FAILED" ? "text-red-600" : status === "PARTIAL" ? "text-amber-600" : status === "COMPLETED" ? "text-emerald-600" : "text-indigo-600";

const useBroadcastStatusPolling = (
  currentBroadcastId: number | null,
  pollStatus: BroadcastDeliveryStatus | undefined,
  setDeliveryStatus: (status: BroadcastJobStatusResponse) => void,
) => {
  useEffect(() => {
    if (!currentBroadcastId || !pollStatus || isTerminalStatus(pollStatus)) return;

    const intervalId = window.setInterval(() => {
      void getBroadcastStatus(currentBroadcastId).then(setDeliveryStatus).catch((error) => {
        console.error("Failed to poll broadcast status", error);
      });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [currentBroadcastId, pollStatus, setDeliveryStatus]);
};

/**
 * Hook to manage broadcast delivery status polling.
 * @returns Delivery related state and setters.
 */
export const useBroadcastDelivery = () => {
  const [currentBroadcastId, setCurrentBroadcastId] = useState<number | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<BroadcastJobStatusResponse | null>(null);

  const pollStatus = deliveryStatus?.status;
  useBroadcastStatusPolling(currentBroadcastId, pollStatus, setDeliveryStatus);

  const statusLabel = deliveryStatus?.status ?? "IDLE";
  const statusTone = getStatusTone(deliveryStatus?.status);

  return { currentBroadcastId, setCurrentBroadcastId, deliveryStatus, setDeliveryStatus, statusLabel, statusTone };
};
