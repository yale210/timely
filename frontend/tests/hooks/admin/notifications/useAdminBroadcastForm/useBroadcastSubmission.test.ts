import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useBroadcastSubmission } from "@/hooks/admin/notifications/useAdminBroadcastForm/useBroadcastSubmission";
import * as api from "@/api/notifications";

vi.mock("@/api/notifications", () => ({
  sendAdminNotification: vi.fn(),
  getBroadcastStatus: vi.fn(),
}));

describe("useBroadcastSubmission hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles submission", async () => {
    (api.sendAdminNotification as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ broadcast_id: 1, status: "QUEUED" });
    (api.getBroadcastStatus as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ status: "IN_PROGRESS" });

    const deliveryHook = { setCurrentBroadcastId: vi.fn(), setDeliveryStatus: vi.fn() };
    const { result } = renderHook(() => useBroadcastSubmission(deliveryHook));

    await act(async () => {
      await result.current.handleConfirmSend({ trimmedTitle: "T", trimmedMessage: "M" }, "all", []);
    });

    expect(api.sendAdminNotification).toHaveBeenCalled();
    expect(deliveryHook.setCurrentBroadcastId).toHaveBeenCalledWith(1);
  });
});
