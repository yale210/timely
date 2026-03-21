import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useBroadcastDelivery } from "@/hooks/admin/notifications/useAdminBroadcastForm/useBroadcastDelivery";
import * as api from "@/api/notifications";
import { type BroadcastJobStatusResponse } from "@/types";

vi.mock("@/api/notifications", () => ({
  getBroadcastStatus: vi.fn(),
}));

describe("useBroadcastDelivery hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("polls for status", () => {
    (api.getBroadcastStatus as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ status: "IN_PROGRESS" });

    const { result } = renderHook(() => useBroadcastDelivery());

    act(() => {
      result.current.setCurrentBroadcastId(1);
      result.current.setDeliveryStatus({ status: "QUEUED" } as BroadcastJobStatusResponse);
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(api.getBroadcastStatus).toHaveBeenCalledWith(1);
  });
});
