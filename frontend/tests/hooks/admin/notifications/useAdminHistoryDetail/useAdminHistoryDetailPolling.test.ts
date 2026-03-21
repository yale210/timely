import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useAdminHistoryDetailPolling } from "@/hooks/admin/notifications/useAdminHistoryDetail/useAdminHistoryDetailPolling";
import * as api from "@/api/notifications";
import { type BroadcastJobStatusResponse } from "@/types";

vi.mock("@/api/notifications", () => ({
  getBroadcastStatus: vi.fn(),
}));

describe("useAdminHistoryDetailPolling hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("polls for status", () => {
    (api.getBroadcastStatus as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ status: "IN_PROGRESS" });
    const setStatus = vi.fn();
    renderHook(() => useAdminHistoryDetailPolling(1, { status: "QUEUED" } as BroadcastJobStatusResponse, setStatus));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(api.getBroadcastStatus).toHaveBeenCalledWith(1);
  });
});
