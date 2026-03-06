import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { PushNotificationBanner } from "@/components/notifications/PushNotificationBanner";
import { usePushSubscription } from "@/hooks/notifications/usePushSubscription";

// Mock Hook
vi.mock("@/hooks/notifications/usePushSubscription", () => ({
  usePushSubscription: vi.fn(),
}));

describe("PushNotificationBanner Component", () => {
  const mockSubscribe = vi.fn();
  const mockUnsubscribe = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders null when not supported", () => {
    vi.mocked(usePushSubscription).mockReturnValue({
      isSupported: false,
      isSubscribed: false,
      permission: "default",
      loading: false,
      error: null,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    });
    const { container } = render(<PushNotificationBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders blocked message when permission is denied", () => {
    vi.mocked(usePushSubscription).mockReturnValue({
      isSupported: true,
      permission: "denied",
      isSubscribed: false,
      loading: false,
      error: null,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    });
    render(<PushNotificationBanner />);
    expect(screen.getByText("Push notifications blocked")).toBeDefined();
  });

  it("renders enabled message and disable button when subscribed", () => {
    vi.mocked(usePushSubscription).mockReturnValue({
      isSupported: true,
      isSubscribed: true,
      permission: "granted",
      unsubscribe: mockUnsubscribe,
      subscribe: vi.fn(),
      loading: false,
      error: null,
    });
    render(<PushNotificationBanner />);
    expect(screen.getByText("Push notifications enabled")).toBeDefined();
    
    fireEvent.click(screen.getByRole("button", { name: /disable/i }));
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("renders enable button and handles subscribe", () => {
    vi.mocked(usePushSubscription).mockReturnValue({
      isSupported: true,
      isSubscribed: false,
      permission: "default",
      subscribe: mockSubscribe,
      unsubscribe: vi.fn(),
      loading: false,
      error: null,
    });
    render(<PushNotificationBanner />);
    expect(screen.getByText("Enable push notifications")).toBeDefined();
    
    fireEvent.click(screen.getByRole("button", { name: /enable/i }));
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it("shows loading state on buttons", () => {
    vi.mocked(usePushSubscription).mockReturnValue({
      isSupported: true,
      isSubscribed: false,
      permission: "default",
      loading: true,
      error: null,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    });
    render(<PushNotificationBanner />);
    expect(screen.getByText("Enabling...")).toBeDefined();

    vi.mocked(usePushSubscription).mockReturnValue({
        isSupported: true,
        isSubscribed: true,
        permission: "granted",
        loading: true,
        error: null,
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
    });
    const { rerender } = render(<PushNotificationBanner />);
    rerender(<PushNotificationBanner />);
    expect(screen.getByText("...")).toBeDefined();
  });

  it("shows error message when present", () => {
    vi.mocked(usePushSubscription).mockReturnValue({
      isSupported: true,
      isSubscribed: false,
      permission: "default",
      error: "Something went wrong",
      loading: false,
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    });
    render(<PushNotificationBanner />);
    expect(screen.getByText("Something went wrong")).toBeDefined();
  });
});
