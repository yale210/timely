import { useState, useEffect, useCallback } from "react";
import {
  isPushSupported,
  subscribeUserToPush,
  unsubscribeUserFromPush,
} from "@/utils/pushNotifications";

type PushPermission = NotificationPermission | "unsupported";

interface UsePushSubscriptionReturn {
  /** Whether the browser supports push notifications */
  isSupported: boolean;
  /** Whether the user currently has an active push subscription */
  isSubscribed: boolean;
  /** Current Notification permission: "default" | "granted" | "denied" | "unsupported" */
  permission: PushPermission;
  /** Whether a subscribe/unsubscribe operation is in progress */
  loading: boolean;
  /** Error message from the last subscribe/unsubscribe attempt, or null */
  error: string | null;
  /** Subscribe to push notifications (triggers browser permission prompt if needed) */
  subscribe: () => Promise<void>;
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<void>;
  /** Re-check the current subscription state */
  refresh: () => Promise<void>;
}

const getPermission = (): PushPermission => {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
};

const checkSubscription = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
};

/**
 * A custom hook to manage browser push notification subscriptions.
 *
 * This hook provides state and functions for managing subscriptions,
 * checking browser support, handling user permissions, and subscribing
 * or unsubscribing from push notifications using the VAPID key.
 * @returns An object containing the subscription state and management functions.
 */
export const usePushSubscription = (): UsePushSubscriptionReturn => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<PushPermission>(getPermission);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSupported = isPushSupported();

  const refresh = useCallback(async () => {
    setPermission(getPermission());
    const subscribed = await checkSubscription();
    setIsSubscribed(subscribed);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const subscribe = useCallback(async () => {
    if (!isSupported) return;
    setLoading(true);
    setError(null);
    try {
      await subscribeUserToPush();
      setPermission(getPermission());
      const subscribed = await checkSubscription();
      setIsSubscribed(subscribed);
    } catch (err) {
      setPermission(getPermission());
      const message =
        err instanceof Error ? err.message : "Failed to enable push notifications.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;
    setLoading(true);
    setError(null);
    try {
      await unsubscribeUserFromPush();
      setIsSubscribed(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to disable push notifications.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isSupported]);

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    error,
    subscribe,
    unsubscribe,
    refresh,
  };
};
