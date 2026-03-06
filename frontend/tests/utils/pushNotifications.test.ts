import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { isPushSupported, subscribeUserToPush, unsubscribeUserFromPush } from "@/utils/pushNotifications";
import { getVapidPublicKey, subscribeToPush, unsubscribeFromPush } from "@/api/notifications";

// Mock API calls
vi.mock("@/api/notifications", () => ({
  getVapidPublicKey: vi.fn(),
  subscribeToPush: vi.fn(),
  unsubscribeFromPush: vi.fn(),
}));

describe("pushNotifications Utilities", () => {
  const mockedGetVapidPublicKey = vi.mocked(getVapidPublicKey);
  const mockedSubscribeToPush = vi.mocked(subscribeToPush);
  const mockedUnsubscribeFromPush = vi.mocked(unsubscribeFromPush);

  const mockRegistration = {
    pushManager: {
      subscribe: vi.fn(),
      getSubscription: vi.fn(),
    },
  };

  const mockSubscription = {
    toJSON: vi.fn(),
    unsubscribe: vi.fn(),
    endpoint: "https://push.example.com/123",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default API mocks
    mockedGetVapidPublicKey.mockResolvedValue({ public_key: "mock-vapid-key" });
    mockedSubscribeToPush.mockResolvedValue({ ok: true });
    mockedUnsubscribeFromPush.mockResolvedValue({ ok: true });

    // Mock service worker
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve(mockRegistration)
      }
    });

    // Mock PushManager on window
    (globalThis as unknown as Record<string, unknown>).PushManager = vi.fn();
    
    // Mock atob
    (globalThis as unknown as Record<string, unknown>).atob = vi.fn((s: string) => Buffer.from(s, 'base64').toString('binary'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isPushSupported", () => {
    it("returns true when serviceWorker and PushManager are available", () => {
      expect(isPushSupported()).toBe(true);
    });

    it("returns false when serviceWorker is missing", () => {
      // @ts-expect-error - navigator.serviceWorker is read-only in types but we are deleting it for test
      delete navigator.serviceWorker;
      expect(isPushSupported()).toBe(false);
    });

    it("returns false when PushManager is missing", () => {
        delete (globalThis as unknown as Record<string, unknown>).PushManager;
        expect(isPushSupported()).toBe(false);
    });
  });

  describe("subscribeUserToPush", () => {
    it("throws error if push is not supported", async () => {
        delete (globalThis as unknown as Record<string, unknown>).PushManager;
        await expect(subscribeUserToPush()).rejects.toThrow("Push notifications are not supported in this browser.");
    });

    it("throws error if VAPID key is missing", async () => {
      mockedGetVapidPublicKey.mockResolvedValue({ public_key: null });
      await expect(subscribeUserToPush()).rejects.toThrow("Server did not return a VAPID public key.");
    });

    it("throws error if browser returns an incomplete push subscription", async () => {
      mockRegistration.pushManager.subscribe.mockResolvedValue(mockSubscription);
      mockSubscription.toJSON.mockReturnValue({ endpoint: "url" }); // missing keys
      
      await expect(subscribeUserToPush()).rejects.toThrow("Browser returned an incomplete push subscription.");
    });

    it("subscribes the user and notifies the backend", async () => {
      const vapidKey = "BNc_yX7X3X-m-z-k_X7X3X-m-z-k_X7X3X-m-z-k_X7X3X-m-z-k_X7X3X-m-z-k_X7X3X-m-z-k_X7X3X-m-z-k=";
      mockedGetVapidPublicKey.mockResolvedValue({ public_key: vapidKey });
      mockRegistration.pushManager.subscribe.mockResolvedValue(mockSubscription);
      mockSubscription.toJSON.mockReturnValue({
        endpoint: "https://push.example.com/123",
        keys: { p256dh: "p256", auth: "auth" }
      });
      
      await subscribeUserToPush();

      expect(mockRegistration.pushManager.subscribe).toHaveBeenCalled();
      expect(mockedSubscribeToPush).toHaveBeenCalledWith({
        endpoint: "https://push.example.com/123",
        p256dh: "p256",
        auth: "auth"
      });
    });
  });

  describe("unsubscribeUserFromPush", () => {
    it("returns immediately if push is not supported", async () => {
        delete (globalThis as unknown as Record<string, unknown>).PushManager;
        await unsubscribeUserFromPush();
        expect(mockRegistration.pushManager.getSubscription).not.toHaveBeenCalled();
    });

    it("does nothing if there is no active subscription", async () => {
      mockRegistration.pushManager.getSubscription.mockResolvedValue(null);
      await unsubscribeUserFromPush();
      expect(mockedUnsubscribeFromPush).not.toHaveBeenCalled();
    });

    it("unsubscribes through PushManager and notifies backend", async () => {
      mockRegistration.pushManager.getSubscription.mockResolvedValue(mockSubscription);
      mockSubscription.unsubscribe.mockResolvedValue(true);
      
      await unsubscribeUserFromPush();

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
      expect(mockedUnsubscribeFromPush).toHaveBeenCalledWith("https://push.example.com/123");
    });
  });
});
