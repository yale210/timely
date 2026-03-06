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
    (getVapidPublicKey as any).mockResolvedValue({ public_key: "mock-vapid-key" });
    (subscribeToPush as any).mockResolvedValue({ ok: true });
    (unsubscribeFromPush as any).mockResolvedValue({ ok: true });

    // Mock service worker
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve(mockRegistration)
      }
    });

    // Mock PushManager on window
    (global as any).PushManager = vi.fn();
    
    // Mock atob
    (global as any).atob = vi.fn((s) => Buffer.from(s, 'base64').toString('binary'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isPushSupported", () => {
    it("returns true when serviceWorker and PushManager are available", () => {
      expect(isPushSupported()).toBe(true);
    });

    it("returns false when serviceWorker is missing", () => {
      // @ts-ignore
      delete navigator.serviceWorker;
      expect(isPushSupported()).toBe(false);
    });

    it("returns false when PushManager is missing", () => {
        delete (global as any).PushManager;
        expect(isPushSupported()).toBe(false);
    });
  });

  describe("subscribeUserToPush", () => {
    it("throws error if push is not supported", async () => {
        delete (global as any).PushManager;
        await expect(subscribeUserToPush()).rejects.toThrow("Push notifications are not supported in this browser.");
    });

    it("throws error if VAPID key is missing", async () => {
      (getVapidPublicKey as any).mockResolvedValue({ public_key: null });
      await expect(subscribeUserToPush()).rejects.toThrow("Server did not return a VAPID public key.");
    });

    it("throws error if browser returns an incomplete push subscription", async () => {
      mockRegistration.pushManager.subscribe.mockResolvedValue(mockSubscription);
      mockSubscription.toJSON.mockReturnValue({ endpoint: "url" }); // missing keys
      
      await expect(subscribeUserToPush()).rejects.toThrow("Browser returned an incomplete push subscription.");
    });

    it("subscribes the user and notifies the backend", async () => {
      const vapidKey = "BNc_yX7X3X-m-z-k_X7X3X-m-z-k_X7X3X-m-z-k_X7X3X-m-z-k_X7X3X-m-z-k_X7X3X-m-z-k_X7X3X-m-z-k=";
      (getVapidPublicKey as any).mockResolvedValue({ public_key: vapidKey });
      mockRegistration.pushManager.subscribe.mockResolvedValue(mockSubscription);
      mockSubscription.toJSON.mockReturnValue({
        endpoint: "https://push.example.com/123",
        keys: { p256dh: "p256", auth: "auth" }
      });
      
      await subscribeUserToPush();

      expect(mockRegistration.pushManager.subscribe).toHaveBeenCalled();
      expect(subscribeToPush).toHaveBeenCalledWith({
        endpoint: "https://push.example.com/123",
        p256dh: "p256",
        auth: "auth"
      });
    });
  });

  describe("unsubscribeUserFromPush", () => {
    it("returns immediately if push is not supported", async () => {
        delete (global as any).PushManager;
        await unsubscribeUserFromPush();
        expect(mockRegistration.pushManager.getSubscription).not.toHaveBeenCalled();
    });

    it("does nothing if there is no active subscription", async () => {
      mockRegistration.pushManager.getSubscription.mockResolvedValue(null);
      await unsubscribeUserFromPush();
      expect(unsubscribeFromPush).not.toHaveBeenCalled();
    });

    it("unsubscribes through PushManager and notifies backend", async () => {
      mockRegistration.pushManager.getSubscription.mockResolvedValue(mockSubscription);
      mockSubscription.unsubscribe.mockResolvedValue(true);
      
      await unsubscribeUserFromPush();

      expect(mockSubscription.unsubscribe).toHaveBeenCalled();
      expect(unsubscribeFromPush).toHaveBeenCalledWith("https://push.example.com/123");
    });
  });
});
