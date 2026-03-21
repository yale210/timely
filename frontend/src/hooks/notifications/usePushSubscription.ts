import { useState, useEffect, useCallback } from "react";
import { isPushSupported, subscribeUserToPush, unsubscribeUserFromPush } from "@/utils/pushNotifications";

type PushPermission = NotificationPermission | "unsupported";
interface UseReturn { isSupported: boolean; isSubscribed: boolean; permission: PushPermission; loading: boolean; error: string | null; subscribe: () => Promise<void>; unsubscribe: () => Promise<void>; refresh: () => Promise<void>; }

const getP = (): PushPermission => isPushSupported() ? Notification.permission : "unsupported";
const checkS = async (): Promise<boolean> => {
  if (!isPushSupported()) return false;
  try { const r = await navigator.serviceWorker.ready; const s = await r.pushManager.getSubscription(); return s !== null; } catch { return false; }
};

/**
 * Hook to manage push subscription.
 */
export const usePushSubscription = (): UseReturn => {
  const [sub, setSub] = useState(false);
  const [perm, setPerm] = useState<PushPermission>(getP);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isSupp = isPushSupported();

  const refresh = useCallback(async () => { setPerm(getP()); setSub(await checkS()); }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const subscribe = useCallback(async () => {
    if (!isSupp) return;
    setLoading(true); setErr(null);
    try {
      const p = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
      setPerm(p); if (p !== "granted") { setSub(false); return; }
      await subscribeUserToPush(); setSub(await checkS());
    } catch (e) { setPerm(getP()); setErr(e instanceof Error ? e.message : "Failed to enable push notifications.");
    } finally { setLoading(false); }
  }, [isSupp]);

  const unsubscribe = useCallback(async () => {
    if (!isSupp) return;
    setLoading(true); setErr(null);
    try { await unsubscribeUserFromPush(); setSub(false);
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed to disable push notifications.");
    } finally { setLoading(false); }
  }, [isSupp]);

  return { isSupported: isSupp, isSubscribed: sub, permission: perm, loading, error: err, subscribe, unsubscribe, refresh };
};
