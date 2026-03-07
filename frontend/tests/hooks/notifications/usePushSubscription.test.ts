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

const mockedIsPushSupported = vi.mocked(pushUtils.isPushSupported);
const mockedSubscribeUserToPush = vi.mocked(pushUtils.subscribeUserToPush);
const mockedUnsubscribeUserFromPush = vi.mocked(pushUtils.unsubscribeUserFromPush);

describe("usePushSubscription Hook", () => {
  const mockRegistration = {
    pushManager: {
      getSubscription: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedIsPushSupported.mockReturnValue(true);
    
    // Use Object.defineProperty to avoid 'any' and unsafe member access on global objects
    Object.defineProperty(globalThis.navigator, "serviceWorker", {
      value: {
        ready: Promise.resolve(mockRegistration),
      },
      configurable: true,
      writable: true,
    });

    Object.defineProperty(globalThis, "Notification", {
      value: {
        permission: "default",
      },
      configurable: true,
      writable: true,
    });
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

  it("handles unsupported browser", () => {
    mockedIsPushSupported.mockReturnValue(false);
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
    mockedSubscribeUserToPush.mockResolvedValue(undefined);
    
    const { result } = renderHook(() => usePushSubscription());
    await waitFor(() => expect(result.current.isSubscribed).toBe(false));

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockedSubscribeUserToPush).toHaveBeenCalled();
    expect(result.current.isSubscribed).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("handles subscribe failure", async () => {
    mockedSubscribeUserToPush.mockRejectedValue(new Error("Permission denied"));
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

    expect(mockedUnsubscribeUserFromPush).toHaveBeenCalled();
    expect(result.current.isSubscribed).toBe(false);
  });

  it("handles unsubscribe failure", async () => {
    mockRegistration.pushManager.getSubscription.mockResolvedValue({});
    mockedUnsubscribeUserFromPush.mockRejectedValue(new Error("Network Error"));
    const { result } = renderHook(() => usePushSubscription());
    await waitFor(() => expect(result.current.isSubscribed).toBe(true));

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(result.current.error).toBe("Network Error");
  });

  it("subscribe does nothing if unsupported", async () => {
    mockedIsPushSupported.mockReturnValue(false);
    const { result } = renderHook(() => usePushSubscription());

    await act(async () => {
      await result.current.subscribe();
    });

    expect(mockedSubscribeUserToPush).not.toHaveBeenCalled();
  });

  it("unsubscribe does nothing if unsupported", async () => {
    mockedIsPushSupported.mockReturnValue(false);
    const { result } = renderHook(() => usePushSubscription());

    await act(async () => {
      await result.current.unsubscribe();
    });

    expect(mockedUnsubscribeUserFromPush).not.toHaveBeenCalled();
  });

  it("handles error in checkSubscription", async () => {
    mockRegistration.pushManager.getSubscription.mockRejectedValue(new Error("Internal"));
    const { result } = renderHook(() => usePushSubscription());

    await waitFor(() => {
        expect(result.current.isSubscribed).toBe(false);
    });
  });
});
