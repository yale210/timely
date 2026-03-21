import { useState, useEffect, useCallback } from "react";
import { isPushSupported, subscribeUserToPush, unsubscribeUserFromPush } from "@/utils/pushNotifications";

type PushPermission = NotificationPermission | "unsupported";
interface UsePushSubscriptionReturn { isSupported: boolean; isSubscribed: boolean; permission: PushPermission; loading: boolean; error: string | null; subscribe: () => Promise<void>; unsubscribe: () => Promise<void>; refresh: () => Promise<void>; }

const getPermission = (): PushPermission => isPushSupported() ? Notification.permission : "unsupported";
const checkSubscription = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;
  try { const registration = await navigator.serviceWorker.ready; const subscription = await registration.pushManager.getSubscription(); return subscription !== null; } catch { return false; }
};

/**
 * Hook to manage push subscription.
 */
export const usePushSubscription = (): UsePushSubscriptionReturn => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<PushPermission>(getPermission);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSupported = isPushSupported();

  const refresh = useCallback(async () => { setPermission(getPermission()); setIsSubscribed(await checkSubscription()); }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const subscribe = useCallback(async () => {
    if (!isSupported) return;
    setLoading(true); setError(null);
    try {
      const perm = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
      setPermission(perm); if (perm !== "granted") { setIsSubscribed(false); return; }
      await subscribeUserToPush(); setIsSubscribed(await checkSubscription());
    } catch (e) { setPermission(getPermission()); setError(e instanceof Error ? e.message : "Failed to enable push notifications.");
    } finally { setLoading(false); }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;
    setLoading(true); setError(null);
    try { await unsubscribeUserFromPush(); setIsSubscribed(false);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to disable push notifications.");
    } finally { setLoading(false); }
  }, [isSupported]);

  return { isSupported, isSubscribed, permission, loading, error, subscribe, unsubscribe, refresh };
};
