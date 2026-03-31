import { renderHook } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useAdminHistoryDetailFetch } from "@/hooks/admin/notifications/useAdminHistoryDetail";
import * as api from "@/api/notifications";

vi.mock("@/api/notifications", () => ({
  getBroadcastDetail: vi.fn(),
  getBroadcastStatus: vi.fn(),
}));

describe("useAdminHistoryDetailFetch hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches detail and status", () => {
    (api.getBroadcastDetail as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });
    (api.getBroadcastStatus as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ status: "C" });

    renderHook(() => useAdminHistoryDetailFetch(1));
    expect(api.getBroadcastDetail).toHaveBeenCalledWith(1);
    expect(api.getBroadcastStatus).toHaveBeenCalledWith(1);
  });
});
