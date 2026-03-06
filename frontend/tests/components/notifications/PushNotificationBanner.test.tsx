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
    (usePushSubscription as any).mockReturnValue({ isSupported: false });
    const { container } = render(<PushNotificationBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders blocked message when permission is denied", () => {
    (usePushSubscription as any).mockReturnValue({
      isSupported: true,
      permission: "denied",
    });
    render(<PushNotificationBanner />);
    expect(screen.getByText("Push notifications blocked")).toBeDefined();
  });

  it("renders enabled message and disable button when subscribed", () => {
    (usePushSubscription as any).mockReturnValue({
      isSupported: true,
      isSubscribed: true,
      permission: "granted",
      unsubscribe: mockUnsubscribe,
      loading: false,
    });
    render(<PushNotificationBanner />);
    expect(screen.getByText("Push notifications enabled")).toBeDefined();
    
    fireEvent.click(screen.getByRole("button", { name: /disable/i }));
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it("renders enable button and handles subscribe", () => {
    (usePushSubscription as any).mockReturnValue({
      isSupported: true,
      isSubscribed: false,
      permission: "default",
      subscribe: mockSubscribe,
      loading: false,
      error: null,
    });
    render(<PushNotificationBanner />);
    expect(screen.getByText("Enable push notifications")).toBeDefined();
    
    fireEvent.click(screen.getByRole("button", { name: /enable/i }));
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it("shows loading state on buttons", () => {
    (usePushSubscription as any).mockReturnValue({
      isSupported: true,
      isSubscribed: false,
      permission: "default",
      loading: true,
    });
    render(<PushNotificationBanner />);
    expect(screen.getByText("Enabling...")).toBeDefined();

    (usePushSubscription as any).mockReturnValue({
        isSupported: true,
        isSubscribed: true,
        permission: "granted",
        loading: true,
    });
    const { rerender } = render(<PushNotificationBanner />);
    rerender(<PushNotificationBanner />);
    expect(screen.getByText("...")).toBeDefined();
  });

  it("shows error message when present", () => {
    (usePushSubscription as any).mockReturnValue({
      isSupported: true,
      isSubscribed: false,
      permission: "default",
      error: "Something went wrong",
    });
    render(<PushNotificationBanner />);
    expect(screen.getByText("Something went wrong")).toBeDefined();
  });
});
