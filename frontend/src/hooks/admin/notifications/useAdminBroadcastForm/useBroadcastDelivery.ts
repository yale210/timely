import { useEffect, useState } from "react";
import { getBroadcastStatus } from "@/api/notifications";
import {
  type BroadcastDeliveryStatus,
  type BroadcastJobStatusResponse,
} from "@/types";

const POLL_INTERVAL_MS = 3000;

const isTerminalStatus = (status: BroadcastDeliveryStatus) =>
  status === "COMPLETED" || status === "PARTIAL" || status === "FAILED";

/**
 * Hook to manage broadcast delivery status polling.
 * @returns Delivery related state and setters.
 */
export const useBroadcastDelivery = () => {
  const [currentBroadcastId, setCurrentBroadcastId] = useState<number | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<BroadcastJobStatusResponse | null>(
    null
  );

  useEffect(() => {
    if (
      !currentBroadcastId ||
      !deliveryStatus ||
      isTerminalStatus(deliveryStatus.status)
    ) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void getBroadcastStatus(currentBroadcastId)
        .then((status) => {
          setDeliveryStatus(status);
        })
        .catch((err) => {
          console.error("Failed to poll broadcast status", err);
        });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [currentBroadcastId, deliveryStatus]);

  const statusLabel = deliveryStatus?.status ?? "IDLE";
  const statusTone =
    deliveryStatus?.status === "FAILED"
      ? "text-red-600"
      : deliveryStatus?.status === "PARTIAL"
      ? "text-amber-600"
      : deliveryStatus?.status === "COMPLETED"
      ? "text-emerald-600"
      : "text-indigo-600";

  return {
    currentBroadcastId,
    setCurrentBroadcastId,
    deliveryStatus,
    setDeliveryStatus,
    statusLabel,
    statusTone,
  };
};
