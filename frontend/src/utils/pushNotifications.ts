import { getVapidPublicKey, subscribeToPush, unsubscribeFromPush } from '../api/notifications';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const isPushSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

export const subscribeUserToPush = async () => {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported in this browser.");
  }

  const registration = await navigator.serviceWorker.ready;

  const { public_key } = await getVapidPublicKey();
  if (!public_key) {
    throw new Error("Server did not return a VAPID public key. Push notifications are not configured.");
  }

  const subscribeOptions = {
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(public_key),
  };

  const subscription = await registration.pushManager.subscribe(subscribeOptions);

  const subJSON = subscription.toJSON();
  if (!subJSON.endpoint || !subJSON.keys?.p256dh || !subJSON.keys?.auth) {
    throw new Error("Browser returned an incomplete push subscription.");
  }

  await subscribeToPush({
    endpoint: subJSON.endpoint,
    p256dh: subJSON.keys.p256dh,
    auth: subJSON.keys.auth,
  });
};

export const unsubscribeUserFromPush = async () => {
  if (!isPushSupported()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await unsubscribeFromPush(endpoint);
  }
};
