import type React from "react";
import { usePushSubscription } from "@/hooks/notifications/usePushSubscription";

/**
 * Renders the banner when push notifications are blocked.
 */
const PushBlockedBanner: React.FC = () => (
  <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
    <div className="flex items-start gap-3">
      <span className="material-icons mt-0.5 text-yellow-600">notifications_off</span>
      <div>
        <p className="text-sm font-medium text-yellow-800">Push notifications blocked</p>
        <p className="mt-1 text-sm text-yellow-700">
          You&apos;ve blocked notifications for this site. To re-enable, click the lock icon in
          your browser&apos;s address bar and allow notifications.
        </p>
      </div>
    </div>
  </div>
);

/**
 * Renders the banner when push notifications are enabled.
 * @param root0 - Props.
 * @param root0.loading - Loading state.
 * @param root0.onUnsubscribe - Unsubscribe handler.
 */
const PushEnabledBanner: React.FC<{ loading: boolean; onUnsubscribe: () => void }> = ({ loading, onUnsubscribe }) => (
  <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-3">
        <span className="material-icons mt-0.5 text-green-600">notifications_active</span>
        <div>
          <p className="text-sm font-medium text-green-800">Push notifications enabled</p>
          <p className="mt-1 text-sm text-green-700">You&apos;ll receive browser notifications for reminders and admin messages.</p>
        </div>
      </div>
      <button onClick={onUnsubscribe} disabled={loading} className="ml-4 shrink-0 text-sm font-medium text-green-700 hover:text-green-900 disabled:opacity-50">
        {loading ? "..." : "Disable"}
      </button>
    </div>
  </div>
);

/**
 * Renders the banner when push notifications can be enabled.
 * @param root0 - Props.
 * @param root0.loading - Loading state.
 * @param root0.error - Error message.
 * @param root0.onSubscribe - Subscribe handler.
 */
const PushDisabledBanner: React.FC<{ loading: boolean; error: string | null; onSubscribe: () => void }> = ({ loading, error, onSubscribe }) => (
  <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-3">
        <span className="material-icons mt-0.5 text-indigo-600">notifications</span>
        <div>
          <p className="text-sm font-medium text-indigo-800">Enable push notifications</p>
          <p className="mt-1 text-sm text-indigo-700">Get browser notifications for event reminders and important updates.</p>
        </div>
      </div>
      <button onClick={onSubscribe} disabled={loading} className="ml-4 shrink-0 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
        {loading ? "Enabling..." : "Enable"}
      </button>
    </div>
    {error && (
      <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3"><p className="text-sm text-red-700">{error}</p></div>
    )}
  </div>
);

/**
 * Displays push notification subscription status and controls.
 */
export const PushNotificationBanner = () => {
  const { isSupported, isSubscribed, permission, loading, error, subscribe, unsubscribe } = usePushSubscription();

  if (!isSupported) return null;
  if (permission === "denied") return <PushBlockedBanner />;
  if (isSubscribed) return <PushEnabledBanner loading={loading} onUnsubscribe={() => void unsubscribe()} />;

  return <PushDisabledBanner loading={loading} error={error} onSubscribe={() => void subscribe()} />;
};
