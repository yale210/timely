import { renderHook, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { usePushSubscription } from "@/hooks/notifications/usePushSubscription";
import * as pushUtils from "@/utils/pushNotifications";

// Mock utilities
vi.mock("@/utils/pushNotifications", () => ({
  isPushSupported: vi.fn(),
  subscribeUserToPush: vi.fn(),
  unsubscribeUserFromPush: vi.fn(),
}));

describe("usePushSubscription Hook", () => {
  const mockRegistration = {
    pushManager: {
      getSubscription: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (pushUtils.isPushSupported as any).mockReturnValue(true);
    (global as any).navigator.serviceWorker = {
        ready: Promise.resolve(mockRegistration)
    };
    (global as any).Notification = {
        permission: "default"
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with correct state when supported", async () => {
    mockRegistration.pushManager.getSubscription.mockResolvedValue(null);
    const { result } = renderHook(() => usePushSubscription());

    expect(result.current.isSupported).toBe(true);
    expect(result.current.permission).toBe("default");

    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(false);
    });
  });

  it("handles unsupported browser", async () => {
    (pushUtils.isPushSupported as any).mockReturnValue(false);
    const { result } = renderHook(() => usePushSubscription());

    expect(result.current.isSupported).toBe(false);
    expect(result.current.permission).toBe("unsupported");
    expect(result.current.isSubscribed).toBe(false);
  });

  it("detects existing subscription", async () => {
    mockRegistration.pushManager.getSubscription.mockResolvedValue({});
    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
      expect(result.current.isSubscribed).toBe(true);
    });
  });

  it("handles subscribe success", async () => {
    mockRegistration.pushManager.getSubscription.mockResolvedValueOnce(null).mockResolvedValueOnce({});
    (pushUtils.subscribeUserToPush as any).mockResolvedValue(undefined);
    
    const { result } = renderHook(() => usePushSubscription());
    await waitFor(() => expect(result.current.isSubscribed).toBe(false));

    await act(async () => {
      await result.current.subscribe();
    });

    expect(pushUtils.subscribeUserToPush).toHaveBeenCalled();
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("handles subscribe failure", async () => {
    (pushUtils.subscribeUserToPush as any).mockRejectedValue(new Error("Permission denied"));
    const { result } = renderHook(() => usePushSubscription());

    await act(async () => {
      await result.current.subscribe();
    });

    expect(result.current.error).toBe("Permission denied");
    expect(result.current.loading).toBe(false);
  });

  it("handles unsubscribe success", async () => {
    mockRegistration.pushManager.getSubscription.mockResolvedValue({});
    const { result } = renderHook(() => usePushSubscription());
    await waitFor(() => expect(result.current.isSubscribed).toBe(true));

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(pushUtils.unsubscribeUserFromPush).toHaveBeenCalled();
    expect(result.current.isSubscribed).toBe(false);
  });

  it("handles unsubscribe failure", async () => {
    mockRegistration.pushManager.getSubscription.mockResolvedValue({});
    (pushUtils.unsubscribeUserFromPush as any).mockRejectedValue(new Error("Network Error"));
    const { result } = renderHook(() => usePushSubscription());
    await waitFor(() => expect(result.current.isSubscribed).toBe(true));

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(result.current.error).toBe("Network Error");
  });

  it("subscribe does nothing if unsupported", async () => {
    (pushUtils.isPushSupported as any).mockReturnValue(false);
    const { result } = renderHook(() => usePushSubscription());

    await act(async () => {
      await result.current.subscribe();
    });

    expect(pushUtils.subscribeUserToPush).not.toHaveBeenCalled();
  });

  it("unsubscribe does nothing if unsupported", async () => {
    (pushUtils.isPushSupported as any).mockReturnValue(false);
    const { result } = renderHook(() => usePushSubscription());

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(pushUtils.unsubscribeUserFromPush).not.toHaveBeenCalled();
  });

  it("handles error in checkSubscription", async () => {
    mockRegistration.pushManager.getSubscription.mockRejectedValue(new Error("Internal"));
    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
        expect(result.current.isSubscribed).toBe(false);
    });
  });
});
