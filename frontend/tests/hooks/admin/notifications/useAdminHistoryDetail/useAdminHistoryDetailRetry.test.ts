import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useAdminHistoryDetailRetry } from "@/hooks/admin/notifications/useAdminHistoryDetail/useAdminHistoryDetailRetry";
import * as api from "@/api/notifications";

vi.mock("@/api/notifications", () => ({
  retryFailedBroadcast: vi.fn(),
  getBroadcastDetail: vi.fn(),
  getBroadcastStatus: vi.fn(),
}));

describe("useAdminHistoryDetailRetry hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles retry", async () => {
    (api.retryFailedBroadcast as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ broadcast_id: 2 });
    (api.getBroadcastDetail as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 2 });
    (api.getBroadcastStatus as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ status: "C" });

    const setDetail = vi.fn();
    const setStatus = vi.fn();
    const onRetrySuccess = vi.fn();
    const { result } = renderHook(() => useAdminHistoryDetailRetry(1, setDetail, setStatus, onRetrySuccess));

    await act(async () => {
      await result.current.handleRetry();
    });

    expect(api.retryFailedBroadcast).toHaveBeenCalledWith(1);
    expect(onRetrySuccess).toHaveBeenCalledWith(2);
    expect(setDetail).toHaveBeenCalledWith({ id: 2 });
  });
});
